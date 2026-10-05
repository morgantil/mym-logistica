import { Rol } from "@prisma/client";

// Entidad de dominio, desacoplada del modelo de Prisma a propósito: el resto de la
// app (incluido auth) depende de esta forma, no de los tipos generados por Prisma.
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string | null;
  googleId: string | null;
  roles: Rol[];
  activo: boolean;
  // Preferencia personal de la grilla de Pedidos — ver schema.prisma.
  columnasFijasPedidos: string[];
  // Qué pantallas ve este usuario en el menú — ver comentario en
  // schema.prisma. Vacío = sin restricción propia, usa el menú de sus roles.
  pantallasPermitidas: string[];
}

export type UsuarioSinCredenciales = Omit<Usuario, "passwordHash">;
