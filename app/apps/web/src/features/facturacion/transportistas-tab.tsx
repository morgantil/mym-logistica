import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CabaProvincia } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarChoferes } from "@/features/zonas-choferes/api";
import {
  actualizarTarifaTransportista,
  descargarReporteTransportistas,
  eliminarJornada,
  guardarJornada,
  liquidacionTransportistas,
  listarJornadas,
  listarTarifasTransportista,
  type RangoFechas,
} from "./api";
import { calcularHorasJornada, formatearMonto, NOMBRES_MES } from "./formato";
import { TarifaTransportistaFormSheet } from "./tarifa-transportista-form-sheet";
import type { JornadaChofer, TarifaTransportista } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Primer y último día del mes, en formato YYYY-MM-DD — mismo mes/año que ya
// filtra el resto de la pantalla.
function limitesDelMes(mes: number, anio: number): { fechaDesde: string; fechaHasta: string } {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    fechaDesde: `${anio}-${pad(mes)}-01`,
    fechaHasta: `${anio}-${pad(mes)}-${pad(ultimoDia)}`,
  };
}

const MAX_DIAS_RANGO_EXCEL = 31;
const MS_POR_DIA = 86_400_000;

const ETIQUETA_ZONA: Record<CabaProvincia, string> = {
  [CabaProvincia.CABA]: "CABA",
  [CabaProvincia.PROVINCIA]: "Provincia",
};

// Liquidación a transportistas — decisión 2026-08-26 (ver DOCUMENTO
// TECNICO.md historial): monto por viaje configurable. Decisión 2026-09-11:
// sin historial de vigencia. Decisión 2026-10-04 (reunión con el cliente):
// una tarifa por zona (CABA/Provincia), no un único monto global — el
// cálculo de cuántos viajes hizo cada chofer (§4.2 TEMAS_PENDIENTES.md,
// construido 2026-08-28) sincroniza los estados reales desde SimpliRoute
// antes de traer el resumen — ver FacturacionService.liquidacionTransportistas.
export function TransportistasTab({
  mes,
  anio,
  rango,
}: {
  mes: number;
  anio: number;
  rango?: RangoFechas;
}) {
  const [zonaDelSheet, setZonaDelSheet] = useState<CabaProvincia | null>(null);
  // Decisión 2026-10-06 (reunión con Pablo Renzo): rango LIBRE para el
  // Excel, independiente del mes/año elegido arriba en la página (ese sigue
  // acotado al mes, ver facturacion-page.tsx) — hasta 31 días, puede cruzar
  // de un mes a otro, el backend valida el tope igual.
  const [fechaDesdeExcel, setFechaDesdeExcel] = useState("");
  const [fechaHastaExcel, setFechaHastaExcel] = useState("");
  const queryClient = useQueryClient();

  const { data: tarifas, isLoading } = useQuery({
    queryKey: ["facturacion", "tarifa-transportista"],
    queryFn: listarTarifasTransportista,
  });
  const tarifaPorZona = (zona: CabaProvincia): TarifaTransportista | null =>
    tarifas?.find((t) => t.zona === zona) ?? null;

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
    queryKey: ["facturacion", "liquidacion-transportistas", mes, anio, rango],
    queryFn: () => liquidacionTransportistas(mes, anio, rango),
  });

  const rangoExcelInvalido =
    fechaDesdeExcel !== "" &&
    fechaHastaExcel !== "" &&
    Math.round((new Date(fechaHastaExcel).getTime() - new Date(fechaDesdeExcel).getTime()) / MS_POR_DIA) + 1 >
      MAX_DIAS_RANGO_EXCEL;

  const mutacionDescargar = useMutation({
    mutationFn: () =>
      descargarReporteTransportistas(
        mes,
        anio,
        fechaDesdeExcel && fechaHastaExcel ? { fechaDesde: fechaDesdeExcel, fechaHasta: fechaHastaExcel } : undefined,
      ),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `liquidacion-transportistas-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
      enlace.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("No se pudo descargar el reporte. Probá de nuevo en unos segundos."),
  });

  const totalViajes = resumen?.reduce((total, r) => total + r.viajesCaba + r.viajesProvincia, 0) ?? 0;
  const totalAPagar = resumen?.reduce((total, r) => total + r.totalAPagar, 0) ?? 0;

  // Item 4.4 TEMAS_PENDIENTES.md: inicio/fin de recorrido cargado a mano por
  // chofer+día (SimpliRoute lo modela como Route.start_time/end_time, pero
  // requeriría recibir webhooks — no implementado, se eligió carga manual).
  const { fechaDesde: fechaDesdeMes, fechaHasta: fechaHastaMes } = limitesDelMes(mes, anio);
  const { data: choferes } = useQuery({ queryKey: ["zonas-choferes", "choferes"], queryFn: listarChoferes });
  const { data: jornadas } = useQuery({
    queryKey: ["facturacion", "jornadas-choferes", fechaDesdeMes, fechaHastaMes],
    queryFn: () => listarJornadas(fechaDesdeMes, fechaHastaMes),
  });

  const [choferIdJornada, setChoferIdJornada] = useState("");
  const [fechaJornada, setFechaJornada] = useState("");
  const [horaInicioJornada, setHoraInicioJornada] = useState("");
  const [horaFinJornada, setHoraFinJornada] = useState("");

  const mutacionGuardarJornada = useMutation({
    mutationFn: () =>
      guardarJornada({
        choferId: choferIdJornada,
        fecha: fechaJornada,
        horaInicio: horaInicioJornada || null,
        horaFin: horaFinJornada || null,
      }),
    onSuccess: () => {
      toast.success("Jornada guardada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "jornadas-choferes"] });
      setChoferIdJornada("");
      setFechaJornada("");
      setHoraInicioJornada("");
      setHoraFinJornada("");
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionEliminarJornada = useMutation({
    mutationFn: (id: string) => eliminarJornada(id),
    onSuccess: () => {
      toast.success("Jornada eliminada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "jornadas-choferes"] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  function editarJornada(jornada: JornadaChofer) {
    setChoferIdJornada(jornada.choferId);
    setFechaJornada(jornada.fecha.slice(0, 10));
    setHoraInicioJornada(jornada.horaInicio ?? "");
    setHoraFinJornada(jornada.horaFin ?? "");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Monto que se le paga a un transportista por cada viaje realizado (regla simple: sin 2×1 ni entrega
        unificada) — distinto para CABA y para Provincia.
      </p>

      <div className="flex items-center justify-between">
        <h2 className="font-medium">Tarifa por viaje, por zona</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zona</TableHead>
            <TableHead>Monto por viaje</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : (
            Object.values(CabaProvincia).map((zona) => {
              const tarifa = tarifaPorZona(zona);
              return (
                <TableRow key={zona}>
                  <TableCell>{ETIQUETA_ZONA[zona]}</TableCell>
                  <TableCell>
                    {tarifa ? formatearMonto(tarifa.monto) : <span className="text-muted-foreground">Sin cargar</span>}
                  </TableCell>
                  <TableCell>
                    {tarifa ? (
                      tarifa.activa ? (
                        <Badge variant="secondary">Activa</Badge>
                      ) : (
                        <Badge variant="outline">Inactiva</Badge>
                      )
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setZonaDelSheet(zona)}>
                      {tarifa ? "Editar tarifa" : "Nueva tarifa"}
                    </Button>
                    {tarifa && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={mutacionActiva.isPending}
                        onClick={() => mutacionActiva.mutate({ id: tarifa.id, activa: !tarifa.activa })}
                      >
                        {tarifa.activa ? "Desactivar" : "Activar"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="desde-excel-transportistas" className="text-sm text-muted-foreground">
            Descargar Excel — Desde
          </label>
          <Input
            id="desde-excel-transportistas"
            type="date"
            max={fechaHastaExcel || undefined}
            value={fechaDesdeExcel}
            onChange={(e) => setFechaDesdeExcel(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta-excel-transportistas" className="text-sm text-muted-foreground">
            Hasta
          </label>
          <Input
            id="hasta-excel-transportistas"
            type="date"
            min={fechaDesdeExcel || undefined}
            value={fechaHastaExcel}
            onChange={(e) => setFechaHastaExcel(e.target.value)}
            className="w-40"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={mutacionDescargar.isPending || rangoExcelInvalido}
          onClick={() => mutacionDescargar.mutate()}
        >
          {mutacionDescargar.isPending ? "Generando…" : "Descargar Excel"}
        </Button>
      </div>
      {rangoExcelInvalido && (
        <p className="text-sm text-destructive -mt-2">El rango no puede superar los {MAX_DIAS_RANGO_EXCEL} días.</p>
      )}
      {!rangoExcelInvalido && (fechaDesdeExcel === "" || fechaHastaExcel === "") && (
        <p className="text-sm text-muted-foreground -mt-2">
          Sin fechas, el Excel baja {NOMBRES_MES[mes - 1]} {anio} completo.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chofer</TableHead>
            <TableHead>Viajes CABA</TableHead>
            <TableHead>Viajes Provincia</TableHead>
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
                <TableCell>{r.viajesCaba}</TableCell>
                <TableCell>{r.viajesProvincia}</TableCell>
                <TableCell>{formatearMonto(r.totalAPagar)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {resumen && resumen.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium" colSpan={2}>
                {totalViajes} viajes
              </TableCell>
              <TableCell className="font-medium">{formatearMonto(totalAPagar)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>

      <div className="flex items-center justify-between pt-2">
        <h2 className="font-medium">
          Jornadas de choferes — {NOMBRES_MES[mes - 1]} {anio}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Carga manual de inicio y fin de recorrido por chofer y día — no viene de SimpliRoute.
      </p>

      <div className="flex flex-col gap-3 rounded-md border p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="chofer-jornada" className="text-sm text-muted-foreground">
              Chofer
            </label>
            <Select value={choferIdJornada} onValueChange={setChoferIdJornada}>
              <SelectTrigger id="chofer-jornada" className="w-48">
                <SelectValue placeholder="Elegí un chofer" />
              </SelectTrigger>
              <SelectContent>
                {choferes?.map((chofer) => (
                  <SelectItem key={chofer.id} value={String(chofer.id)}>
                    {chofer.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fecha-jornada" className="text-sm text-muted-foreground">
              Fecha
            </label>
            <Input
              id="fecha-jornada"
              type="date"
              value={fechaJornada}
              onChange={(e) => setFechaJornada(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hora-inicio-jornada" className="text-sm text-muted-foreground">
              Hora de inicio
            </label>
            <Input
              id="hora-inicio-jornada"
              type="time"
              value={horaInicioJornada}
              onChange={(e) => setHoraInicioJornada(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hora-fin-jornada" className="text-sm text-muted-foreground">
              Hora de fin
            </label>
            <Input
              id="hora-fin-jornada"
              type="time"
              value={horaFinJornada}
              onChange={(e) => setHoraFinJornada(e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            type="button"
            disabled={!choferIdJornada || !fechaJornada || mutacionGuardarJornada.isPending}
            onClick={() => mutacionGuardarJornada.mutate()}
          >
            {mutacionGuardarJornada.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chofer</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora de inicio</TableHead>
            <TableHead>Hora de fin</TableHead>
            <TableHead>Total de horas</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jornadas?.length === 0 || !jornadas ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                Sin jornadas cargadas en {NOMBRES_MES[mes - 1]} {anio} todavía.
              </TableCell>
            </TableRow>
          ) : (
            jornadas.map((jornada) => {
              const horas = calcularHorasJornada(jornada.horaInicio, jornada.horaFin);
              return (
                <TableRow key={jornada.id}>
                  <TableCell>{jornada.choferNombre}</TableCell>
                  <TableCell>{new Date(jornada.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
                  <TableCell>{jornada.horaInicio ?? "—"}</TableCell>
                  <TableCell>{jornada.horaFin ?? "—"}</TableCell>
                  <TableCell>{horas !== null ? `${horas}hs` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => editarJornada(jornada)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={mutacionEliminarJornada.isPending}
                        onClick={() => mutacionEliminarJornada.mutate(jornada.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TarifaTransportistaFormSheet
        tarifa={zonaDelSheet ? tarifaPorZona(zonaDelSheet) : null}
        zona={zonaDelSheet ?? CabaProvincia.CABA}
        abierto={zonaDelSheet !== null}
        onOpenChange={(abierto) => !abierto && setZonaDelSheet(null)}
      />
    </div>
  );
}
