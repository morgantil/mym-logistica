import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoGastoChofer } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectorArchivo } from "@/components/shell/selector-archivo";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarChoferes } from "@/features/zonas-choferes/api";
import { formatearMonto, NOMBRES_MES } from "@/features/facturacion/formato";
import {
  asignarChofer,
  descargarReporteGastos,
  eliminarGasto,
  importarGastos,
  listarGastos,
  type FiltroGastos,
} from "./api";
import { GastoFormSheet } from "./gasto-form-sheet";
import type { GastoChofer } from "./tipos";

const HOY = new Date();
const TODOS = "TODOS";

const ETIQUETA_TIPO: Record<TipoGastoChofer, string> = {
  [TipoGastoChofer.COMBUSTIBLE]: "Combustible",
  [TipoGastoChofer.PEAJE]: "Peaje",
};

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo completar la operación. Probá de nuevo en unos segundos.";
}

// ABM de combustible y peajes por chofer (ítem desbloqueado 2026-10-05) —
// se importa el Excel real tal cual lo manda la tarjeta de combustible (dos
// hojas: HWCompra-modelo y PEAJES), matcheando la columna CHOFER contra los
// choferes reales de SimpliRoute. Lo que no matchea queda en una cola para
// resolver a mano (ver ResolverChoferCelda más abajo).
export function GastosChoferesPage() {
  const queryClient = useQueryClient();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [mesImportacion, setMesImportacion] = useState(HOY.getMonth() + 1);
  const [anioImportacion, setAnioImportacion] = useState(HOY.getFullYear());

  const [tipo, setTipo] = useState<string>(TODOS);
  const [choferId, setChoferId] = useState<string>(TODOS);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [soloSinAsignar, setSoloSinAsignar] = useState(false);
  const [gastoEnEdicion, setGastoEnEdicion] = useState<GastoChofer | "nuevo" | null>(null);

  const { data: choferes } = useQuery({ queryKey: ["zonas-choferes", "choferes"], queryFn: listarChoferes });

  const filtro: FiltroGastos = {
    tipo: tipo === TODOS ? undefined : (tipo as TipoGastoChofer),
    choferId: choferId === TODOS ? undefined : choferId,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    soloSinAsignar: soloSinAsignar || undefined,
  };

  const { data: gastos, isLoading } = useQuery({
    queryKey: ["gastos-choferes", filtro],
    queryFn: () => listarGastos(filtro),
  });

  const mutacionImportar = useMutation({
    mutationFn: () => importarGastos(archivo!, mesImportacion, anioImportacion),
    onSuccess: (resumen) => {
      setArchivo(null);
      queryClient.invalidateQueries({ queryKey: ["gastos-choferes"] });
      for (const r of resumen) {
        if (r.totalFilas === 0) continue;
        const texto = `${ETIQUETA_TIPO[r.tipo]}: ${r.totalFilas} cargados, ${r.matcheados} con chofer, ${r.sinMatchear} sin asignar.`;
        if (r.sinMatchear > 0) toast.warning(texto);
        else toast.success(texto);
      }
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionDescargar = useMutation({
    mutationFn: () => descargarReporteGastos(filtro),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "combustible-y-peajes.xlsx";
      enlace.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("No se pudo descargar el reporte."),
  });

  const mutacionEliminar = useMutation({
    mutationFn: (id: string) => eliminarGasto(id),
    onSuccess: () => {
      toast.success("Gasto eliminado.");
      queryClient.invalidateQueries({ queryKey: ["gastos-choferes"] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  function confirmarEliminar(gasto: GastoChofer) {
    if (window.confirm(`¿Eliminar este gasto de ${formatearMonto(gasto.monto)}? No se puede deshacer desde acá.`)) {
      mutacionEliminar.mutate(gasto.id);
    }
  }

  const total = gastos?.reduce((suma, gasto) => suma + gasto.monto, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Combustible y Peajes</h1>

      <div className="flex flex-col gap-3 rounded-md border p-3">
        <h2 className="font-medium">Importar Excel</h2>
        <p className="text-sm text-muted-foreground">
          El mismo archivo que manda la tarjeta de combustible (hojas "HWCompra-modelo" y "PEAJES"). Mes/año
          son obligatorios porque la hoja de peajes no trae fecha por fila — aplica a todas sus líneas.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Mes</span>
            <Select value={String(mesImportacion)} onValueChange={(v) => setMesImportacion(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOMBRES_MES.map((nombre, i) => (
                  <SelectItem key={nombre} value={String(i + 1)}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Año</span>
            <Input
              type="number"
              className="w-24"
              value={anioImportacion}
              onChange={(e) => setAnioImportacion(Number(e.target.value))}
            />
          </div>
          <SelectorArchivo
            id="archivo-gastos-choferes"
            accept=".xlsx"
            archivo={archivo}
            onChange={setArchivo}
            disabled={mutacionImportar.isPending}
          />
          <Button
            type="button"
            disabled={!archivo || mutacionImportar.isPending}
            onClick={() => mutacionImportar.mutate()}
          >
            {mutacionImportar.isPending ? "Importando…" : "Importar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {Object.values(TipoGastoChofer).map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ETIQUETA_TIPO[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Chofer</span>
          <Select value={choferId} onValueChange={setChoferId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {choferes?.map((chofer) => (
                <SelectItem key={chofer.id} value={String(chofer.id)}>
                  {chofer.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Desde</span>
          <Input type="date" className="w-40" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Hasta</span>
          <Input type="date" className="w-40" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <Checkbox checked={soloSinAsignar} onCheckedChange={(v) => setSoloSinAsignar(v === true)} />
          Solo sin asignar
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={mutacionDescargar.isPending || (gastos?.length ?? 0) === 0}
          onClick={() => mutacionDescargar.mutate()}
        >
          {mutacionDescargar.isPending ? "Generando…" : "Descargar Excel"}
        </Button>
        <Button type="button" onClick={() => setGastoEnEdicion("nuevo")}>
          Nuevo gasto
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Chofer</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Comprobante</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : gastos?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                No hay gastos para estos filtros.
              </TableCell>
            </TableRow>
          ) : (
            gastos?.map((gasto) => (
              <TableRow key={gasto.id}>
                <TableCell>{new Date(gasto.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
                <TableCell>{ETIQUETA_TIPO[gasto.tipo]}</TableCell>
                <TableCell>
                  {gasto.choferId ? (
                    gasto.choferNombre
                  ) : (
                    <ResolverChoferCelda gastoId={gasto.id} textoOriginal={gasto.choferNombreOriginal} />
                  )}
                </TableCell>
                <TableCell>{gasto.proveedor ?? "—"}</TableCell>
                <TableCell>{gasto.comprobante ?? "—"}</TableCell>
                <TableCell className="text-right">{formatearMonto(gasto.monto)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setGastoEnEdicion(gasto)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={mutacionEliminar.isPending}
                      onClick={() => confirmarEliminar(gasto)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {gastos && gastos.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-medium">
                Total
              </TableCell>
              <TableCell className="text-right font-medium">{formatearMonto(total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>

      <GastoFormSheet
        gasto={gastoEnEdicion !== "nuevo" ? gastoEnEdicion : null}
        abierto={gastoEnEdicion !== null}
        onOpenChange={(abierto) => !abierto && setGastoEnEdicion(null)}
      />
    </div>
  );
}

// Un gasto sin chofer matcheado (texto raro, patente sin vehículo, un par de
// choferes tipo "LUCIA-MATIAS") se resuelve eligiendo el chofer real acá —
// mismo criterio que ResolverDireccionDialog en Pedidos.
function ResolverChoferCelda({ gastoId, textoOriginal }: { gastoId: string; textoOriginal: string }) {
  const queryClient = useQueryClient();
  const { data: choferes } = useQuery({ queryKey: ["zonas-choferes", "choferes"], queryFn: listarChoferes });

  const mutacion = useMutation({
    mutationFn: (choferId: string) => asignarChofer(gastoId, choferId),
    onSuccess: () => {
      toast.success("Chofer asignado.");
      queryClient.invalidateQueries({ queryKey: ["gastos-choferes"] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
        Sin asignar: "{textoOriginal}"
      </Badge>
      <Select onValueChange={(valor) => mutacion.mutate(valor)} disabled={mutacion.isPending}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Asignar a…" />
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
  );
}
