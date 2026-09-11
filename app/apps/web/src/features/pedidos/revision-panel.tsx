import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { eliminarPedido, eliminarPedidos, enviarASimpliRoute, revisarPendientesDeEnvio } from "./api";

// §17-18 funcional: candidatos a envío con sus motivos bloqueantes, selección
// y envío masivo a SimpliRoute (un pedido inválido no frena a los demás).
// Decisión 2026-09-11: se le suma borrado (individual con X, o en lote sobre
// la misma selección) — solo se puede borrar un pedido que todavía no se
// mandó a SimpliRoute (ver validar-eliminacion.ts), independiente de si
// tiene o no motivos bloqueantes para el envío (son reglas distintas).
export function RevisionPanel() {
  const { usuario } = useAuth();
  const puedeEnviar = Boolean(
    usuario?.roles.some((rol) => rol === "OPERACIONES" || rol === "ADMINISTRACION"),
  );
  const puedeEliminar = Boolean(
    usuario?.roles.some((rol) => rol === "OPERACIONES" || rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );

  const queryClient = useQueryClient();
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pedidos", "revision"],
    queryFn: revisarPendientesDeEnvio,
  });

  const mutacion = useMutation({
    mutationFn: enviarASimpliRoute,
    onSuccess: (resultado) => {
      if (resultado.enviados.length > 0) {
        toast.success(`${resultado.enviados.length} pedido(s) enviado(s) a SimpliRoute.`);
      }
      if (resultado.errores.length > 0) {
        toast.error(`${resultado.errores.length} pedido(s) no se pudieron enviar. Revisá el detalle abajo.`);
      }
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => {
      toast.error("No se pudo enviar. Probá de nuevo en unos segundos.");
    },
  });

  const mutacionEliminarUno = useMutation({
    mutationFn: eliminarPedido,
    onSuccess: () => {
      toast.success("Pedido borrado.");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => toast.error("No se pudo borrar — ¿ya se envió a SimpliRoute?"),
  });

  const mutacionEliminarVarios = useMutation({
    mutationFn: eliminarPedidos,
    onSuccess: (resultado) => {
      if (resultado.eliminados.length > 0) {
        toast.success(`${resultado.eliminados.length} pedido(s) borrado(s).`);
      }
      if (resultado.errores.length > 0) {
        toast.error(`${resultado.errores.length} pedido(s) no se pudieron borrar (¿ya enviados?).`);
      }
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => toast.error("No se pudo borrar. Probá de nuevo en unos segundos."),
  });

  function alternarSeleccion(pedidoId: string) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(pedidoId)) nuevo.delete(pedidoId);
      else nuevo.add(pedidoId);
      return nuevo;
    });
  }

  const listos = data?.filter((item) => item.erroresBloqueantes.length === 0) ?? [];

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No se pudo cargar la revisión. Probá de nuevo en unos segundos.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay pedidos pendientes de enviar.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSeleccionados(new Set(listos.map((item) => item.pedido.id)))}
          >
            Seleccionar los {listos.length} listos
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSeleccionados(new Set())}>
            Limpiar selección
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {puedeEnviar && (
            <Button
              type="button"
              disabled={seleccionados.size === 0 || mutacion.isPending}
              onClick={() => mutacion.mutate(Array.from(seleccionados))}
            >
              {mutacion.isPending ? "Enviando…" : `Enviar seleccionados (${seleccionados.size})`}
            </Button>
          )}
          {puedeEliminar && (
            <Button
              type="button"
              variant="destructive"
              disabled={seleccionados.size === 0 || mutacionEliminarVarios.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `¿Borrar ${seleccionados.size} pedido(s)? Solo se borran los que todavía no se mandaron a SimpliRoute.`,
                  )
                ) {
                  mutacionEliminarVarios.mutate(Array.from(seleccionados));
                }
              }}
            >
              {mutacionEliminarVarios.isPending ? "Borrando…" : `Borrar seleccionados (${seleccionados.size})`}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Cliente</TableHead>
            <TableHead>Destinatario</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Motivos bloqueantes</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(({ pedido, erroresBloqueantes }) => {
            const bloqueado = erroresBloqueantes.length > 0;
            const puedeBorrarEste = puedeEliminar && pedido.estadoSimpliroute === "NO_ENVIADO";
            return (
              <TableRow key={pedido.id}>
                <TableCell>
                  <Checkbox
                    checked={seleccionados.has(pedido.id)}
                    onCheckedChange={() => alternarSeleccion(pedido.id)}
                    disabled={!puedeEnviar && !puedeEliminar}
                    aria-label={`Seleccionar pedido de ${pedido.destinatarioNombre}`}
                  />
                </TableCell>
                <TableCell>{pedido.clienteNombre}</TableCell>
                <TableCell>{pedido.destinatarioNombre}</TableCell>
                <TableCell>{pedido.direccionUsada}</TableCell>
                <TableCell>
                  {new Date(pedido.fechaProgramada).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                </TableCell>
                <TableCell>
                  {bloqueado ? (
                    <div className="flex flex-wrap gap-1">
                      {erroresBloqueantes.map((error) => (
                        <Badge key={error} variant="destructive">
                          {error}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                    >
                      Listo para enviar
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {puedeBorrarEste && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Borrar pedido"
                      aria-label={`Borrar pedido de ${pedido.destinatarioNombre}`}
                      disabled={mutacionEliminarUno.isPending}
                      onClick={() => {
                        if (window.confirm(`¿Borrar el pedido de ${pedido.destinatarioNombre}?`)) {
                          mutacionEliminarUno.mutate(pedido.id);
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
