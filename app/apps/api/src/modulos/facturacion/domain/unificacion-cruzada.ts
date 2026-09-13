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

// Radio de tolerancia para considerar "la misma entrega" — decisión
// 2026-09-11 (ver DOCUMENTO TECNICO.md historial): dos empresas distintas
// tipeando la misma dirección real en sus propios Excel casi nunca coinciden
// letra por letra ("5º" vs "5to", "Depto" vs "Dpto"), así que emparejar por
// texto exacto (como se hacía antes) pierde matches reales en silencio, sin
// avisar. La coordenada real de entrega (geocodificada por SimpliRoute al
// enviar, ver Pedido.latitudEntrega) no depende de cómo cada empresa tipeó
// la dirección. No hay todavía datos reales de Farmaet para calibrar el
// número "correcto" — Leonardo eligió 100 metros directamente como margen
// suficiente en vez de esperar a tener casos reales para ajustarlo.
const RADIO_MISMA_UBICACION_METROS = 100;

type PedidoConCoordenadas = PedidoParaFacturar & { latitudEntrega: number; longitudEntrega: number };

function tieneCoordenadas(pedido: PedidoParaFacturar): pedido is PedidoConCoordenadas {
  return pedido.latitudEntrega !== null && pedido.longitudEntrega !== null;
}

// Distancia entre dos coordenadas en metros (fórmula de Haversine — la
// Tierra no es plana, pero a la escala de una ciudad el error de asumir una
// esfera es insignificante para lo que necesitamos: distinguir "mismo
// edificio" de "otra cuadra").
function distanciaMetros(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const RADIO_TIERRA_METROS = 6371000;
  const aRadianes = (grados: number) => (grados * Math.PI) / 180;
  const deltaLat = aRadianes(b.lat - a.lat);
  const deltaLon = aRadianes(b.lon - a.lon);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.sqrt(haversine));
}

// Elige, de los candidatos disponibles en la misma fecha, cuál es "el mismo
// domicilio" que `propio`. Prioriza coordenadas reales (más confiable, ver
// comentario de RADIO_MISMA_UBICACION_METROS); si a `propio` o a un
// candidato le falta la coordenada (todavía no se envió a SimpliRoute, o no
// pudo geocodificar), cae al texto exacto como red de seguridad — nunca deja
// de intentar emparejar solo porque falta un dato.
function elegirSocio(
  propio: PedidoParaFacturar,
  candidatos: PedidoParaFacturar[],
): PedidoParaFacturar | undefined {
  if (tieneCoordenadas(propio)) {
    let mejorCandidato: PedidoConCoordenadas | undefined;
    let mejorDistancia = RADIO_MISMA_UBICACION_METROS;
    const sinCoordenadas: PedidoParaFacturar[] = [];

    for (const candidato of candidatos) {
      if (!tieneCoordenadas(candidato)) {
        sinCoordenadas.push(candidato);
        continue;
      }
      const distancia = distanciaMetros(
        { lat: propio.latitudEntrega, lon: propio.longitudEntrega },
        { lat: candidato.latitudEntrega, lon: candidato.longitudEntrega },
      );
      if (distancia <= mejorDistancia) {
        mejorCandidato = candidato;
        mejorDistancia = distancia;
      }
    }
    if (mejorCandidato) return mejorCandidato;

    // Ningún candidato con coordenada cayó dentro del radio — solo probamos
    // texto contra los que NO tienen coordenada (si uno con coordenada no
    // matcheó por distancia, confiamos en esa señal antes que en el texto).
    return sinCoordenadas.find(
      (candidato) => normalizarDireccion(candidato.direccionUsada) === normalizarDireccion(propio.direccionUsada),
    );
  }

  // `propio` no tiene coordenada todavía (no se envió a SimpliRoute) — el
  // único dato disponible para comparar es el texto de la dirección.
  return candidatos.find(
    (candidato) => normalizarDireccion(candidato.direccionUsada) === normalizarDireccion(propio.direccionUsada),
  );
}

export function buscarUnificacionesEntreClientes(
  propios: PedidoParaFacturar[],
  socios: PedidoParaFacturar[],
): ResultadoUnificacionCruzada {
  const disponiblesPorFecha = new Map<string, PedidoParaFacturar[]>();
  for (const socio of socios) {
    const lista = disponiblesPorFecha.get(socio.fechaProgramada);
    if (lista) lista.push(socio);
    else disponiblesPorFecha.set(socio.fechaProgramada, [socio]);
  }

  const unificaciones: { propio: PedidoParaFacturar; socio: PedidoParaFacturar }[] = [];
  const propiosRestantes: PedidoParaFacturar[] = [];

  for (const propio of propios) {
    const candidatos = disponiblesPorFecha.get(propio.fechaProgramada) ?? [];
    const socio = elegirSocio(propio, candidatos);
    if (socio) {
      candidatos.splice(candidatos.indexOf(socio), 1);
      unificaciones.push({ propio, socio });
    } else {
      propiosRestantes.push(propio);
    }
  }

  return { unificaciones, propiosRestantes };
}

// Arma la ViajeFacturable del lado PAÑAL de una unificación cruzada ya
// decidida (propio + socio) — tarifa propia × porcentaje propio, sin cambios
// desde que se armó esto (decisión 2026-09-08). Separado de la búsqueda para
// que FacturacionService también lo pueda usar directo cuando el par ya
// viene decidido de antes (ver UnificacionCruzadaPar, riesgo #2) y no hace
// falta volver a buscarlo por fecha/ubicación.
export function construirViajeUnificacionCruzadaPanal(
  propio: PedidoParaFacturar,
  socio: PedidoParaFacturar,
  tarifas: TarifasPorTipo,
  porcentajePanal: number,
): ViajeFacturable {
  const tarifa = tarifas[claveTarifaDePedido(propio)];
  if (tarifa === undefined) {
    throw new Error(
      `Falta tarifa vigente para zona=${propio.zonaTarifariaId} tipoServicio=${propio.tipoServicio} tipoEnvase=${propio.tipoEnvase ?? "-"}.`,
    );
  }
  const importe = tarifa * (porcentajePanal / 100);
  return {
    clienteId: propio.clienteId,
    fecha: propio.fechaProgramada,
    direccion: propio.direccionUsada,
    zonaTarifariaId: propio.zonaTarifariaId,
    pedidoIds: [propio.id],
    reglaAplicada: "UNIFICADA",
    cantidadViajes: 1,
    tarifaUtilizada: tarifa,
    porcentajeAplicado: porcentajePanal,
    importeCalculado: importe,
    socioEntreClientes: { pedidoId: socio.id, clienteId: socio.clienteId },
  };
}

// Arma la ViajeFacturable del lado MEDICAMENTO de una unificación cruzada ya
// decidida — decisión 2026-09-12: ya no es tarifa×%, es un monto fijo "de
// paso por compartir el viaje", que varía por zona (y opcionalmente por
// Bolsa/Bulto, ver MontoUnificadoMedicamento). `montosUnificadoMedicamento`
// viene indexado con la misma clave que `TarifasPorTipo`
// (zona+tipoServicio+envase, ver construirClaveTarifa).
export function construirViajeUnificacionCruzadaMedicamento(
  propio: PedidoParaFacturar,
  socio: PedidoParaFacturar,
  montosUnificadoMedicamento: TarifasPorTipo,
): ViajeFacturable {
  const monto = montosUnificadoMedicamento[claveTarifaDePedido(propio)];
  if (monto === undefined) {
    throw new Error(
      `Falta un monto fijo de unificado para zona=${propio.zonaTarifariaId} tipoEnvase=${propio.tipoEnvase ?? "-"}.`,
    );
  }
  return {
    clienteId: propio.clienteId,
    fecha: propio.fechaProgramada,
    direccion: propio.direccionUsada,
    zonaTarifariaId: propio.zonaTarifariaId,
    pedidoIds: [propio.id],
    reglaAplicada: "UNIFICADA",
    cantidadViajes: 1,
    tarifaUtilizada: monto,
    porcentajeAplicado: null,
    montoFijoMedicamentoAplicado: monto,
    importeCalculado: monto,
    socioEntreClientes: { pedidoId: socio.id, clienteId: socio.clienteId },
  };
}
