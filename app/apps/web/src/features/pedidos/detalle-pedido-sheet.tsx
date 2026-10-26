import { useState } from "react";
import { toast } from "sonner";
import { TipoEnvase } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { imprimirPdf } from "@/lib/imprimir-pdf";
import { descargarRemito } from "./api";
import { BadgeEstadoPedido, BadgePrioridad } from "./estado-labels";
import type { PedidoListado } from "./tipos";

const LABEL_TIPO_ENVASE: Record<TipoEnvase, string> = {
  [TipoEnvase.BOLSA]: "Bolsa",
  [TipoEnvase.BULTO]: "Bulto",
};

// Fila clave/valor — solo se muestra si `valor` tiene algo (la mayoría de
// estos campos son específicos de medicamentos, null para pañales; no tiene
// sentido mostrar una fila vacía).
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number | null | undefined }) {
  if (valor === null || valor === undefined || valor === "") return null;
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  );
}

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
              <div className="flex items-center gap-2">
                <BadgeEstadoPedido estado={pedido.estado} />
                <BadgePrioridad prioridad={pedido.prioridad} />
              </div>

              {/* Decisión 2026-10-25 (Leonardo, con captura): el detalle se
                  abría sin la mayoría de los datos del pedido (receta, tipo
                  de pedido, bolsa/bulto, etc.) — acá va todo lo que tenga
                  cargado, cada fila solo aparece si hay valor (la mayoría de
                  estos campos son específicos de medicamentos, quedan null
                  en pañales). */}
              <div className="flex flex-col gap-1 rounded-md border p-3">
                <Dato etiqueta="Teléfono" valor={pedido.destinatarioTelefono} />
                <Dato etiqueta="Zona" valor={pedido.zonaNombre} />
                <Dato etiqueta="Chofer" valor={pedido.choferNombre} />
                <Dato etiqueta="Ruta" valor={pedido.ruta} />
                <Dato etiqueta="Bultos" valor={pedido.bultos} />
                <Dato etiqueta="Remito" valor={pedido.remito} />
                <Dato etiqueta="Receta" valor={pedido.recetaResuelta ?? pedido.receta} />
                <Dato etiqueta="Tipo de pedido" valor={pedido.tipoPedido} />
                <Dato etiqueta="Retiro de receta" valor={pedido.retiroDeReceta} />
                <Dato etiqueta="Tiempo de entrega" valor={pedido.tiempoDeEntrega} />
                <Dato etiqueta="Horario de entrega" valor={pedido.horarioEntrega} />
              </div>

              {/* Tarjeta por producto (no tabla — decisión 2026-10-25, Leonardo:
                  una tabla acá obligaba a scrollear horizontal en el celular). */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Productos</p>
                {pedido.productos.map((producto, i) => (
                  <div key={i} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{producto.descripcion}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
                      {producto.tipoEnvase && <p>{LABEL_TIPO_ENVASE[producto.tipoEnvase]}</p>}
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
