import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoServicioCliente } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarCliente, listarTodosLosClientes } from "./api";
import { ClienteFormSheet } from "./cliente-form-sheet";
import type { Cliente } from "./tipos";

const ETIQUETAS_TIPO_SERVICIO: Record<TipoServicioCliente, string> = {
  [TipoServicioCliente.PANAL]: "Pañales",
  [TipoServicioCliente.MEDICAMENTO]: "Medicamentos",
  [TipoServicioCliente.AMBOS]: "Ambos",
};

export function ClientesPage() {
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null | "nuevo">(null);
  const queryClient = useQueryClient();

  const { data: clientes, isLoading, isError } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: listarTodosLosClientes,
  });

  const mutacionActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarCliente(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    onError: () => toast.error("No se pudo cambiar el estado del cliente."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Button type="button" onClick={() => setClienteEnEdicion("nuevo")}>
          Nuevo cliente
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los clientes. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Patrones de detección</TableHead>
              <TableHead>Tipo de servicio</TableHead>
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
            ) : clientes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Todavía no hay clientes cargados.
                </TableCell>
              </TableRow>
            ) : (
              clientes?.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.nombre}</TableCell>
                  <TableCell className="whitespace-normal">
                    {cliente.patronesDeteccion.join(", ")}
                  </TableCell>
                  <TableCell>{ETIQUETAS_TIPO_SERVICIO[cliente.tipoServicio]}</TableCell>
                  <TableCell>
                    {cliente.activo ? (
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
                      <Button type="button" variant="outline" size="sm" onClick={() => setClienteEnEdicion(cliente)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutacionActivo.isPending}
                        onClick={() =>
                          mutacionActivo.mutate({ id: cliente.id, activo: !cliente.activo })
                        }
                      >
                        {cliente.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <ClienteFormSheet
        cliente={clienteEnEdicion}
        onOpenChange={(abierto) => !abierto && setClienteEnEdicion(null)}
      />
    </div>
  );
}
