import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarTarifaTransportista, liquidacionTransportistas, listarTarifasTransportista } from "./api";
import { formatearMonto, NOMBRES_MES } from "./formato";
import { TarifaTransportistaFormSheet } from "./tarifa-transportista-form-sheet";
import type { TarifaTransportista } from "./tipos";

// Liquidación a transportistas — decisión 2026-08-26 (ver DOCUMENTO
// TECNICO.md historial): monto por viaje configurable. Decisión 2026-09-11:
// sin historial de vigencia — un único registro, editable, con toggle
// activa/inactiva. El cálculo de cuántos viajes hizo cada chofer (§4.2
// TEMAS_PENDIENTES.md, construido 2026-08-28) sincroniza los estados reales
// desde SimpliRoute antes de traer el resumen — ver
// FacturacionService.liquidacionTransportistas.
export function TransportistasTab({ mes, anio }: { mes: number; anio: number }) {
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const queryClient = useQueryClient();

  const { data: tarifas, isLoading } = useQuery({
    queryKey: ["facturacion", "tarifa-transportista"],
    queryFn: listarTarifasTransportista,
  });
  const tarifaActual: TarifaTransportista | null = tarifas?.[0] ?? null;

  const mutacionActiva = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) => actualizarTarifaTransportista(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifa-transportista"] }),
    onError: () => toast.error("No se pudo cambiar el estado."),
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
        <h2 className="font-medium">Tarifa por viaje</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setSheetAbierto(true)}>
          {tarifaActual ? "Editar tarifa" : "Nueva tarifa"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Monto por viaje</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
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
                <TableCell>
                  {tarifa.activa ? <Badge variant="secondary">Activa</Badge> : <Badge variant="outline">Inactiva</Badge>}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={mutacionActiva.isPending}
                    onClick={() => mutacionActiva.mutate({ id: tarifa.id, activa: !tarifa.activa })}
                  >
                    {tarifa.activa ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
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

      <TarifaTransportistaFormSheet
        tarifa={sheetAbierto ? tarifaActual : null}
        abierto={sheetAbierto}
        onOpenChange={setSheetAbierto}
      />
    </div>
  );
}
