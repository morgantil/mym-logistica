import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EstadoPedido } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { imprimirPdf } from "@/lib/imprimir-pdf";
import { listarClientesActivos } from "@/features/clientes/api";
import { listarPedidos } from "@/features/pedidos/api";
import { BultosCelda } from "@/features/pedidos/bultos-celda";
import { BadgeEstadoPedido, LABEL_ESTADO_PEDIDO } from "@/features/pedidos/estado-labels";
import { descargarEtiquetas, descargarRemito } from "./api";

const HOY = new Date().toISOString().slice(0, 10);
const TODOS = "TODOS";

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

// §8.1 funcional v6: pantalla para que Logística cargue la cantidad de
// bultos e imprima etiquetas antes de despachar — filtra por fecha de
// entrega, cliente y estado, distinto de la grilla general de Pedidos.
export function EmbalajeDespachoPage() {
  const queryClient = useQueryClient();
  const [fecha, setFecha] = useState(HOY);
  const [clienteId, setClienteId] = useState<string>(TODOS);
  const [estado, setEstado] = useState<string>(TODOS);
  const [imprimiendoEtiquetas, setImprimiendoEtiquetas] = useState<string | null>(null);
  const [imprimiendoRemito, setImprimiendoRemito] = useState<string | null>(null);

  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });

  const { data: pagina, isLoading, isError } = useQuery({
    queryKey: ["pedidos", "embalaje-despacho", fecha, clienteId, estado],
    queryFn: () =>
      listarPedidos({
        pagina: 1,
        porPagina: 200,
        fechaDesde: fecha,
        fechaHasta: fecha,
        clienteId: clienteId === TODOS ? undefined : clienteId,
        estado: estado === TODOS ? undefined : (estado as EstadoPedido),
      }),
  });

  async function imprimirEtiquetas(pedidoId: string) {
    setImprimiendoEtiquetas(pedidoId);
    try {
      const blob = await descargarEtiquetas(pedidoId);
      imprimirPdf(blob);
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    } catch {
      toast.error("No se pudieron generar las etiquetas. Verificá que el pedido tenga bultos cargados.");
    } finally {
      setImprimiendoEtiquetas(null);
    }
  }

  async function imprimirRemito(pedidoId: string) {
    setImprimiendoRemito(pedidoId);
    try {
      const blob = await descargarRemito(pedidoId);
      imprimirPdf(blob);
    } catch {
      toast.error("No se pudo generar el remito. Verificá que el cliente tenga un formato configurado.");
    } finally {
      setImprimiendoRemito(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Embalaje y Despacho</h1>
      <p className="text-sm text-muted-foreground">
        Cargá la cantidad de bultos de cada pedido antes de imprimir sus etiquetas — una etiqueta por bulto.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha-embalaje" className="text-sm text-muted-foreground">
            Fecha de entrega
          </label>
          <Input
            id="fecha-embalaje"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cliente-embalaje" className="text-sm text-muted-foreground">
            Cliente
          </label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger id="cliente-embalaje" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="estado-embalaje" className="text-sm text-muted-foreground">
            Estado
          </label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger id="estado-embalaje" className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {Object.entries(LABEL_ESTADO_PEDIDO).map(([valor, texto]) => (
                <SelectItem key={valor} value={valor}>
                  {texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los pedidos. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Afiliado</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Bultos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : pagina?.datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-muted-foreground">
                    No hay pedidos para esta fecha/cliente/estado.
                  </TableCell>
                </TableRow>
              ) : (
                pagina?.datos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell>{pedido.numero}</TableCell>
                    <TableCell>{pedido.clienteNombre}</TableCell>
                    <TableCell>{pedido.numeroAfiliado}</TableCell>
                    <TableCell>{pedido.destinatarioNombre}</TableCell>
                    <TableCell>{pedido.direccionUsada}</TableCell>
                    <TableCell>{pedido.productos.length}</TableCell>
                    <TableCell>{pedido.productos.reduce((total, p) => total + p.cantidad, 0)}</TableCell>
                    <TableCell>
                      <BultosCelda pedido={pedido} puedeEditar />
                    </TableCell>
                    <TableCell>
                      <BadgeEstadoPedido estado={pedido.estado} />
                    </TableCell>
                    <TableCell>
                      {pedido.etiquetaImpresaEn ? (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                        >
                          Impresa {formatearFechaHora(pedido.etiquetaImpresaEn)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin imprimir</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!pedido.bultos || imprimiendoEtiquetas === pedido.id}
                          onClick={() => imprimirEtiquetas(pedido.id)}
                        >
                          {imprimiendoEtiquetas === pedido.id
                            ? "Generando…"
                            : pedido.etiquetaImpresaEn
                              ? "Reimprimir"
                              : "Imprimir etiquetas"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!pedido.clienteFormatoRemito || imprimiendoRemito === pedido.id}
                          title={
                            pedido.clienteFormatoRemito
                              ? undefined
                              : "Este cliente no tiene un formato de remito configurado (pantalla Clientes)."
                          }
                          onClick={() => imprimirRemito(pedido.id)}
                        >
                          {imprimiendoRemito === pedido.id ? "Generando…" : "Imprimir remito"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
