import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarChofer, crearChofer, eliminarChofer, listarChoferes } from "./api";
import { ChoferFormSheet } from "./chofer-form-sheet";
import type { Chofer } from "./tipos";

export function ChoferesTab() {
  const [choferEnEdicion, setChoferEnEdicion] = useState<Chofer | "nuevo" | null>(null);
  const queryClient = useQueryClient();

  const { data: choferes, isLoading, isError } = useQuery({ queryKey: ["choferes"], queryFn: listarChoferes });

  const mutacionGuardar = useMutation({
    mutationFn: (datos: Parameters<typeof crearChofer>[0]) =>
      choferEnEdicion && choferEnEdicion !== "nuevo"
        ? actualizarChofer(choferEnEdicion.id, datos)
        : crearChofer(datos),
    onSuccess: () => {
      toast.success(choferEnEdicion === "nuevo" ? "Chofer creado en SimpliRoute." : "Chofer actualizado en SimpliRoute.");
      queryClient.invalidateQueries({ queryKey: ["choferes"] });
    },
  });

  const mutacionEliminar = useMutation({
    mutationFn: (id: number) => eliminarChofer(id),
    onSuccess: () => {
      toast.success("Chofer eliminado en SimpliRoute.");
      queryClient.invalidateQueries({ queryKey: ["choferes"] });
    },
    onError: () => toast.error("No se pudo eliminar el chofer."),
  });

  function confirmarEliminar(chofer: Chofer) {
    if (window.confirm(`¿Eliminar a ${chofer.nombre}? Esto lo elimina de SimpliRoute, no se puede deshacer desde acá.`)) {
      mutacionEliminar.mutate(chofer.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Los choferes se administran acá y se guardan directo en SimpliRoute — no hay copia editable
          separada.
        </p>
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
              <TableHead>Usuario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : choferes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Todavía no hay choferes cargados en SimpliRoute.
                </TableCell>
              </TableRow>
            ) : (
              choferes?.map((chofer) => (
                <TableRow key={chofer.id}>
                  <TableCell>{chofer.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{chofer.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[chofer.telefono, chofer.email].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
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
                        disabled={mutacionEliminar.isPending}
                        onClick={() => confirmarEliminar(chofer)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <ChoferFormSheet
        abierto={choferEnEdicion !== null}
        choferEnEdicion={choferEnEdicion !== "nuevo" ? choferEnEdicion : null}
        onGuardar={(datos) => mutacionGuardar.mutateAsync(datos)}
        onOpenChange={(abierto) => !abierto && setChoferEnEdicion(null)}
      />
    </div>
  );
}
