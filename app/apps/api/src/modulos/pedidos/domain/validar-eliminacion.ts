import { EstadoSimpliroute } from "@mym/shared-types";
import { Pedido } from "./pedido";

// Decisión 2026-09-11 (Leonardo, tras el incidente de base de datos —
// necesitaba una forma propia de sacar pedidos mal cargados/duplicados/de
// prueba sin depender de un script contra la base): solo se puede borrar un
// pedido que todavía NO llegó a SimpliRoute — si ya se envió, borrarlo acá
// dejaría una Visit huérfana del otro lado, sin ningún registro que la
// explique. Función pura, mismo estilo que validar-envio.ts.
//
// Decisión 2026-09-22 (Leonardo): NO_ENCONTRADO también se puede borrar —
// significa que el afiliado no existe en SimpliRoute, o sea que nunca se
// creó ninguna Visit (validar-envio.ts ni siquiera deja enviarlo), así que no
// hay nada huérfano del otro lado. Tras vaciar la base casi todos los pedidos
// nuevos entran así y no había forma de sacarlos. ERROR sí sigue bloqueado:
// ahí SimpliRoute ya creó la Visit (ver marcarErrorGeocodificacion).
const ESTADOS_BORRABLES = [EstadoSimpliroute.NO_ENVIADO, EstadoSimpliroute.NO_ENCONTRADO];

export function estadoSimplirouteBorrable(estado: EstadoSimpliroute): boolean {
  return ESTADOS_BORRABLES.includes(estado);
}

export function validarPedidoParaEliminar(pedido: Pedido): string | null {
  if (!estadoSimplirouteBorrable(pedido.estadoSimpliroute)) {
    return "El pedido ya se envió a SimpliRoute, no se puede borrar desde acá.";
  }
  return null;
}
