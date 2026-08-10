import { EstadoPedido, EstadoSimpliroute, EstadoValidacion } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Colores propios además de los variants por defecto de Badge: acá el color
// también es información (verde = listo, ámbar = pendiente, rojo = error), no
// solo decoración — ayuda a un vistazo rápido en una grilla grande.
const CLASES_TONO = {
  verde: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  ambar: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  gris: "bg-secondary text-secondary-foreground",
} as const;

const LABELS_ESTADO_PEDIDO: Record<EstadoPedido, { texto: string; tono: keyof typeof CLASES_TONO }> = {
  [EstadoPedido.SIN_ASIGNAR]: { texto: "Sin asignar", tono: "gris" },
  [EstadoPedido.COORDINADO]: { texto: "Coordinado", tono: "ambar" },
  [EstadoPedido.EN_TRANSITO]: { texto: "En tránsito", tono: "ambar" },
  [EstadoPedido.ENTREGADO]: { texto: "Entregado", tono: "verde" },
  [EstadoPedido.ENTREGA_FALLIDA]: { texto: "Entrega fallida", tono: "gris" },
  [EstadoPedido.CANCELADO]: { texto: "Cancelado", tono: "gris" },
};

const LABELS_ESTADO_VALIDACION: Record<EstadoValidacion, { texto: string; tono: keyof typeof CLASES_TONO }> = {
  [EstadoValidacion.PENDIENTE]: { texto: "Pendiente", tono: "ambar" },
  [EstadoValidacion.VALIDO]: { texto: "Válido", tono: "verde" },
  [EstadoValidacion.CON_ERRORES]: { texto: "Con errores", tono: "gris" },
};

const LABELS_ESTADO_SIMPLIROUTE: Record<EstadoSimpliroute, { texto: string; tono: keyof typeof CLASES_TONO }> = {
  [EstadoSimpliroute.NO_ENVIADO]: { texto: "No enviado", tono: "gris" },
  [EstadoSimpliroute.ENVIADO]: { texto: "Enviado", tono: "verde" },
  [EstadoSimpliroute.NO_ENCONTRADO]: { texto: "No encontrado", tono: "gris" },
  [EstadoSimpliroute.ERROR]: { texto: "Error", tono: "gris" },
};

function BadgeEstado({ texto, tono }: { texto: string; tono: keyof typeof CLASES_TONO }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", CLASES_TONO[tono])}>
      {texto}
    </Badge>
  );
}

export function BadgeEstadoPedido({ estado }: { estado: EstadoPedido }) {
  return <BadgeEstado {...LABELS_ESTADO_PEDIDO[estado]} />;
}

export function BadgeEstadoValidacion({ estado }: { estado: EstadoValidacion }) {
  return <BadgeEstado {...LABELS_ESTADO_VALIDACION[estado]} />;
}

export function BadgeEstadoSimpliroute({ estado }: { estado: EstadoSimpliroute }) {
  return <BadgeEstado {...LABELS_ESTADO_SIMPLIROUTE[estado]} />;
}

export const LABEL_ESTADO_PEDIDO: Record<EstadoPedido, string> = Object.fromEntries(
  Object.entries(LABELS_ESTADO_PEDIDO).map(([clave, valor]) => [clave, valor.texto]),
) as Record<EstadoPedido, string>;
