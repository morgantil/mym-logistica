import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarBultos } from "./api";
import type { PedidoListado } from "./tipos";

// §16 funcional: la cantidad de bultos se carga desde la misma grilla, para el
// rol Logística. Guardado explícito (no autosave al perder foco) — más
// predecible para un público no técnico, y evita guardar un número a medias.
export function BultosCelda({ pedido, puedeEditar }: { pedido: PedidoListado; puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState(pedido.bultos?.toString() ?? "");

  const mutacion = useMutation({
    mutationFn: (bultos: number) => actualizarBultos(pedido.id, bultos, pedido.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data?.message ?? "Este pedido fue modificado por otra persona. Refrescá.");
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
        return;
      }
      toast.error("No se pudo guardar la cantidad de bultos.");
    },
  });

  if (!puedeEditar) {
    return <span>{pedido.bultos ?? "—"}</span>;
  }

  const numero = Number(valor);
  const esValido = valor !== "" && Number.isInteger(numero) && numero >= 0;
  const cambio = valor !== (pedido.bultos?.toString() ?? "");

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        step={1}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        disabled={mutacion.isPending}
        className="w-20"
        aria-label={`Bultos del pedido de ${pedido.destinatarioNombre}`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!esValido || !cambio || mutacion.isPending}
        onClick={() => mutacion.mutate(numero)}
      >
        {mutacion.isPending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
