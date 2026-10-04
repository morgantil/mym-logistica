import { Fragment } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EstadoGrupoFacturacion } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CLASES_TONO } from "@/features/pedidos/estado-labels";
import { confirmar, descargarReporteMensual, generarVistaPrevia, listarGrupos, listarPedidosFacturados } from "./api";
import { formatearMonto, NOMBRES_MES } from "./formato";
import type { GrupoFacturacion, PedidoFacturado, ReglaAplicada } from "./tipos";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo completar la operación. Probá de nuevo en unos segundos.";
}

const TEXTO_REGLA: Record<ReglaAplicada, string> = {
  "2x1": "2×1",
  UNIFICADA: "Unificada",
  INDIVIDUAL: "Individual",
};

// Decisión 2026-09-27 (Leonardo: "graficar bien que estamos facturando
// unificado y luego el otro"): mismo color por regla en el badge de cada
// grupo Y en el encabezado de bloque de abajo — un solo sistema de colores,
// no dos que puedan desalinearse.
const TONO_REGLA: Record<ReglaAplicada, keyof typeof CLASES_TONO> = {
  UNIFICADA: "verde",
  "2x1": "ambar",
  INDIVIDUAL: "gris",
};

function BadgeRegla({ regla }: { regla: ReglaAplicada }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", CLASES_TONO[TONO_REGLA[regla]])}>
      {TEXTO_REGLA[regla]}
    </Badge>
  );
}

// Los grupos ya vienen ordenados UNIFICADA → 2×1 → INDIVIDUAL (ver
// FacturacionService.ordenarYNombrarGrupos, backend) — acá solo se detectan
// los cortes entre un bloque y el siguiente para poder ponerles un
// encabezado de sección con su propio subtotal, sin tocar el orden ni el
// cálculo. `reduce` en vez de agrupar por clave: si el orden alguna vez
// dejara de ser contiguo, esto lo respeta igual (nunca junta dos tramos
// separados de la misma regla en un solo bloque).
interface BloqueGrupos {
  regla: ReglaAplicada;
  grupos: GrupoFacturacion[];
  totalViajes: number;
  totalImporte: number;
}

function agruparEnBloques(grupos: GrupoFacturacion[]): BloqueGrupos[] {
  return grupos.reduce<BloqueGrupos[]>((bloques, grupo) => {
    const actual = bloques[bloques.length - 1];
    if (actual && actual.regla === grupo.reglaAplicada) {
      actual.grupos.push(grupo);
      actual.totalViajes += grupo.cantidadViajes;
      actual.totalImporte += grupo.importeCalculado;
    } else {
      bloques.push({
        regla: grupo.reglaAplicada,
        grupos: [grupo],
        totalViajes: grupo.cantidadViajes,
        totalImporte: grupo.importeCalculado,
      });
    }
    return bloques;
  }, []);
}

function EncabezadoBloque({ bloque }: { bloque: BloqueGrupos }) {
  return (
    <TableRow className={cn("hover:bg-transparent", CLASES_TONO[TONO_REGLA[bloque.regla]])}>
      <TableCell colSpan={8} className="py-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide uppercase">
            Facturando {TEXTO_REGLA[bloque.regla]}
          </span>
          <span className="text-xs font-medium">
            {bloque.grupos.length} {bloque.grupos.length === 1 ? "grupo" : "grupos"} ·{" "}
            {bloque.totalViajes} {bloque.totalViajes === 1 ? "viaje" : "viajes"} ·{" "}
            {formatearMonto(bloque.totalImporte)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LiquidacionTab({
  clienteId,
  mes,
  anio,
}: {
  clienteId: string | null;
  mes: number;
  anio: number;
}) {
  const queryClient = useQueryClient();

  const { data: grupos, isLoading } = useQuery({
    queryKey: ["facturacion", "grupos", clienteId, mes, anio],
    queryFn: () => listarGrupos(clienteId!, mes, anio),
    enabled: clienteId !== null,
  });

  // Decisión 2026-09-11: detalle por pedido visible en pantalla (antes solo
  // estaba en el Excel descargable) — Leonardo pidió más información para
  // quien hace la liquidación (Nº de pedido, Nº de afiliado, destinatario…).
  const { data: pedidosFacturados, isLoading: cargandoDetalle } = useQuery({
    queryKey: ["facturacion", "pedidos-facturados", clienteId, mes, anio],
    queryFn: () => listarPedidosFacturados(clienteId!, mes, anio),
    enabled: clienteId !== null,
  });

  const mutacionVistaPrevia = useMutation({
    mutationFn: () => generarVistaPrevia(clienteId!, mes, anio),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["facturacion", "grupos", clienteId, mes, anio] });
      queryClient.invalidateQueries({ queryKey: ["facturacion", "pedidos-facturados", clienteId, mes, anio] });
      if (resultado.excluidos.length > 0) {
        toast.warning(`Vista previa generada, pero ${resultado.excluidos.length} pedido(s) quedaron excluidos.`);
      } else {
        toast.success("Vista previa generada.");
      }
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionConfirmar = useMutation({
    mutationFn: () => confirmar(clienteId!, mes, anio),
    onSuccess: () => {
      toast.success("Liquidación confirmada. Ya quedó en firme.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "grupos", clienteId, mes, anio] });
      queryClient.invalidateQueries({ queryKey: ["facturacion", "pedidos-facturados", clienteId, mes, anio] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionDescargar = useMutation({
    mutationFn: () => descargarReporteMensual(clienteId!, mes, anio),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `facturacion-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
      enlace.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("No se pudo descargar el reporte. Probá de nuevo en unos segundos."),
  });

  if (clienteId === null) {
    return <p className="text-sm text-muted-foreground">Elegí un cliente arriba para generar su liquidación.</p>;
  }

  const hayGrupos = (grupos?.length ?? 0) > 0;
  const confirmado = hayGrupos && grupos!.every((grupo) => grupo.estado === EstadoGrupoFacturacion.CONFIRMADO);
  const totalViajes = grupos?.reduce((total, grupo) => total + grupo.cantidadViajes, 0) ?? 0;
  const totalImporte = grupos?.reduce((total, grupo) => total + grupo.importeCalculado, 0) ?? 0;

  // Un grupo puede juntar más de un pedido (2×1 entre pedidos distintos, o
  // unificación pañal+medicamento) — se agrupan las filas de detalle debajo
  // de una única cabecera con el importe del grupo, para no repetirlo ni
  // sumarlo dos veces en el total.
  const pedidosPorGrupo = new Map<string, PedidoFacturado[]>();
  for (const pedido of pedidosFacturados ?? []) {
    const lista = pedidosPorGrupo.get(pedido.grupoId) ?? [];
    lista.push(pedido);
    pedidosPorGrupo.set(pedido.grupoId, lista);
  }

  const cargando = isLoading || cargandoDetalle;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {NOMBRES_MES[mes - 1]} {anio}
          {confirmado && (
            <Badge variant="outline" className={cn("ml-2 border-transparent", CLASES_TONO.verde)}>
              Confirmada
            </Badge>
          )}
          {hayGrupos && !confirmado && (
            <Badge variant="outline" className={cn("ml-2 border-transparent", CLASES_TONO.ambar)}>
              Borrador
            </Badge>
          )}
        </p>
        <div className="flex gap-2">
          {hayGrupos && (
            <Button
              type="button"
              variant="outline"
              disabled={mutacionDescargar.isPending}
              onClick={() => mutacionDescargar.mutate()}
            >
              {mutacionDescargar.isPending ? "Generando…" : "Descargar reporte"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={mutacionVistaPrevia.isPending || confirmado}
            onClick={() => mutacionVistaPrevia.mutate()}
          >
            {mutacionVistaPrevia.isPending
              ? "Calculando…"
              : hayGrupos
                ? "Volver a calcular"
                : "Generar vista previa"}
          </Button>
          <Button
            type="button"
            disabled={!hayGrupos || confirmado || mutacionConfirmar.isPending}
            onClick={() => mutacionConfirmar.mutate()}
          >
            {mutacionConfirmar.isPending ? "Confirmando…" : "Confirmar"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead>Comentarios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : !hayGrupos ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Todavía no se generó una vista previa para este mes.
                </TableCell>
              </TableRow>
            ) : (
              agruparEnBloques(grupos!).map((bloque) => (
                <Fragment key={bloque.regla}>
                  <EncabezadoBloque bloque={bloque} />
                  {bloque.grupos.map((grupo) => (
                    <FilasGrupo key={grupo.id} grupo={grupo} pedidos={pedidosPorGrupo.get(grupo.id) ?? []} />
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
          {hayGrupos && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="font-medium">
                  Total
                </TableCell>
                <TableCell colSpan={2} className="font-medium">
                  {totalViajes} {totalViajes === 1 ? "viaje" : "viajes"} · {formatearMonto(totalImporte)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}

function FilasGrupo({ grupo, pedidos }: { grupo: GrupoFacturacion; pedidos: PedidoFacturado[] }) {
  return (
    <Fragment>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell colSpan={8}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BadgeRegla regla={grupo.reglaAplicada} />
              {grupo.nombreUnificacion && <span className="text-sm font-medium">{grupo.nombreUnificacion}</span>}
              {grupo.tarifaUtilizada !== null && (
                <span className="text-sm text-muted-foreground">Tarifa {formatearMonto(grupo.tarifaUtilizada)}</span>
              )}
              {grupo.porcentajeAplicado !== null && (
                <span className="text-sm text-muted-foreground">{grupo.porcentajeAplicado}%</span>
              )}
            </div>
            <span className="text-sm font-medium">
              {grupo.cantidadViajes} {grupo.cantidadViajes === 1 ? "viaje" : "viajes"} · {formatearMonto(grupo.importeCalculado)}
            </span>
          </div>
        </TableCell>
      </TableRow>
      {pedidos.map((pedido) => (
        <TableRow key={pedido.pedidoId}>
          <TableCell className="whitespace-nowrap">{pedido.numero}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.numeroAfiliado}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.destinatarioNombre}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.direccion}</TableCell>
          <TableCell className="whitespace-nowrap">{formatearFecha(pedido.fechaProgramada)}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.zonaTarifariaNombre ?? "—"}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.choferNombre ?? "Sin asignar"}</TableCell>
          <TableCell className="whitespace-nowrap">{pedido.comentario ?? "—"}</TableCell>
        </TableRow>
      ))}
    </Fragment>
  );
}
