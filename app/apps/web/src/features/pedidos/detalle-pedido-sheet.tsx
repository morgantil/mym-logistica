import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { imprimirPdf } from "@/lib/imprimir-pdf";
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
  const [imprimiendoRemito, setImprimiendoRemito] = useState(false);

  async function imprimirRemito() {
    if (!pedido) return;
    setImprimiendoRemito(true);
    try {
      const blob = await descargarRemito(pedido.id);
      imprimirPdf(blob);
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

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
              {/* Decisión 2026-10-25 (Leonardo, con captura): una tabla acá
                  obligaba a scrollear horizontal en el celular — se cambió
                  a una tarjeta por producto, clave/valor apilado, sin
                  ninguna columna que se pueda cortar. */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Productos</p>
                {pedido.productos.map((producto, i) => (
                  <div key={i} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{producto.descripcion}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
                      {producto.codigo && <p>Código: {producto.codigo}</p>}
                      <p>Cantidad: {producto.cantidad}</p>
                      {producto.ticket && <p>Ticket: {producto.ticket}</p>}
                    </div>
                  </div>
                ))}
              </div>

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
