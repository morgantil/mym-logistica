import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Layout de formulario en filas clave/valor (etiqueta a la izquierda, control
// a la derecha, separadas por una línea) — pedido explícito de Leonardo:
// "como una especie de tabla, con clave-valor, no apilado" da más claridad
// que etiqueta arriba / control abajo. Se usa en todos los formularios de la
// app (Login, Importar Excel, Clientes) para que el patrón sea consistente.
export function TablaFormulario({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y rounded-md border">{children}</div>;
}

export function FilaFormulario({
  label,
  htmlFor,
  descripcion,
  anchoEtiqueta = "180px",
  children,
}: {
  label: string;
  htmlFor?: string;
  descripcion?: string;
  // Las tarjetas angostas (ej. Login) necesitan una columna de etiqueta más
  // chica que las pantallas de administración — ver DOCUMENTO TECNICO.md 6.2.
  anchoEtiqueta?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[var(--ancho-etiqueta)_1fr] sm:items-center sm:gap-4"
      style={{ "--ancho-etiqueta": anchoEtiqueta } as React.CSSProperties}
    >
      <Label htmlFor={htmlFor} className={cn("text-sm font-medium", descripcion && "sm:self-start sm:pt-2")}>
        {label}
      </Label>
      <div className="flex flex-col gap-1">
        {children}
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
    </div>
  );
}
