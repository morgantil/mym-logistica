import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asignarChofer, actualizarZona, crearZona, listarChoferesActivos, listarZonasConChofer } from "./api";
import { NombreFormSheet } from "./nombre-form-sheet";
import type { Zona } from "./tipos";

const SIN_CHOFER = "SIN_CHOFER";

export function ZonasTab() {
  const [zonaEnEdicion, setZonaEnEdicion] = useState<Zona | "nuevo" | null>(null);
  const queryClient = useQueryClient();

  const { data: zonas, isLoading, isError } = useQuery({
    queryKey: ["zonas", "conChofer"],
    queryFn: listarZonasConChofer,
  });
  const { data: choferes } = useQuery({ queryKey: ["choferes", "activos"], queryFn: listarChoferesActivos });

  const mutacionGuardar = useMutation({
    mutationFn: (nombre: string) =>
      zonaEnEdicion && zonaEnEdicion !== "nuevo" ? actualizarZona(zonaEnEdicion.id, nombre) : crearZona(nombre),
    onSuccess: () => {
      toast.success(zonaEnEdicion === "nuevo" ? "Zona creada." : "Zona actualizada.");
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
    },
  });

  const mutacionChofer = useMutation({
    mutationFn: ({ zonaId, choferId }: { zonaId: string; choferId: string | null }) =>
      asignarChofer(zonaId, choferId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas"] }),
    onError: () => toast.error("No se pudo cambiar el chofer de la zona."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          El chofer asignado acá es el que usa el sistema para resolver "Chofer sin asignar" al importar
          pedidos (§12-§13).
        </p>
        <Button type="button" onClick={() => setZonaEnEdicion("nuevo")}>
          Nueva zona
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las zonas. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Chofer asignado</TableHead>
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
            ) : zonas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Todavía no hay zonas cargadas.
                </TableCell>
              </TableRow>
            ) : (
              zonas?.map((zona) => (
                <TableRow key={zona.id}>
                  <TableCell>{zona.nombre}</TableCell>
                  <TableCell>
                    <Select
                      value={zona.chofer?.id ?? SIN_CHOFER}
                      onValueChange={(valor) =>
                        mutacionChofer.mutate({ zonaId: zona.id, choferId: valor === SIN_CHOFER ? null : valor })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_CHOFER}>Sin asignar</SelectItem>
                        {choferes?.map((chofer) => (
                          <SelectItem key={chofer.id} value={chofer.id}>
                            {chofer.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" onClick={() => setZonaEnEdicion(zona)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <NombreFormSheet
        abierto={zonaEnEdicion !== null}
        titulo={zonaEnEdicion === "nuevo" ? "Nueva zona" : "Editar zona"}
        etiquetaCampo="Nombre"
        nombreInicial={zonaEnEdicion && zonaEnEdicion !== "nuevo" ? zonaEnEdicion.nombre : ""}
        onGuardar={(nombre) => mutacionGuardar.mutateAsync(nombre)}
        onOpenChange={(abierto) => !abierto && setZonaEnEdicion(null)}
      />
    </div>
  );
}
