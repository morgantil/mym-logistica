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
import type { Chofer, DatosChofer } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

interface FormularioChofer {
  nombre: string;
  username: string;
  telefono: string;
  email: string;
  password: string;
}

const VACIO: FormularioChofer = { nombre: "", username: "", telefono: "", email: "", password: "" };

// Alta/edición de Chofer — a diferencia de Zona, esto escribe directo contra
// la API de SimpliRoute (CRUD completo publicado, ver DOCUMENTO TECNICO.md
// historial 2026-08-25/26), no una tabla propia.
export function ChoferFormSheet({
  abierto,
  choferEnEdicion,
  onGuardar,
  onOpenChange,
}: {
  abierto: boolean;
  choferEnEdicion: Chofer | null; // null = alta nueva
  onGuardar: (datos: DatosChofer) => Promise<unknown>;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [datos, setDatos] = useState<FormularioChofer>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setDatos(
        choferEnEdicion
          ? {
              nombre: choferEnEdicion.nombre,
              username: choferEnEdicion.username,
              telefono: choferEnEdicion.telefono ?? "",
              email: choferEnEdicion.email ?? "",
              password: "",
            }
          : VACIO,
      );
      setError(null);
    }
  }, [abierto, choferEnEdicion]);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        nombre: datos.nombre,
        username: datos.username,
        telefono: datos.telefono || undefined,
        email: datos.email || undefined,
        ...(datos.password ? { password: datos.password } : {}),
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
          <SheetTitle>{choferEnEdicion ? "Editar chofer" : "Nuevo chofer"}</SheetTitle>
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
            <FilaFormulario label="Nombre" htmlFor="chofer-nombre" anchoEtiqueta="140px">
              <Input
                id="chofer-nombre"
                value={datos.nombre}
                onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
                required
                disabled={enviando}
                autoFocus
              />
            </FilaFormulario>
            <FilaFormulario label="Usuario" htmlFor="chofer-username" anchoEtiqueta="140px">
              <Input
                id="chofer-username"
                value={datos.username}
                onChange={(e) => setDatos((d) => ({ ...d, username: e.target.value }))}
                required
                disabled={enviando}
              />
            </FilaFormulario>
            <FilaFormulario label="Teléfono" htmlFor="chofer-telefono" anchoEtiqueta="140px">
              <Input
                id="chofer-telefono"
                value={datos.telefono}
                onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value }))}
                disabled={enviando}
              />
            </FilaFormulario>
            <FilaFormulario label="Email" htmlFor="chofer-email" anchoEtiqueta="140px">
              <Input
                id="chofer-email"
                type="email"
                value={datos.email}
                onChange={(e) => setDatos((d) => ({ ...d, email: e.target.value }))}
                disabled={enviando}
              />
            </FilaFormulario>
            <FilaFormulario
              label={choferEnEdicion ? "Nueva contraseña" : "Contraseña"}
              htmlFor="chofer-password"
              anchoEtiqueta="140px"
            >
              <Input
                id="chofer-password"
                type="password"
                value={datos.password}
                onChange={(e) => setDatos((d) => ({ ...d, password: e.target.value }))}
                required={!choferEnEdicion}
                placeholder={choferEnEdicion ? "Dejar vacío para no cambiarla" : undefined}
                disabled={enviando}
                minLength={6}
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
