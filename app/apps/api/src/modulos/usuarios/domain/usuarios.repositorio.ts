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
}

// Token de inyección — Nest no puede usar una interfaz TS como token en runtime.
export const USUARIOS_REPOSITORIO = Symbol("USUARIOS_REPOSITORIO");
