import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CabaProvincia } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { crearTarifa } from "./api";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

const HOY = new Date().toISOString().slice(0, 10);

// Solo alta: una tarifa nueva cierra automáticamente la vigencia de la
// anterior del mismo tipo (§23 funcional, "vigencia para mantener históricos") —
// no tiene sentido "editar" una tarifa vieja, se carga una nueva.
export function TarifaFormSheet({
  clienteId,
  abierto,
  onOpenChange,
}: {
  clienteId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [tipo, setTipo] = useState<CabaProvincia>(CabaProvincia.CABA);
  const [monto, setMonto] = useState("");
  const [vigenciaDesde, setVigenciaDesde] = useState(HOY);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => crearTarifa({ clienteId, tipo, monto: Number(monto), vigenciaDesde }),
    onSuccess: () => {
      toast.success("Tarifa cargada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifas", clienteId] });
      setMonto("");
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
          <SheetTitle>Nueva tarifa</SheetTitle>
          <SheetDescription>
            Cierra automáticamente la vigencia de la tarifa anterior del mismo tipo (CABA o Provincia).
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
            <FilaFormulario label="Tipo" htmlFor="tipo-tarifa" anchoEtiqueta="140px">
              <Select value={tipo} onValueChange={(valor) => setTipo(valor as CabaProvincia)}>
                <SelectTrigger id="tipo-tarifa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CabaProvincia.CABA}>CABA</SelectItem>
                  <SelectItem value={CabaProvincia.PROVINCIA}>Provincia</SelectItem>
                </SelectContent>
              </Select>
            </FilaFormulario>

            <FilaFormulario label="Monto" htmlFor="monto-tarifa" anchoEtiqueta="140px">
              <Input
                id="monto-tarifa"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario label="Vigencia desde" htmlFor="vigencia-tarifa" anchoEtiqueta="140px">
              <Input
                id="vigencia-tarifa"
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
