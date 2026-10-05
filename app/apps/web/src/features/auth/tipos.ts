// Espejo de los 4 roles del §33 funcional (enum Rol en prisma/schema.prisma).
// Un usuario puede tener más de uno a la vez.
export type Rol = "OPERACIONES" | "LOGISTICA" | "ADMINISTRACION" | "FACTURACION";

export interface UsuarioAutenticado {
  id: string;
  email: string;
  roles: Rol[];
  // Qué pantallas ve en el menú — decisión 2026-10-04, ver nav-items.ts.
  // Vacío = sin restricción propia, usa el menú de sus roles.
  pantallasPermitidas: string[];
}
