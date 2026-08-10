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
  if (pedido.bultos === null || pedido.bultos === undefined) {
    errores.push("Bultos sin cargar.");
  }

  return errores;
}
