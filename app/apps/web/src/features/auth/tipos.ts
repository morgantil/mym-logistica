// Espejo de los 4 roles del §33 funcional (enum Rol en prisma/schema.prisma).
// Un usuario puede tener más de uno a la vez.
export type Rol = "OPERACIONES" | "LOGISTICA" | "ADMINISTRACION" | "FACTURACION";

export interface UsuarioAutenticado {
  id: string;
  email: string;
  roles: Rol[];
}
