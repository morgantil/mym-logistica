import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarTarifasTransportista } from "./api";
import { formatearMonto } from "./formato";
import { TarifaTransportistaFormSheet } from "./tarifa-transportista-form-sheet";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

// Liquidación a transportistas — decisión 2026-08-26 (ver DOCUMENTO
// TECNICO.md historial): en vez de un valor fijo en código, es un monto
// configurable acá, con historial de vigencia. El *cálculo* de cuántos
// viajes hizo cada chofer (para multiplicar por este monto) todavía no está
// construido — depende de sincronizar Rutas/Viajes desde SimpliRoute, que
// hoy no se sincronizan (ver TEMAS_PENDIENTES.md sección 2).
export function TransportistasTab() {
  const [sheetAbierto, setSheetAbierto] = useState(false);

  const { data: tarifas, isLoading } = useQuery({
    queryKey: ["facturacion", "tarifa-transportista"],
    queryFn: listarTarifasTransportista,
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Monto que se le paga a un transportista por cada viaje realizado (regla simple: sin 2×1 ni entrega
        unificada). Solo administra el valor — todavía no calcula cuántos viajes hizo cada chofer.
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

      <TarifaTransportistaFormSheet abierto={sheetAbierto} onOpenChange={setSheetAbierto} />
    </div>
  );
}
