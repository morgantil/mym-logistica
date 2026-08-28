import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { liquidacionTransportistas, listarTarifasTransportista } from "./api";
import { formatearMonto, NOMBRES_MES } from "./formato";
import { TarifaTransportistaFormSheet } from "./tarifa-transportista-form-sheet";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

// Liquidación a transportistas — decisión 2026-08-26 (ver DOCUMENTO
// TECNICO.md historial): monto por viaje configurable, con historial de
// vigencia. El cálculo de cuántos viajes hizo cada chofer (§4.2
// TEMAS_PENDIENTES.md, construido 2026-08-28) sincroniza los estados reales
// desde SimpliRoute antes de traer el resumen — ver
// FacturacionService.liquidacionTransportistas.
export function TransportistasTab({ mes, anio }: { mes: number; anio: number }) {
  const [sheetAbierto, setSheetAbierto] = useState(false);

  const { data: tarifas, isLoading } = useQuery({
    queryKey: ["facturacion", "tarifa-transportista"],
    queryFn: listarTarifasTransportista,
  });

  const {
    data: resumen,
    isLoading: cargandoResumen,
    isFetching: sincronizando,
    refetch,
  } = useQuery({
    queryKey: ["facturacion", "liquidacion-transportistas", mes, anio],
    queryFn: () => liquidacionTransportistas(mes, anio),
  });

  const totalViajes = resumen?.reduce((total, r) => total + r.cantidadViajes, 0) ?? 0;
  const totalAPagar = resumen?.reduce((total, r) => total + r.totalAPagar, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Monto que se le paga a un transportista por cada viaje realizado (regla simple: sin 2×1 ni entrega
        unificada).
      </p>

      <div className="flex items-center justify-between">
        <h2 className="font-medium">Historial de tarifa por viaje</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setSheetAbierto(true)}>
          Nueva tarifa
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Monto por viaje</TableHead>
            <TableHead>Vigencia desde</TableHead>
            <TableHead>Vigencia hasta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : tarifas?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                Todavía no hay ninguna tarifa cargada.
              </TableCell>
            </TableRow>
          ) : (
            tarifas?.map((tarifa) => (
              <TableRow key={tarifa.id}>
                <TableCell>{formatearMonto(tarifa.monto)}</TableCell>
                <TableCell>{formatearFecha(tarifa.vigenciaDesde)}</TableCell>
                <TableCell>{tarifa.vigenciaHasta ? formatearFecha(tarifa.vigenciaHasta) : "Vigente"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between pt-2">
        <h2 className="font-medium">
          Liquidación — {NOMBRES_MES[mes - 1]} {anio}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sincronizando}
          onClick={() => refetch()}
        >
          {sincronizando ? "Sincronizando…" : "Recalcular"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Antes de calcular, se trae de SimpliRoute el estado real de los pedidos en curso — puede tardar unos
        segundos si hay muchos.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chofer</TableHead>
            <TableHead>Viajes</TableHead>
            <TableHead>Tarifa por viaje</TableHead>
            <TableHead>Total a pagar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cargandoResumen ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                {sincronizando ? "Sincronizando con SimpliRoute…" : "Cargando…"}
              </TableCell>
            </TableRow>
          ) : resumen?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Ningún pedido entregado con chofer asignado en este mes todavía.
              </TableCell>
            </TableRow>
          ) : (
            resumen?.map((r) => (
              <TableRow key={r.choferId}>
                <TableCell>{r.choferNombre}</TableCell>
                <TableCell>{r.cantidadViajes}</TableCell>
                <TableCell>{formatearMonto(r.tarifaPorViaje)}</TableCell>
                <TableCell>{formatearMonto(r.totalAPagar)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {resumen && resumen.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{totalViajes}</TableCell>
              <TableCell />
              <TableCell className="font-medium">{formatearMonto(totalAPagar)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>

      <TarifaTransportistaFormSheet abierto={sheetAbierto} onOpenChange={setSheetAbierto} />
    </div>
  );
}
