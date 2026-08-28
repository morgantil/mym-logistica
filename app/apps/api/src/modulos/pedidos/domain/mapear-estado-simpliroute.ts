import { EstadoPedido } from "@mym/shared-types";

// §19 funcional — mapeo del status crudo de una Visit de SimpliRoute
// ("pending" | "entered" | "completed" | "failed", confirmado vía OPTIONS
// contra la cuenta real 2026-08-28, ver logistica-provider.port.ts) al
// EstadoPedido propio. Ya existían los 4 valores necesarios en el enum — no
// hizo falta agregar ningún estado nuevo ni en MyM ni en SimpliRoute.
// `null` = status desconocido/no mapeado: el llamador debe ignorarlo y dejar
// el estado actual sin tocar, nunca asumir un valor por defecto sobre plata
// real (mismo criterio que el resto de esta integración).
export function mapearEstadoSimpliRoute(estadoCrudo: string): EstadoPedido | null {
  switch (estadoCrudo) {
    case "pending":
      return EstadoPedido.COORDINADO;
    case "entered":
      return EstadoPedido.EN_TRANSITO;
    case "completed":
      return EstadoPedido.ENTREGADO;
    case "failed":
      return EstadoPedido.ENTREGA_FALLIDA;
    default:
      return null;
  }
}
