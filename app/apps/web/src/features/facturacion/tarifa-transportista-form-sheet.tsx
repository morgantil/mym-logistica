import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actualizarTarifaTransportista, crearTarifaTransportista } from "./api";
import type { TarifaTransportista } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Decisión 2026-09-11: sin historial por vigencia — si ya hay una tarifa
// cargada, este mismo formulario la edita en vez de crear otra.
export function TarifaTransportistaFormSheet({
  tarifa,
  abierto,
  onOpenChange,
}: {
  tarifa: TarifaTransportista | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const editando = tarifa !== null;

  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMonto(tarifa ? String(tarifa.monto) : "");
    setError(null);
  }, [tarifa]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      if (editando) {
        return actualizarTarifaTransportista(tarifa.id, { monto: Number(monto) });
      }
      return crearTarifaTransportista({ monto: Number(monto) });
    },
    onSuccess: () => {
      toast.success("Tarifa por viaje actualizada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifa-transportista"] });
      setError(null);
      onOpenChange(false);
    },
    onError: (err) => setError(mensajeError(err)),
  });

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    mutacion.mutate();
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? "Editar tarifa por viaje" : "Nueva tarifa por viaje"}</SheetTitle>
          <SheetDescription>
            Monto fijo que se le paga al transportista por cada viaje realizado, sin distinguir 2×1 ni
            entrega unificada.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 px-4">
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <TablaFormulario>
            <FilaFormulario label="Monto por viaje" htmlFor="monto-transportista" anchoEtiqueta="140px">
              <Input
                id="monto-transportista"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                disabled={mutacion.isPending}
                autoFocus
              />
            </FilaFormulario>
          </TablaFormulario>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={mutacion.isPending}>
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
