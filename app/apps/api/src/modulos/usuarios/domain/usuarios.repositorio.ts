import { Usuario } from "./usuario";

// Puerto (interfaz) que define qué necesita el dominio de la capa de persistencia,
// sin saber que existe Prisma detrás. La implementación real vive en infrastructure/.
export interface UsuariosRepositorio {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorGoogleId(googleId: string): Promise<Usuario | null>;
  crear(datos: {
    email: string;
    nombre: string;
    passwordHash?: string | null;
    googleId?: string | null;
    roles: Usuario["roles"];
  }): Promise<Usuario>;
  actualizarGoogleId(usuarioId: string, googleId: string): Promise<Usuario>;

  // Administración de usuarios (pantalla "Usuarios", rol Administración) —
  // agregado 2026-08-26 al sacar el login con Google del MVP: hasta acá el
  // único alta posible era vía Google o directo en la base.
  listar(): Promise<Usuario[]>;
  actualizar(
    id: string,
    datos: Partial<Pick<Usuario, "nombre" | "roles" | "activo" | "passwordHash" | "columnasFijasPedidos">>,
  ): Promise<Usuario>;
  clientesPermitidosDe(usuarioId: string): Promise<string[]>;
  // Reemplaza el conjunto completo — un array vacío significa "ve todos los
  // clientes" (mismo criterio que PermisosClienteService ya usa en lectura).
  asignarClientesPermitidos(usuarioId: string, clienteIds: string[]): Promise<void>;
}

// Token de inyección — Nest no puede usar una interfaz TS como token en runtime.
export const USUARIOS_REPOSITORIO = Symbol("USUARIOS_REPOSITORIO");
