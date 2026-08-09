import { SetMetadata } from "@nestjs/common";
import { Rol } from "@prisma/client";

export const ROLES_KEY = "roles";

// Uso: @Roles(Rol.ADMINISTRACION, Rol.FACTURACION) — el usuario pasa si tiene AL MENOS uno.
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
