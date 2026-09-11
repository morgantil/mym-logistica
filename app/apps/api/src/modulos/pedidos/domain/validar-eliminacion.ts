import { EstadoSimpliroute } from "@mym/shared-types";
import { Pedido } from "./pedido";

// Decisión 2026-09-11 (Leonardo, tras el incidente de base de datos —
// necesitaba una forma propia de sacar pedidos mal cargados/duplicados/de
// prueba sin depender de un script contra la base): solo se puede borrar un
// pedido que todavía NO se mandó a SimpliRoute — si ya se envió, borrarlo acá
// dejaría una Visit huérfana del otro lado, sin ningún registro que la
// explique. Función pura, mismo estilo que validar-envio.ts.
export function validarPedidoParaEliminar(pedido: Pedido): string | null {
  if (pedido.estadoSimpliroute !== EstadoSimpliroute.NO_ENVIADO) {
    return "El pedido ya se envió a SimpliRoute, no se puede borrar desde acá.";
  }
  return null;
}
