import type { Rol } from "@/features/auth/tipos";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  roles: Rol[];
  activo: boolean;
  clientesPermitidosIds: string[]; // vacío = ve todos los clientes
}

export interface DatosCrearUsuario {
  email: string;
  nombre: string;
  roles: Rol[];
  clienteIds: string[];
}

export interface DatosActualizarUsuario {
  nombre?: string;
  roles?: Rol[];
  activo?: boolean;
}
