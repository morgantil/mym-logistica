import type { Rol } from "@/features/auth/tipos";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  roles: Rol[];
  activo: boolean;
  clientesPermitidosIds: string[]; // vacío = ve todos los clientes
  // Qué pantallas ve en el menú — decisión 2026-10-04. Vacío = sin
  // restricción propia, usa el menú de sus roles (ver nav-items.ts).
  pantallasPermitidas: string[];
}

export interface DatosCrearUsuario {
  email: string;
  nombre: string;
  roles: Rol[];
  clienteIds: string[];
  // Opcional — si se omite, el backend genera una temporal (ver
  // UsuariosService.crear).
  password?: string;
}

export interface DatosActualizarUsuario {
  nombre?: string;
  roles?: Rol[];
  activo?: boolean;
  pantallasPermitidas?: string[];
}
