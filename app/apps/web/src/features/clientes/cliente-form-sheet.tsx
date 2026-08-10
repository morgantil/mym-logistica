import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { actualizarCliente, crearCliente } from "./api";
import type { Cliente } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Un solo formulario para crear y editar — si viene `cliente`, edita; si no, crea.
export function ClienteFormSheet({
  cliente,
  onOpenChange,
}: {
  cliente: Cliente | null | "nuevo";
  onOpenChange: (abierto: boolean) => void;
}) {
  const abierto = cliente !== null;
  const editando = cliente !== null && cliente !== "nuevo";

  const [nombre, setNombre] = useState("");
  const [patrones, setPatrones] = useState("");

  useEffect(() => {
    if (editando) {
      setNombre(cliente.nombre);
      setPatrones(cliente.patronesDeteccion.join(", "));
    } else {
      setNombre("");
      setPatrones("");
    }
  }, [cliente, editando]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: async () => {
      const patronesDeteccion = patrones
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (editando) {
        return actualizarCliente(cliente.id, { nombre, patronesDeteccion });
      }
      return crearCliente({ nombre, patronesDeteccion });
    },
    onSuccess: () => {
      toast.success(editando ? "Cliente actualizado." : "Cliente creado.");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    mutacion.mutate();
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editando ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            Los patrones de detección se usan para identificar el cliente a partir del
            nombre del archivo Excel al importar (§5).
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre-cliente">Nombre</Label>
            <Input
              id="nombre-cliente"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={mutacion.isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="patrones-cliente">Patrones de detección (separados por coma)</Label>
            <Input
              id="patrones-cliente"
              value={patrones}
              onChange={(e) => setPatrones(e.target.value)}
              placeholder="BIOSINTESIS, BIO SINTESIS"
              required
              disabled={mutacion.isPending}
            />
            <p className="text-sm text-muted-foreground">
              Si el nombre del Excel contiene alguno de estos textos, se asigna a este
              cliente automáticamente.
            </p>
          </div>

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
