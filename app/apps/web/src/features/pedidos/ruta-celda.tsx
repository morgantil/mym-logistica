import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actualizarRuta } from "./api";
import type { PedidoListado } from "./tipos";

// Decisión 2026-10-04 (reunión con el cliente): qué ruta de SimpliRoute le
// corresponde al pedido (ej. "Ruta 1", "Ruta 2") — un mismo chofer puede
// tener más de una ruta el mismo día (confirmado real). SimpliRoute no
// publica un número de ruta legible por API, así que se carga a mano, mismo
// patrón que ComentarioCelda: guardado explícito, no autosave.
// Decisión 2026-10-06 (reunión con Pablo Renzo): en la práctica siempre se
// cargaba "Ruta 1" a mano por texto libre — se cambió a un desplegable fijo
// (Ruta 1 a Ruta 10) para evitar variantes de tipeo ("ruta1", "Ruta  1",
// etc.).
//
// Bug real 2026-10-08 (reunión, reportado por un tester): el desplegable
// mostraba "Ruta 1" como valor por defecto para cualquier pedido sin ruta
// guardada todavía — pero en la base seguía siendo `null` hasta que alguien
// apretaba "Guardar". El filtro por Ruta busca coincidencia exacta contra lo
// guardado, así que esos pedidos (visualmente "Ruta 1") no aparecían al
// filtrar por Ruta 1 — lo que se veía en pantalla no coincidía con la base.
// Decisión (opción B, Leonardo): no mostrar ningún default visual — el
// desplegable queda vacío (placeholder "Sin ruta") hasta que se elige y
// guarda una ruta real, igual que ya se ve en modo lectura.
export const OPCIONES_RUTA = Array.from({ length: 10 }, (_, i) => `Ruta ${i + 1}`);

export function RutaCelda({ pedido, puedeEditar }: { pedido: PedidoListado; puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState(pedido.ruta ?? "");

  const mutacion = useMutation({
    mutationFn: (ruta: string) => actualizarRuta(pedido.id, ruta, pedido.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error(error.response.data?.message ?? "Este pedido fue modificado por otra persona. Refrescá.");
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
        return;
      }
      toast.error("No se pudo guardar la ruta.");
    },
  });

  if (!puedeEditar) {
    return <span className="text-sm">{pedido.ruta ?? "—"}</span>;
  }

  const cambio = valor !== (pedido.ruta ?? "");

  return (
    <div className="flex items-center gap-2">
      <Select value={valor} onValueChange={setValor} disabled={mutacion.isPending}>
        <SelectTrigger className="w-28" aria-label={`Ruta del pedido de ${pedido.destinatarioNombre}`}>
          <SelectValue placeholder="Sin ruta" />
        </SelectTrigger>
        <SelectContent>
          {OPCIONES_RUTA.map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
