import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { eliminarPedido, eliminarPedidos, enviarASimpliRoute, revisarPendientesDeEnvio } from "./api";
import { estadoBorrable } from "./estado-labels";
import { ResolverDireccionSheet } from "./resolver-direccion-sheet";
import type { PedidoListado } from "./tipos";

const SENTINEL_TODOS = "TODOS";
const MOTIVO_DIRECCION = "Dirección distinta a la registrada en el padrón";

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
  // Filtro por cliente (decisión 2026-09-16, pedido de Leonardo) — client-side
  // sobre lo que ya devuelve el endpoint: la lista de "pendientes de enviar"
  // no pagina ni es grande, no hace falta ida y vuelta al backend para esto.
  const [clienteId, setClienteId] = useState(SENTINEL_TODOS);
  const [pedidoAResolverDireccion, setPedidoAResolverDireccion] = useState<PedidoListado | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pedidos", "revision"],
    queryFn: revisarPendientesDeEnvio,
  });

  const clientesEnRevision = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const { pedido } of data ?? []) mapa.set(pedido.clienteId, pedido.clienteNombre);
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  const dataFiltrada = useMemo(
    () => (clienteId === SENTINEL_TODOS ? data : data?.filter(({ pedido }) => pedido.clienteId === clienteId)),
    [data, clienteId],
  );

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

  const listos = dataFiltrada?.filter((item) => item.erroresBloqueantes.length === 0) ?? [];

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
              {clientesEnRevision.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    `¿Borrar ${seleccionados.size} pedido(s)? Solo se borran los que todavía no llegaron a SimpliRoute.`,
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
          {dataFiltrada?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                No hay pedidos pendientes de enviar para este cliente.
              </TableCell>
            </TableRow>
          ) : (
            dataFiltrada?.map(({ pedido, erroresBloqueantes }) => {
            const bloqueado = erroresBloqueantes.length > 0;
            const puedeBorrarEste = puedeEliminar && estadoBorrable(pedido.estadoSimpliroute);
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
                    <div className="flex flex-wrap items-center gap-1">
                      {erroresBloqueantes.map((error) => (
                        <Badge key={error} variant="destructive">
                          {error}
                        </Badge>
                      ))}
                      {erroresBloqueantes.some((error) => error.includes(MOTIVO_DIRECCION)) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPedidoAResolverDireccion(pedido)}
                        >
                          Resolver
                        </Button>
                      )}
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
            })
          )}
        </TableBody>
      </Table>

      <ResolverDireccionSheet
        pedido={pedidoAResolverDireccion}
        onOpenChange={(abierto) => !abierto && setPedidoAResolverDireccion(null)}
      />
    </div>
  );
}
