import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navItems } from "@/components/shell/nav-items";
import type { Cliente } from "@/features/clientes/tipos";
import type { Rol } from "@/features/auth/tipos";
import type { DatosActualizarUsuario, DatosCrearUsuario, Usuario } from "./tipos";

// Catálogo de pantallas elegibles — mismo listado que arma el menú
// (nav-items.ts), sin "Inicio" (siempre visible para cualquiera).
const PANTALLAS_DISPONIBLES = navItems.filter((item) => item.to !== "/");

export interface ResultadoFormularioUsuario {
  crear?: DatosCrearUsuario;
  actualizar?: DatosActualizarUsuario;
  clienteIds: string[]; // siempre presente — vacío = todos los clientes
}

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

const ROLES_DISPONIBLES: { valor: Rol; etiqueta: string }[] = [
  { valor: "OPERACIONES", etiqueta: "Operaciones" },
  { valor: "LOGISTICA", etiqueta: "Logística" },
  { valor: "ADMINISTRACION", etiqueta: "Administración" },
  { valor: "FACTURACION", etiqueta: "Facturación" },
];

interface FormularioUsuario {
  email: string;
  nombre: string;
  roles: Rol[];
  verTodosLosClientes: boolean;
  clienteIds: string[];
  usaMenuDeRoles: boolean;
  pantallasPermitidas: string[];
  // Solo aplica al alta (vacío = el backend genera una temporal) — ver
  // DatosCrearUsuario.password.
  password: string;
}

function vacio(): FormularioUsuario {
  return {
    email: "",
    nombre: "",
    roles: [],
    verTodosLosClientes: true,
    clienteIds: [],
    usaMenuDeRoles: true,
    pantallasPermitidas: [],
    password: "",
  };
}

// Alta/edición de usuario — pantalla agregada 2026-08-26 al sacar Google del
// MVP. Roles combinables y permisos por cliente ya existían en el modelo de
// datos (DOCUMENTO TECNICO.md sección 2); esto solo les pone una interfaz.
export function UsuarioFormSheet({
  abierto,
  usuarioEnEdicion,
  clientes,
  onGuardar,
  onOpenChange,
}: {
  abierto: boolean;
  usuarioEnEdicion: Usuario | null; // null = alta nueva
  clientes: Cliente[] | undefined;
  onGuardar: (resultado: ResultadoFormularioUsuario) => Promise<unknown>;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [datos, setDatos] = useState<FormularioUsuario>(vacio());
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setDatos(
        usuarioEnEdicion
          ? {
              email: usuarioEnEdicion.email,
              nombre: usuarioEnEdicion.nombre,
              roles: usuarioEnEdicion.roles,
              verTodosLosClientes: usuarioEnEdicion.clientesPermitidosIds.length === 0,
              clienteIds: usuarioEnEdicion.clientesPermitidosIds,
              usaMenuDeRoles: usuarioEnEdicion.pantallasPermitidas.length === 0,
              pantallasPermitidas: usuarioEnEdicion.pantallasPermitidas,
              password: "",
            }
          : vacio(),
      );
      setError(null);
    }
  }, [abierto, usuarioEnEdicion]);

  function alternarRol(rol: Rol, marcado: boolean) {
    setDatos((d) => ({
      ...d,
      roles: marcado ? [...d.roles, rol] : d.roles.filter((r) => r !== rol),
    }));
  }

  function alternarCliente(clienteId: string, marcado: boolean) {
    setDatos((d) => ({
      ...d,
      clienteIds: marcado ? [...d.clienteIds, clienteId] : d.clienteIds.filter((id) => id !== clienteId),
    }));
  }

  function alternarPantalla(to: string, marcado: boolean) {
    setDatos((d) => ({
      ...d,
      pantallasPermitidas: marcado
        ? [...d.pantallasPermitidas, to]
        : d.pantallasPermitidas.filter((p) => p !== to),
    }));
  }

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const clienteIds = datos.verTodosLosClientes ? [] : datos.clienteIds;
      const pantallasPermitidas = datos.usaMenuDeRoles ? [] : datos.pantallasPermitidas;
      if (usuarioEnEdicion) {
        await onGuardar({
          actualizar: {
            nombre: datos.nombre,
            roles: datos.roles,
            pantallasPermitidas,
          } satisfies DatosActualizarUsuario,
          clienteIds,
        });
      } else {
        await onGuardar({
          crear: {
            email: datos.email,
            nombre: datos.nombre,
            roles: datos.roles,
            clienteIds,
            password: datos.password || undefined,
          } satisfies DatosCrearUsuario,
          clienteIds,
        });
      }
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
          <SheetTitle>{usuarioEnEdicion ? "Editar usuario" : "Nuevo usuario"}</SheetTitle>
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
            <FilaFormulario label="Email" htmlFor="usuario-email" anchoEtiqueta="140px">
              <Input
                id="usuario-email"
                type="email"
                value={datos.email}
                onChange={(e) => setDatos((d) => ({ ...d, email: e.target.value }))}
                required
                disabled={enviando || !!usuarioEnEdicion}
                autoFocus={!usuarioEnEdicion}
              />
            </FilaFormulario>
            <FilaFormulario label="Nombre" htmlFor="usuario-nombre" anchoEtiqueta="140px">
              <Input
                id="usuario-nombre"
                value={datos.nombre}
                onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
                required
                disabled={enviando}
                autoFocus={!!usuarioEnEdicion}
              />
            </FilaFormulario>
            {!usuarioEnEdicion && (
              <FilaFormulario
                label="Contraseña"
                htmlFor="usuario-password"
                anchoEtiqueta="140px"
                descripcion="Opcional — si la dejás vacía, se genera una temporal y se muestra una sola vez después de guardar."
              >
                <Input
                  id="usuario-password"
                  type="text"
                  minLength={8}
                  placeholder="Dejar vacío para generar una automática"
                  value={datos.password}
                  onChange={(e) => setDatos((d) => ({ ...d, password: e.target.value }))}
                  disabled={enviando}
                />
              </FilaFormulario>
            )}
          </TablaFormulario>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Roles (se pueden combinar)</p>
            {ROLES_DISPONIBLES.map((rol) => (
              <label key={rol.valor} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={datos.roles.includes(rol.valor)}
                  onCheckedChange={(marcado) => alternarRol(rol.valor, marcado === true)}
                  disabled={enviando}
                />
                {rol.etiqueta}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Clientes que puede ver</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={datos.verTodosLosClientes}
                onCheckedChange={(marcado) => setDatos((d) => ({ ...d, verTodosLosClientes: marcado === true }))}
                disabled={enviando}
              />
              Todos los clientes
            </label>
            {!datos.verTodosLosClientes && (
              <div className="flex flex-col gap-2 border-l-2 pl-4">
                {clientes?.map((cliente) => (
                  <label key={cliente.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={datos.clienteIds.includes(cliente.id)}
                      onCheckedChange={(marcado) => alternarCliente(cliente.id, marcado === true)}
                      disabled={enviando}
                    />
                    {cliente.nombre}
                  </label>
                ))}
              </div>
            )}
          </div>

          {usuarioEnEdicion && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Pantallas que ve</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={datos.usaMenuDeRoles}
                  onCheckedChange={(marcado) => setDatos((d) => ({ ...d, usaMenuDeRoles: marcado === true }))}
                  disabled={enviando}
                />
                Usar el menú de sus roles (por defecto)
              </label>
              {!datos.usaMenuDeRoles && (
                <div className="flex flex-col gap-2 border-l-2 pl-4">
                  {PANTALLAS_DISPONIBLES.map((item) => (
                    <label key={item.to} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={datos.pantallasPermitidas.includes(item.to)}
                        onCheckedChange={(marcado) => alternarPantalla(item.to, marcado === true)}
                        disabled={enviando}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
