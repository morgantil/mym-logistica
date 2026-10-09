import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResolucionDireccion } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { resolverAlertaDireccion } from "./api";
import type { PedidoListado } from "./tipos";

const OPCIONES: { resolucion: ResolucionDireccion; titulo: string; descripcion: string }[] = [
  {
    resolucion: ResolucionDireccion.USAR_SOLO_ESTE_PEDIDO,
    titulo: "Usar esta dirección solo para este pedido",
    descripcion: "La dirección del Excel se usa para esta entrega puntual, sin tocar el padrón del destinatario.",
  },
  {
    resolucion: ResolucionDireccion.ACTUALIZAR_PADRON,
    titulo: "Actualizar el padrón con esta dirección",
    descripcion: "La dirección del Excel pasa a ser la registrada para este destinatario de ahora en más.",
  },
  {
    resolucion: ResolucionDireccion.MANTENER_EXISTENTE,
    titulo: "Mantener la dirección ya registrada",
    descripcion: "Se descarta la del Excel para este pedido — se usa la que ya está guardada en el padrón.",
  },
];

// Decisión 2026-09-16 (Leonardo, QA): la "Etapa 2" del §11 funcional que
// había quedado pendiente — antes esto era solo una nota en Observaciones y
// el pedido se podía enviar igual; ahora bloquea el envío hasta elegir una
// de las tres resoluciones que ya existían en el backend, sin UI hasta hoy.
export function ResolverDireccionSheet({
  pedido,
  onOpenChange,
}: {
  pedido: PedidoListado | null;
  onOpenChange: (abierto: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const mutacion = useMutation({
    mutationFn: (resolucion: ResolucionDireccion) => {
      if (!pedido) throw new Error("Falta el pedido a resolver.");
      return resolverAlertaDireccion(pedido.id, resolucion, pedido.version);
    },
    onSuccess: () => {
      toast.success("Dirección resuelta — el pedido ya se puede enviar.");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo resolver. Probá de nuevo en unos segundos."),
  });

  return (
    <Sheet open={pedido !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {pedido && (
          <>
            <SheetHeader>
              <SheetTitle>Dirección distinta al padrón</SheetTitle>
              <SheetDescription>
                El pedido de {pedido.destinatarioNombre} no se puede enviar hasta resolver esto.
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Dirección del Excel</p>
                <p className="font-medium">{pedido.direccionOriginal}</p>
              </div>

              <div className="flex flex-col gap-2">
                {OPCIONES.map((opcion) => (
                  <Button
                    key={opcion.resolucion}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col items-start gap-1 whitespace-normal p-3 text-left"
                    disabled={mutacion.isPending}
                    onClick={() => mutacion.mutate(opcion.resolucion)}
                  >
                    <span className="font-medium">{opcion.titulo}</span>
                    <span className="text-xs font-normal text-muted-foreground">{opcion.descripcion}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
