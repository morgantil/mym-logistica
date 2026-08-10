import type { Rol } from "@/features/auth/tipos";

export interface NavItem {
  to: string;
  label: string;
  // Sin `roles`: visible para cualquier usuario autenticado.
  roles?: Rol[];
}

// Estructura de navegación de la 1ra etapa (pañales) — §38 funcional.
// Facturación (Etapa 2) queda listada porque ya tiene módulo de backend en
// construcción, aunque la pantalla todavía no existe (ver DOCUMENTO TECNICO.md).
export const navItems: NavItem[] = [
  { to: "/", label: "Inicio" },
  { to: "/pedidos", label: "Pedidos", roles: ["OPERACIONES", "LOGISTICA", "ADMINISTRACION"] },
  { to: "/importar", label: "Importar Excel", roles: ["OPERACIONES", "ADMINISTRACION"] },
  { to: "/clientes", label: "Clientes", roles: ["ADMINISTRACION"] },
  { to: "/zonas-choferes", label: "Zonas y choferes", roles: ["LOGISTICA", "ADMINISTRACION"] },
  { to: "/facturacion", label: "Facturación", roles: ["FACTURACION", "ADMINISTRACION"] },
];
