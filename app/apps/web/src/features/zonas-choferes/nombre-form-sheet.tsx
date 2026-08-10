import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Formulario genérico de un solo campo "Nombre" — lo comparten Zona y Chofer,
// que hoy no tienen más datos editables que ese.
export function NombreFormSheet({
  abierto,
  titulo,
  etiquetaCampo,
  nombreInicial,
  onGuardar,
  onOpenChange,
}: {
  abierto: boolean;
  titulo: string;
  etiquetaCampo: string;
  nombreInicial: string;
  onGuardar: (nombre: string) => Promise<unknown>;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNombre(nombreInicial);
      setError(null);
    }
  }, [abierto, nombreInicial]);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await onGuardar(nombre);
      onOpenChange(false);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{titulo}</SheetTitle>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 px-4">
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <TablaFormulario>
            <FilaFormulario label={etiquetaCampo} htmlFor="nombre-entidad" anchoEtiqueta="100px">
              <Input
                id="nombre-entidad"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={enviando}
                autoFocus
              />
            </FilaFormulario>
          </TablaFormulario>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
