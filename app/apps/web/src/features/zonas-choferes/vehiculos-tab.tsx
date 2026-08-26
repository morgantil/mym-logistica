import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarVehiculo, crearVehiculo, eliminarVehiculo, listarChoferes, listarVehiculos } from "./api";
import { VehiculoFormSheet } from "./vehiculo-form-sheet";
import type { Vehiculo } from "./tipos";

export function VehiculosTab() {
  const [vehiculoEnEdicion, setVehiculoEnEdicion] = useState<Vehiculo | "nuevo" | null>(null);
  const queryClient = useQueryClient();

  const { data: vehiculos, isLoading, isError } = useQuery({ queryKey: ["vehiculos"], queryFn: listarVehiculos });
  const { data: choferes } = useQuery({ queryKey: ["choferes"], queryFn: listarChoferes });

  const mutacionGuardar = useMutation({
    mutationFn: (datos: Parameters<typeof crearVehiculo>[0]) =>
      vehiculoEnEdicion && vehiculoEnEdicion !== "nuevo"
        ? actualizarVehiculo(vehiculoEnEdicion.id, datos)
        : crearVehiculo(datos),
    onSuccess: () => {
      toast.success(
        vehiculoEnEdicion === "nuevo" ? "Vehículo creado en SimpliRoute." : "Vehículo actualizado en SimpliRoute.",
      );
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
      queryClient.invalidateQueries({ queryKey: ["zonas"] }); // el chofer asignado por zona depende de esto
    },
  });

  const mutacionEliminar = useMutation({
    mutationFn: (id: number) => eliminarVehiculo(id),
    onSuccess: () => {
      toast.success("Vehículo eliminado en SimpliRoute.");
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
    },
    onError: () => toast.error("No se pudo eliminar el vehículo."),
  });

  function confirmarEliminar(vehiculo: Vehiculo) {
    if (
      window.confirm(
        `¿Eliminar el vehículo "${vehiculo.nombre}"? Esto lo elimina de SimpliRoute, no se puede deshacer desde acá.`,
      )
    ) {
      mutacionEliminar.mutate(vehiculo.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Los vehículos se administran acá y se guardan directo en SimpliRoute — no hay copia editable
          separada.
        </p>
        <Button type="button" onClick={() => setVehiculoEnEdicion("nuevo")}>
          Nuevo vehículo
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los vehículos. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead>Chofer predeterminado</TableHead>
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
            ) : vehiculos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Todavía no hay vehículos cargados en SimpliRoute.
                </TableCell>
              </TableRow>
            ) : (
              vehiculos?.map((vehiculo) => (
                <TableRow key={vehiculo.id}>
                  <TableCell>{vehiculo.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{vehiculo.patente ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {choferes?.find((c) => c.id === vehiculo.choferPredeterminadoId)?.nombre ?? "Sin asignar"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vehiculo.estado === "active" ? "outline" : "secondary"} className={
                      vehiculo.estado === "active"
                        ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : undefined
                    }>
                      {vehiculo.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVehiculoEnEdicion(vehiculo)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutacionEliminar.isPending}
                        onClick={() => confirmarEliminar(vehiculo)}
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

      <VehiculoFormSheet
        abierto={vehiculoEnEdicion !== null}
        vehiculoEnEdicion={vehiculoEnEdicion !== "nuevo" ? vehiculoEnEdicion : null}
        choferes={choferes}
        onGuardar={(datos) => mutacionGuardar.mutateAsync(datos)}
        onOpenChange={(abierto) => !abierto && setVehiculoEnEdicion(null)}
      />
    </div>
  );
}
