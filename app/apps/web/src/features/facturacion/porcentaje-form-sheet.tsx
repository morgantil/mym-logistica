import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { crearPorcentaje } from "./api";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

const HOY = new Date().toISOString().slice(0, 10);

// Solo hace falta cuando el cliente tiene (o va a tener) entregas unificadas
// pañales+medicamentos — DOCUMENTO FUNCIONAL.md §25. Con solo pañales (única
// etapa en alcance hoy) no se usa, así que no es obligatorio cargarlo.
export function PorcentajeFormSheet({
  clienteId,
  abierto,
  onOpenChange,
}: {
  clienteId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [porcentaje, setPorcentaje] = useState("");
  const [vigenciaDesde, setVigenciaDesde] = useState(HOY);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => crearPorcentaje({ clienteId, porcentaje: Number(porcentaje), vigenciaDesde }),
    onSuccess: () => {
      toast.success("Porcentaje cargado.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "porcentajes", clienteId] });
      setPorcentaje("");
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
          <SheetTitle>Nuevo porcentaje del segundo servicio</SheetTitle>
          <SheetDescription>
            En una entrega unificada (pañales + medicamentos, mismo cliente/dirección/fecha), un servicio se
            cobra al 100% y el otro con este porcentaje. Cierra automáticamente la vigencia del anterior.
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
            <FilaFormulario label="Porcentaje" htmlFor="porcentaje" anchoEtiqueta="140px">
              <Input
                id="porcentaje"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario label="Vigencia desde" htmlFor="vigencia-porcentaje" anchoEtiqueta="140px">
              <Input
                id="vigencia-porcentaje"
                type="date"
                value={vigenciaDesde}
                onChange={(e) => setVigenciaDesde(e.target.value)}
                required
                disabled={mutacion.isPending}
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
