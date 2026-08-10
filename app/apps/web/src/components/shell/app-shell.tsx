import { Outlet, NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { navItems } from "./nav-items";

function iniciales(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AppShell() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;

  const itemsVisibles = navItems.filter(
    (item) => !item.roles || item.roles.some((rol) => usuario.roles.includes(rol)),
  );

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <span className="text-lg font-semibold">MyM Logística</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>{iniciales(usuario.email)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{usuario.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{usuario.email}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {usuario.roles.join(", ")}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Nav siempre visible, sin menú hamburguesa: son pocos ítems y el
            público de la app prefiere no tener que "descubrir" dónde está
            cada cosa (DOCUMENTO TECNICO.md sección 6.2). */}
        <nav className="hidden w-56 shrink-0 border-r p-4 md:block">
          <ul className="flex flex-col gap-1">
            {itemsVisibles.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-md px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
          {itemsVisibles.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* min-w-0: sin esto, un flex item nunca se achica más allá del ancho
            de su contenido (ej. una tabla ancha) — la página entera terminaba
            scrolleando horizontal en vez de solo la tabla dentro de su propio
            contenedor. */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
