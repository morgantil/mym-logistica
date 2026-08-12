import { CabaProvincia, TipoServicio } from "@mym/shared-types";

// DOCUMENTO FUNCIONAL.md §21-§29: reglas de facturación. Funciones puras, sin
// NestJS/Prisma — se testean contra los 4 casos de ejemplo del §28 sin
// necesitar una base de datos levantada (ver README del módulo).

export interface PedidoParaFacturar {
  id: string;
  clienteId: string;
  tipoServicio: TipoServicio;
  fechaProgramada: string; // YYYY-MM-DD
  direccionUsada: string;
  cabaProvincia: CabaProvincia;
}

export type ReglaAplicada = "2x1" | "UNIFICADA" | "INDIVIDUAL";

export interface ViajeFacturable {
  clienteId: string;
  fecha: string;
  direccion: string;
  cabaProvincia: CabaProvincia;
  pedidoIds: string[];
  reglaAplicada: ReglaAplicada;
  tarifaUtilizada: number;
  porcentajeAplicado: number | null;
  importeCalculado: number;
}

export interface TarifasPorTipo {
  [CabaProvincia.CABA]: number;
  [CabaProvincia.PROVINCIA]: number;
}

// PLACEHOLDER — pendiente de la pregunta 1 de PREGUNTAS_FACTURACION.pdf: qué
// servicio se cobra al 100% en una entrega unificada. El resultado numérico
// (§28 casos 3 y 4) no depende de esta asignación — solo determina qué pedido
// queda marcado como "principal" a efectos de trazabilidad (§32). Cambiar
// esta constante el día que llegue la respuesta no requiere tocar el resto
// del motor. Ver DOCUMENTO TECNICO.md, historial 2026-08-10.
export const SERVICIO_AL_CIEN_POR_CIENTO_EN_UNIFICADA: TipoServicio = TipoServicio.PANAL;

const normalizarDireccion = (direccion: string) => direccion.trim().toUpperCase().replace(/\s+/g, " ");

export interface GrupoClienteFechaDireccion {
  clienteId: string;
  fecha: string;
  direccion: string;
  cabaProvincia: CabaProvincia;
  pedidos: PedidoParaFacturar[];
}

// §27 pasos 1-2: separar por cliente y agrupar por fecha + dirección
// normalizada dentro de cada cliente. Es la unidad sobre la que se buscan
// unificaciones y se aplica 2x1 (§22: "Cliente + Fecha + Dirección").
export function agruparPorClienteFechaDireccion(
  pedidos: PedidoParaFacturar[],
): GrupoClienteFechaDireccion[] {
  const grupos = new Map<string, GrupoClienteFechaDireccion>();

  for (const pedido of pedidos) {
    const clave = [pedido.clienteId, pedido.fechaProgramada, normalizarDireccion(pedido.direccionUsada)].join(
      "|",
    );
    const grupoExistente = grupos.get(clave);
    if (grupoExistente) {
      grupoExistente.pedidos.push(pedido);
    } else {
      grupos.set(clave, {
        clienteId: pedido.clienteId,
        fecha: pedido.fechaProgramada,
        direccion: pedido.direccionUsada,
        cabaProvincia: pedido.cabaProvincia,
        pedidos: [pedido],
      });
    }
  }

  return Array.from(grupos.values());
}

export interface PedidosPorTipo {
  panales: PedidoParaFacturar[];
  medicamentos: PedidoParaFacturar[];
}

// §27 paso 3.
export function separarPorTipoServicio(pedidos: PedidoParaFacturar[]): PedidosPorTipo {
  return {
    panales: pedidos.filter((pedido) => pedido.tipoServicio === TipoServicio.PANAL),
    medicamentos: pedidos.filter((pedido) => pedido.tipoServicio === TipoServicio.MEDICAMENTO),
  };
}

export interface ResultadoUnificaciones {
  unificaciones: { panal: PedidoParaFacturar; medicamento: PedidoParaFacturar }[];
  panalesRestantes: PedidoParaFacturar[];
  medicamentosRestantes: PedidoParaFacturar[];
}

// §27 paso 4, §25 funcional: dentro de un mismo grupo cliente+fecha+dirección,
// cada pedido de pañales se empareja con uno de medicamentos hasta agotar el
// tipo con menos pedidos (§28 caso 4: 3 pañales + 1 medicamento → 1 sola
// unificación posible, quedan 2 pañales para 2x1).
export function buscarUnificaciones(
  panales: PedidoParaFacturar[],
  medicamentos: PedidoParaFacturar[],
): ResultadoUnificaciones {
  const cantidadUnificaciones = Math.min(panales.length, medicamentos.length);
  const unificaciones: { panal: PedidoParaFacturar; medicamento: PedidoParaFacturar }[] = [];

  for (let i = 0; i < cantidadUnificaciones; i++) {
    unificaciones.push({ panal: panales[i], medicamento: medicamentos[i] });
  }

  return {
    unificaciones,
    panalesRestantes: panales.slice(cantidadUnificaciones),
    medicamentosRestantes: medicamentos.slice(cantidadUnificaciones),
  };
}

export interface ViajeDosPorUno {
  pedidoIds: string[];
  reglaAplicada: "2x1" | "INDIVIDUAL";
}

// §27 pasos 5-6, §24 funcional: cada 2 pedidos (del mismo tipo, ya sin los
// usados en una unificación) forman 1 viaje. Si queda uno sin pareja, se
// factura solo como viaje adicional ("INDIVIDUAL").
export function aplicarDosPorUno(pedidos: PedidoParaFacturar[]): ViajeDosPorUno[] {
  const viajes: ViajeDosPorUno[] = [];

  for (let i = 0; i < pedidos.length; i += 2) {
    const par = pedidos.slice(i, i + 2);
    viajes.push({
      pedidoIds: par.map((pedido) => pedido.id),
      reglaAplicada: par.length === 2 ? "2x1" : "INDIVIDUAL",
    });
  }

  return viajes;
}

// §27 completo: orquesta los 7 pasos para UN cliente. El llamador ya filtró
// `pedidos` por cliente (y por mes/año a facturar) — `tarifas` y
// `porcentajeSegundoServicio` son los vigentes para ese cliente en ese
// período. La separación por cliente dentro de agruparPorClienteFechaDireccion
// es defensiva (permite testear con datos de varios clientes mezclados sin
// que se crucen, §29), no una responsabilidad que el llamador deba delegar.
export function calcularFacturacionCliente(
  pedidos: PedidoParaFacturar[],
  tarifas: TarifasPorTipo,
  porcentajeSegundoServicio: number,
  servicioAlCienPorCiento: TipoServicio = SERVICIO_AL_CIEN_POR_CIENTO_EN_UNIFICADA,
): ViajeFacturable[] {
  const viajes: ViajeFacturable[] = [];

  for (const grupo of agruparPorClienteFechaDireccion(pedidos)) {
    const tarifa = tarifas[grupo.cabaProvincia];
    const { panales, medicamentos } = separarPorTipoServicio(grupo.pedidos);
    const { unificaciones, panalesRestantes, medicamentosRestantes } = buscarUnificaciones(
      panales,
      medicamentos,
    );

    for (const { panal, medicamento } of unificaciones) {
      const principal = servicioAlCienPorCiento === TipoServicio.PANAL ? panal : medicamento;
      const secundario = servicioAlCienPorCiento === TipoServicio.PANAL ? medicamento : panal;
      viajes.push({
        clienteId: grupo.clienteId,
        fecha: grupo.fecha,
        direccion: grupo.direccion,
        cabaProvincia: grupo.cabaProvincia,
        pedidoIds: [principal.id, secundario.id],
        reglaAplicada: "UNIFICADA",
        tarifaUtilizada: tarifa,
        porcentajeAplicado: porcentajeSegundoServicio,
        importeCalculado: tarifa + tarifa * (porcentajeSegundoServicio / 100),
      });
    }

    for (const restantesDeUnTipo of [panalesRestantes, medicamentosRestantes]) {
      for (const viaje of aplicarDosPorUno(restantesDeUnTipo)) {
        viajes.push({
          clienteId: grupo.clienteId,
          fecha: grupo.fecha,
          direccion: grupo.direccion,
          cabaProvincia: grupo.cabaProvincia,
          pedidoIds: viaje.pedidoIds,
          reglaAplicada: viaje.reglaAplicada,
          tarifaUtilizada: tarifa,
          porcentajeAplicado: null,
          importeCalculado: tarifa,
        });
      }
    }
  }

  return viajes;
}
