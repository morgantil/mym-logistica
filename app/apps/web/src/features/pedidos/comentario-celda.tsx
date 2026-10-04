import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarComentario } from "./api";
import type { PedidoListado } from "./tipos";

// Decisión 2026-10-04 (reunión con el cliente): campo libre para que el
// operador anote lo que haga falta (ej. motivo de una entrega fallida),
// editable en cualquier momento — distinto de Observaciones, que viene del
// Excel. Mismo patrón que BultosCelda: guardado explícito, no autosave.
export function ComentarioCelda({ pedido, puedeEditar }: { pedido: PedidoListado; puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState(pedido.comentario ?? "");

  const mutacion = useMutation({
    mutationFn: (comentario: string) => actualizarComentario(pedido.id, comentario, pedido.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data?.message ?? "Este pedido fue modificado por otra persona. Refrescá.");
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
        return;
      }
      toast.error("No se pudo guardar el comentario.");
    },
  });

  if (!puedeEditar) {
    return <span className="text-sm">{pedido.comentario ?? "—"}</span>;
  }

  const cambio = valor !== (pedido.comentario ?? "");

  return (
    <div className="flex items-center gap-2">
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        disabled={mutacion.isPending}
        className="w-48"
        placeholder="Sin comentario"
        aria-label={`Comentario del pedido de ${pedido.destinatarioNombre}`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!cambio || mutacion.isPending}
        onClick={() => mutacion.mutate(valor)}
      >
        {mutacion.isPending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
