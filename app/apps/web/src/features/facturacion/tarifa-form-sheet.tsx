import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listarZonasTarifarias } from "@/features/zonas-tarifarias/api";
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
// anterior de la misma zona (§23 funcional, "vigencia para mantener históricos") —
// no tiene sentido "editar" una tarifa vieja, se carga una nueva. Las zonas
// (CABA, Cordón 1/2/3, ...) son configurables — ver Ajustes → Zonas tarifarias.
export function TarifaFormSheet({
  clienteId,
  abierto,
  onOpenChange,
}: {
  clienteId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const { data: zonas } = useQuery({
    queryKey: ["zonas-tarifarias"],
    queryFn: listarZonasTarifarias,
  });
  const zonasActivas = (zonas ?? []).filter((zona) => zona.activa);

  const [zonaTarifariaId, setZonaTarifariaId] = useState("");
  const [monto, setMonto] = useState("");
  const [vigenciaDesde, setVigenciaDesde] = useState(HOY);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => crearTarifa({ clienteId, zonaTarifariaId, monto: Number(monto), vigenciaDesde }),
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
            Cierra automáticamente la vigencia de la tarifa anterior de la misma zona.
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
            <FilaFormulario label="Zona" htmlFor="zona-tarifa" anchoEtiqueta="140px">
              <Select value={zonaTarifariaId} onValueChange={setZonaTarifariaId}>
                <SelectTrigger id="zona-tarifa">
                  <SelectValue placeholder="Elegir zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonasActivas.map((zona) => (
                    <SelectItem key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
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
            <Button type="submit" disabled={mutacion.isPending || !zonaTarifariaId}>
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
