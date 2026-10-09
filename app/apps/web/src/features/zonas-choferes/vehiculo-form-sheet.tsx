import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Chofer, DatosVehiculo, Vehiculo } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

const SIN_CHOFER = "SIN_CHOFER";

interface FormularioVehiculo {
  nombre: string;
  patente: string;
  choferPredeterminadoId: string; // string para el <Select>, se convierte al enviar
}

const VACIO: FormularioVehiculo = { nombre: "", patente: "", choferPredeterminadoId: SIN_CHOFER };

// Alta/edición de Vehículo — escribe directo contra la API de SimpliRoute
// (CRUD completo publicado), no una tabla propia.
export function VehiculoFormSheet({
  abierto,
  vehiculoEnEdicion,
  choferes,
  onGuardar,
  onOpenChange,
}: {
  abierto: boolean;
  vehiculoEnEdicion: Vehiculo | null; // null = alta nueva
  choferes: Chofer[] | undefined;
  onGuardar: (datos: DatosVehiculo) => Promise<unknown>;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [datos, setDatos] = useState<FormularioVehiculo>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setDatos(
        vehiculoEnEdicion
          ? {
              nombre: vehiculoEnEdicion.nombre,
              patente: vehiculoEnEdicion.patente ?? "",
              choferPredeterminadoId:
                vehiculoEnEdicion.choferPredeterminadoId !== null
                  ? String(vehiculoEnEdicion.choferPredeterminadoId)
                  : SIN_CHOFER,
            }
          : VACIO,
      );
      setError(null);
    }
  }, [abierto, vehiculoEnEdicion]);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        nombre: datos.nombre,
        patente: datos.patente || undefined,
        choferPredeterminadoId:
          datos.choferPredeterminadoId === SIN_CHOFER ? undefined : Number(datos.choferPredeterminadoId),
      });
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
          <SheetTitle>{vehiculoEnEdicion ? "Editar vehículo" : "Nuevo vehículo"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <TablaFormulario>
            <FilaFormulario label="Nombre" htmlFor="vehiculo-nombre" anchoEtiqueta="140px">
              <Input
                id="vehiculo-nombre"
                value={datos.nombre}
                onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
                required
                disabled={enviando}
                autoFocus
              />
            </FilaFormulario>
            <FilaFormulario label="Patente" htmlFor="vehiculo-patente" anchoEtiqueta="140px">
              <Input
                id="vehiculo-patente"
                value={datos.patente}
                onChange={(e) => setDatos((d) => ({ ...d, patente: e.target.value }))}
                disabled={enviando}
              />
            </FilaFormulario>
            <FilaFormulario label="Chofer predeterminado" htmlFor="vehiculo-chofer" anchoEtiqueta="140px">
              <Select
                value={datos.choferPredeterminadoId}
                onValueChange={(valor) => setDatos((d) => ({ ...d, choferPredeterminadoId: valor }))}
                disabled={enviando}
              >
                <SelectTrigger id="vehiculo-chofer" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_CHOFER}>Sin asignar</SelectItem>
                  {choferes?.map((chofer) => (
                    <SelectItem key={chofer.id} value={String(chofer.id)}>
                      {chofer.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
