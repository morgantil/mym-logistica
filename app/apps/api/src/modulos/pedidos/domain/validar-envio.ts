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
  // Zona/chofer sin identificar YA NO bloquea el envío — decisión reunión
  // 2026-10-21 (Pablo Renzo): hay direcciones que SimpliRoute interpreta mal
  // (point-in-polygon no matchea ninguna zona) aunque la cobertura real
  // llegue ahí — antes esos pedidos quedaban trabados sin poder enviarse en
  // absoluto. Ahora se envían igual (la Visit se crea sin ruta asignada,
  // mismo mecanismo ya probado en PedidosService.enviarASimpliRoute: si no
  // hay choferId/vehiculoId resuelto, simplemente no se llama
  // asignarChoferVehiculo) y quedan pendientes de asignar manualmente desde
  // la propia interfaz de SimpliRoute — que es el flujo que ya usa el
  // cliente hoy para este caso.
  //
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
