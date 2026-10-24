import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listarChoferes } from "@/features/zonas-choferes/api";
import { reasignarChofer } from "./api";
import type { PedidoListado } from "./tipos";

// Reasignación manual de chofer (reunión 2026-10-21, Pablo Renzo): "que el
// usuario lo pueda modificar por si se enferma un chofer o se rompe un
// auto" — mismo patrón de guardado explícito que RutaCelda. El backend
// resuelve zona+vehículo a partir del chofer elegido (misma función que ya
// usa la sincronización automática, ver ZonasChoferesService.
// resolverZonaPorChofer) y, si el pedido ya se había enviado, también
// empuja el cambio a la Visit real en SimpliRoute.
export function ChoferCelda({ pedido, puedeEditar }: { pedido: PedidoListado; puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState(pedido.choferId ?? "");

  const { data: choferes } = useQuery({
    queryKey: ["choferes"],
    queryFn: listarChoferes,
    enabled: puedeEditar,
  });

  const mutacion = useMutation({
    mutationFn: (choferIdExterno: number) => reasignarChofer(pedido.id, choferIdExterno, pedido.version),
    onSuccess: () => {
      toast.success("Chofer reasignado.");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data?.message ?? "Este pedido fue modificado por otra persona. Refrescá.");
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
        return;
      }
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
        return;
      }
      toast.error("No se pudo reasignar el chofer.");
    },
  });

  if (!puedeEditar) {
    return <span className="text-sm">{pedido.choferNombre ?? "—"}</span>;
  }

  const cambio = valor !== (pedido.choferId ?? "");

  return (
    <div className="flex items-center gap-2">
      <Select value={valor} onValueChange={setValor} disabled={mutacion.isPending}>
        <SelectTrigger className="w-40" aria-label={`Chofer del pedido de ${pedido.destinatarioNombre}`}>
          <SelectValue placeholder="Sin asignar" />
        </SelectTrigger>
        <SelectContent>
          {choferes?.map((chofer) => (
            <SelectItem key={chofer.id} value={String(chofer.id)}>
              {chofer.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!cambio || mutacion.isPending}
        onClick={() => mutacion.mutate(Number(valor))}
      >
        {mutacion.isPending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
