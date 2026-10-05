import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { descargarRemito } from "./api";
import type { PedidoListado } from "./tipos";

// §15 funcional: detalle del pedido con sus productos y el total de unidades.
export function DetallePedidoSheet({
  pedido,
  onOpenChange,
}: {
  pedido: PedidoListado | null;
  onOpenChange: (abierto: boolean) => void;
}) {
  const totalUnidades = pedido?.productos.reduce((total, p) => total + p.cantidad, 0) ?? 0;
  // Solo se muestra la columna si algún producto trae ticket — la mayoría
  // de los clientes no usa este campo, no tiene sentido una columna vacía.
  const mostrarColumnaTicket = pedido?.productos.some((p) => p.ticket) ?? false;
  const [imprimiendoRemito, setImprimiendoRemito] = useState(false);

  async function imprimirRemito() {
    if (!pedido) return;
    setImprimiendoRemito(true);
    try {
      const blob = await descargarRemito(pedido.id);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `remito-pedido-${pedido.numero}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo generar el remito. Verificá que el cliente tenga un formato configurado.");
    } finally {
      setImprimiendoRemito(false);
    }
  }

  return (
    <Sheet open={pedido !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {pedido && (
          <>
            <SheetHeader>
              <SheetTitle>Pedido de {pedido.destinatarioNombre}</SheetTitle>
              <SheetDescription>
                Afiliado {pedido.numeroAfiliado} · {pedido.direccionUsada}, {pedido.localidad}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    {mostrarColumnaTicket && <TableHead>Ticket</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido.productos.map((producto, i) => (
                    <TableRow key={i}>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>{producto.codigo ?? "—"}</TableCell>
                      <TableCell className="text-right">{producto.cantidad}</TableCell>
                      {mostrarColumnaTicket && <TableCell>{producto.ticket ?? "—"}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <p className="text-sm font-medium">Total: {totalUnidades} unidades</p>

              {pedido.observaciones && (
                <div>
                  <p className="text-sm font-medium">Observaciones</p>
                  <p className="text-sm text-muted-foreground">{pedido.observaciones}</p>
                </div>
              )}

              {/* Editable desde la columna "Comentarios" de la grilla — acá
                  solo de lectura, para no duplicar el guardado en dos lugares. */}
              {pedido.comentario && (
                <div>
                  <p className="text-sm font-medium">Comentarios</p>
                  <p className="text-sm text-muted-foreground">{pedido.comentario}</p>
                </div>
              )}
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                disabled={!pedido.clienteFormatoRemito || imprimiendoRemito}
                title={
                  pedido.clienteFormatoRemito
                    ? undefined
                    : "Este cliente no tiene un formato de remito configurado (pantalla Clientes)."
                }
                onClick={imprimirRemito}
              >
                {imprimiendoRemito ? "Generando…" : "Imprimir remito"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
