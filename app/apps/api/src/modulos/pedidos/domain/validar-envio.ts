import { EstadoSimpliroute, EstadoValidacion } from "@mym/shared-types";
import { Pedido } from "./pedido";

// DOCUMENTO FUNCIONAL.md §17 — "Revisión antes de enviar": lista de motivos
// bloqueantes. Devuelve [] si el pedido puede enviarse. Función pura: nada de
// esto pega a la base ni a SimpliRoute, solo mira el estado ya cargado del pedido.
export function validarPedidoParaEnvio(pedido: Pedido): string[] {
  const errores: string[] = [];

  if (pedido.estadoValidacion !== EstadoValidacion.VALIDO) {
    errores.push("Datos obligatorios faltantes.");
  }
  if (pedido.estadoSimpliroute === EstadoSimpliroute.NO_ENCONTRADO) {
    errores.push("Afiliado no encontrado en SimpliRoute.");
  }
  if (!pedido.zonaId) {
    errores.push("Zona sin identificar.");
  }
  if (!pedido.choferId) {
    errores.push("Chofer sin asignar.");
  }
  // Decisión 2026-09-16 (Leonardo, QA): antes esto solo quedaba anotado en
  // observaciones y el pedido se podía enviar igual — ver
  // PedidosService.resolverAlertaDireccion para la forma de destrabarlo.
  if (pedido.alertaDireccionPendiente) {
    errores.push("Dirección distinta a la registrada en el padrón — resolver antes de enviar.");
  }
  // Bultos NO bloquea el envío a SimpliRoute (decisión 2026-09-01) — se puede
  // cargar más cerca del despacho. Sigue siendo obligatorio para imprimir
  // etiquetas (PedidosService.generarEtiquetas), ahí sí hace falta saber el
  // total para numerarlas.

  return errores;
}
