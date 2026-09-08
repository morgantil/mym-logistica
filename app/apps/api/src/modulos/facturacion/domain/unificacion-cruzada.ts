import {
  PedidoParaFacturar,
  TarifasPorTipo,
  ViajeFacturable,
  claveTarifaDePedido,
  normalizarDireccion,
} from "./motor-facturacion";

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx paso 4: una entrega también
// puede ser unificada entre DOS CLIENTES distintos, cuando la combinación
// está habilitada (ver CombinacionUnificacionClientes) — ej. Farmaet
// (medicamentos) + Farmapal (pañales) en el mismo domicilio/fecha. Distinto
// de agruparPorClienteFechaDireccion (que agrupa DENTRO de un mismo cliente,
// para el caso de un cliente AMBOS como Bella Vista, que ya funciona con el
// motor de un solo cliente): acá se ignora clienteId a propósito.
//
// Decisión 2026-09-08 (no confirmada explícitamente por Leonardo, asumida
// como la más consistente con "una tarifa por cliente, se cobra un % de
// pañal y uno de medicamento" — a confirmar si el cliente la cuestiona):
// cada cliente se factura por SU PROPIA porción de la entrega compartida,
// con su propia tarifa y su propio % — no un monto único repartido entre los
// dos. Por eso `pedidoIds` de la ViajeFacturable resultante solo incluye el
// pedido de `propio`; el pedido del socio se guarda aparte (`socioEntreClientes`)
// solo como trazabilidad, y aparece facturado en su propio cliente cuando ese
// cliente corra su propia vista previa.
export interface ResultadoUnificacionCruzada {
  unificaciones: { propio: PedidoParaFacturar; socio: PedidoParaFacturar }[];
  propiosRestantes: PedidoParaFacturar[];
}

export function buscarUnificacionesEntreClientes(
  propios: PedidoParaFacturar[],
  socios: PedidoParaFacturar[],
): ResultadoUnificacionCruzada {
  const disponiblesPorClave = new Map<string, PedidoParaFacturar[]>();
  for (const socio of socios) {
    const clave = [socio.fechaProgramada, normalizarDireccion(socio.direccionUsada)].join("|");
    const lista = disponiblesPorClave.get(clave);
    if (lista) lista.push(socio);
    else disponiblesPorClave.set(clave, [socio]);
  }

  const unificaciones: { propio: PedidoParaFacturar; socio: PedidoParaFacturar }[] = [];
  const propiosRestantes: PedidoParaFacturar[] = [];

  for (const propio of propios) {
    const clave = [propio.fechaProgramada, normalizarDireccion(propio.direccionUsada)].join("|");
    const socio = disponiblesPorClave.get(clave)?.shift();
    if (socio) {
      unificaciones.push({ propio, socio });
    } else {
      propiosRestantes.push(propio);
    }
  }

  return { unificaciones, propiosRestantes };
}

// Arma las ViajeFacturable de las unificaciones cruzadas encontradas, usando
// SOLO la tarifa/porcentaje propios del cliente que se está facturando
// (`porcentajePropio` ya viene resuelto por el llamador: porcentajePanal si
// `propios` son pañales, porcentajeMedicamento si son medicamentos).
export function calcularUnificacionesEntreClientes(
  propios: PedidoParaFacturar[],
  socios: PedidoParaFacturar[],
  tarifas: TarifasPorTipo,
  porcentajePropio: number,
): { viajes: ViajeFacturable[]; propiosRestantes: PedidoParaFacturar[] } {
  const { unificaciones, propiosRestantes } = buscarUnificacionesEntreClientes(propios, socios);

  const viajes: ViajeFacturable[] = unificaciones.map(({ propio, socio }) => {
    const tarifa = tarifas[claveTarifaDePedido(propio)];
    if (tarifa === undefined) {
      throw new Error(
        `Falta tarifa vigente para zona=${propio.zonaTarifariaId} tipoServicio=${propio.tipoServicio} tipoEnvase=${propio.tipoEnvase ?? "-"}.`,
      );
    }
    const importe = tarifa * (porcentajePropio / 100);
    return {
      clienteId: propio.clienteId,
      fecha: propio.fechaProgramada,
      direccion: propio.direccionUsada,
      zonaTarifariaId: propio.zonaTarifariaId,
      pedidoIds: [propio.id],
      reglaAplicada: "UNIFICADA",
      tarifaUtilizada: tarifa,
      porcentajeAplicado: porcentajePropio,
      importeCalculado: importe,
      socioEntreClientes: { pedidoId: socio.id, clienteId: socio.clienteId },
    };
  });

  return { viajes, propiosRestantes };
}
