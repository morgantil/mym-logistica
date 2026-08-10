import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido.productos.map((producto, i) => (
                    <TableRow key={i}>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>{producto.codigo ?? "—"}</TableCell>
                      <TableCell className="text-right">{producto.cantidad}</TableCell>
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
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
