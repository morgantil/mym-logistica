import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { aNumeroLocal } from "@/lib/numero-local";
import { actualizarPorcentaje, crearPorcentaje } from "./api";
import type { PorcentajeSegundoServicio } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Solo hace falta cuando el cliente tiene (o va a tener) entregas unificadas
// pañales+medicamentos — DOCUMENTO FUNCIONAL.md §25. Con solo pañales (única
// etapa en alcance hoy) no se usa, así que no es obligatorio cargarlo.
// Decisión 2026-09-12: acá solo vive el % del lado PAÑAL — el lado
// medicamento pasó a ser un monto fijo por zona, ver
// monto-unificado-medicamento-form-sheet.tsx. Un solo registro por cliente,
// sin historial — si ya existe, este mismo formulario lo edita en vez de
// crear otro.
export function PorcentajeFormSheet({
  clienteId,
  porcentaje,
  abierto,
  onOpenChange,
}: {
  clienteId: string;
  porcentaje: PorcentajeSegundoServicio | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const editando = porcentaje !== null;

  const [porcentajePanal, setPorcentajePanal] = useState("100");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (porcentaje) {
      setPorcentajePanal(String(porcentaje.porcentajePanal));
    } else {
      setPorcentajePanal("100");
    }
    setError(null);
  }, [porcentaje]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      if (editando) {
        return actualizarPorcentaje(porcentaje.id, { porcentajePanal: aNumeroLocal(porcentajePanal) });
      }
      return crearPorcentaje({ clienteId, porcentajePanal: aNumeroLocal(porcentajePanal) });
    },
    onSuccess: () => {
      toast.success(editando ? "Porcentaje actualizado." : "Porcentaje cargado.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "porcentajes", clienteId] });
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
          <SheetTitle>{editando ? "Editar porcentaje" : "Nuevo porcentaje"} de pañal en unificado</SheetTitle>
          <SheetDescription>
            En una entrega unificada (pañales + medicamentos, mismo domicilio/fecha), el pañal se cobra a este
            porcentaje de su propia tarifa. 100% reproduce "se cobra completo". El lado medicamento se configura
            aparte, como un monto fijo por zona.
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
            <FilaFormulario label="% Pañal" htmlFor="porcentaje-panal" anchoEtiqueta="140px">
              <Input
                id="porcentaje-panal"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={porcentajePanal}
                onChange={(e) => setPorcentajePanal(e.target.value)}
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
