import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { listarTodosLosClientes } from "@/features/clientes/api";
import { LimitesReporteSection } from "@/features/limites-reporte/limites-reporte-section";
import {
  actualizarClientesPermitidos,
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
  resetearPassword,
} from "./api";
import { PasswordTemporalSheet } from "./password-temporal-sheet";
import type { ResultadoFormularioUsuario } from "./usuario-form-sheet";
import { UsuarioFormSheet } from "./usuario-form-sheet";
import type { Usuario } from "./tipos";

const ETIQUETAS_ROL: Record<string, string> = {
  OPERACIONES: "Operaciones",
  LOGISTICA: "Logística",
  ADMINISTRACION: "Administración",
  FACTURACION: "Facturación",
};

export function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<Usuario | "nuevo" | null>(null);
  const [passwordAMostrar, setPasswordAMostrar] = useState<{ email: string; password: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading, isError } = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios });
  const { data: clientes } = useQuery({ queryKey: ["clientes", "todos"], queryFn: listarTodosLosClientes });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });

  const mutacionGuardar = useMutation({
    mutationFn: async (resultado: ResultadoFormularioUsuario) => {
      if (resultado.crear) {
        const { usuario, passwordTemporal } = await crearUsuario(resultado.crear);
        // null = quien dio de alta eligió su propia contraseña (ya la sabe,
        // no hace falta mostrarla).
        if (passwordTemporal) {
          setPasswordAMostrar({ email: usuario.email, password: passwordTemporal });
        }
        return usuario;
      }
      const id = usuarioEnEdicion !== "nuevo" ? usuarioEnEdicion?.id : undefined;
      if (!id) throw new Error("Falta el usuario a editar.");
      const actualizado = await actualizarUsuario(id, resultado.actualizar ?? {});
      await actualizarClientesPermitidos(id, resultado.clienteIds);
      return actualizado;
    },
    onSuccess: () => {
      toast.success(usuarioEnEdicion === "nuevo" ? "Usuario creado." : "Usuario actualizado.");
      invalidar();
    },
  });

  const mutacionActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarUsuario(id, { activo }),
    onSuccess: invalidar,
    onError: (error: unknown) => {
      const mensaje =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(mensaje ?? "No se pudo cambiar el estado del usuario.");
    },
  });

  const mutacionResetear = useMutation({
    mutationFn: (usuario: Usuario) => resetearPassword(usuario.id),
    onSuccess: (resultado, usuario) => {
      setPasswordAMostrar({ email: usuario.email, password: resultado.passwordTemporal });
    },
    onError: () => toast.error("No se pudo resetear la contraseña."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Roles combinables y permisos por cliente — sin login con Google en este MVP, el alta es acá.
          </p>
        </div>
        <Button type="button" onClick={() => setUsuarioEnEdicion("nuevo")}>
          Nuevo usuario
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los usuarios. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : usuarios?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Todavía no hay usuarios cargados.
                </TableCell>
              </TableRow>
            ) : (
              usuarios?.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    {usuario.nombre}
                    {usuario.id === usuarioActual?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.roles.map((rol) => ETIQUETAS_ROL[rol] ?? rol).join(", ") || "Sin rol"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.clientesPermitidosIds.length === 0
                      ? "Todos"
                      : `${usuario.clientesPermitidosIds.length} cliente(s)`}
                  </TableCell>
                  <TableCell>
                    {usuario.activo ? (
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
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setUsuarioEnEdicion(usuario)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutacionResetear.isPending}
                        onClick={() => mutacionResetear.mutate(usuario)}
                      >
                        Resetear contraseña
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={usuario.id === usuarioActual?.id || mutacionActivo.isPending}
                        onClick={() => mutacionActivo.mutate({ id: usuario.id, activo: !usuario.activo })}
                      >
                        {usuario.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <LimitesReporteSection />

      <UsuarioFormSheet
        abierto={usuarioEnEdicion !== null}
        usuarioEnEdicion={usuarioEnEdicion !== "nuevo" ? usuarioEnEdicion : null}
        clientes={clientes}
        onGuardar={(resultado) => mutacionGuardar.mutateAsync(resultado)}
        onOpenChange={(abierto) => !abierto && setUsuarioEnEdicion(null)}
      />

      <PasswordTemporalSheet
        abierto={passwordAMostrar !== null}
        email={passwordAMostrar?.email ?? null}
        password={passwordAMostrar?.password ?? null}
        onOpenChange={(abierto) => !abierto && setPasswordAMostrar(null)}
      />
    </div>
  );
}
