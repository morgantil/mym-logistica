import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarChofer, crearChofer, listarTodosLosChoferes } from "./api";
import { NombreFormSheet } from "./nombre-form-sheet";
import type { Chofer } from "./tipos";

export function ChoferesTab() {
  const [choferEnEdicion, setChoferEnEdicion] = useState<Chofer | "nuevo" | null>(null);
  const queryClient = useQueryClient();

  const { data: choferes, isLoading, isError } = useQuery({
    queryKey: ["choferes", "todos"],
    queryFn: listarTodosLosChoferes,
  });

  const mutacionGuardar = useMutation({
    mutationFn: (nombre: string) =>
      choferEnEdicion && choferEnEdicion !== "nuevo"
        ? actualizarChofer(choferEnEdicion.id, { nombre })
        : crearChofer(nombre),
    onSuccess: () => {
      toast.success(choferEnEdicion === "nuevo" ? "Chofer creado." : "Chofer actualizado.");
      queryClient.invalidateQueries({ queryKey: ["choferes"] });
    },
  });

  const mutacionActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarChofer(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["choferes"] }),
    onError: () => toast.error("No se pudo cambiar el estado del chofer."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => setChoferEnEdicion("nuevo")}>
          Nuevo chofer
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los choferes. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : choferes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Todavía no hay choferes cargados.
                </TableCell>
              </TableRow>
            ) : (
              choferes?.map((chofer) => (
                <TableRow key={chofer.id}>
                  <TableCell>{chofer.nombre}</TableCell>
                  <TableCell>
                    {chofer.activo ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setChoferEnEdicion(chofer)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutacionActivo.isPending}
                        onClick={() => mutacionActivo.mutate({ id: chofer.id, activo: !chofer.activo })}
                      >
                        {chofer.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <NombreFormSheet
        abierto={choferEnEdicion !== null}
        titulo={choferEnEdicion === "nuevo" ? "Nuevo chofer" : "Editar chofer"}
        etiquetaCampo="Nombre"
        nombreInicial={choferEnEdicion && choferEnEdicion !== "nuevo" ? choferEnEdicion.nombre : ""}
        onGuardar={(nombre) => mutacionGuardar.mutateAsync(nombre)}
        onOpenChange={(abierto) => !abierto && setChoferEnEdicion(null)}
      />
    </div>
  );
}
