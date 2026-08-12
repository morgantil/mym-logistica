import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EstadoGrupoFacturacion } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CLASES_TONO } from "@/features/pedidos/estado-labels";
import { confirmar, descargarReporteMensual, generarVistaPrevia, listarGrupos } from "./api";
import { formatearMonto, NOMBRES_MES } from "./formato";
import type { ReglaAplicada } from "./tipos";

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

function BadgeRegla({ regla }: { regla: ReglaAplicada }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", CLASES_TONO.gris)}>
      {TEXTO_REGLA[regla]}
    </Badge>
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

  const mutacionVistaPrevia = useMutation({
    mutationFn: () => generarVistaPrevia(clienteId!, mes, anio),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["facturacion", "grupos", clienteId, mes, anio] });
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
  const totalPedidos = grupos?.reduce((total, grupo) => total + grupo.pedidoIds.length, 0) ?? 0;
  const totalImporte = grupos?.reduce((total, grupo) => total + grupo.importeCalculado, 0) ?? 0;

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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Regla aplicada</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Tarifa utilizada</TableHead>
            <TableHead>Porcentaje aplicado</TableHead>
            <TableHead>Importe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : !hayGrupos ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                Todavía no se generó una vista previa para este mes.
              </TableCell>
            </TableRow>
          ) : (
            grupos!.map((grupo) => (
              <TableRow key={grupo.id}>
                <TableCell>
                  <BadgeRegla regla={grupo.reglaAplicada} />
                </TableCell>
                <TableCell>{grupo.pedidoIds.length}</TableCell>
                <TableCell>{grupo.tarifaUtilizada !== null ? formatearMonto(grupo.tarifaUtilizada) : "—"}</TableCell>
                <TableCell>{grupo.porcentajeAplicado !== null ? `${grupo.porcentajeAplicado}%` : "—"}</TableCell>
                <TableCell>{formatearMonto(grupo.importeCalculado)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {hayGrupos && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{totalPedidos}</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="font-medium">{formatearMonto(totalImporte)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
