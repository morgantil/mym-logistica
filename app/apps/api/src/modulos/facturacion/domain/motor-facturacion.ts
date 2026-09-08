import { TipoEnvase, TipoServicio } from "@mym/shared-types";

// DOCUMENTO FUNCIONAL.md §21-§29 + Guia_Desarrollo_Logica_Facturacion_Arbet.docx:
// reglas de facturación. Funciones puras, sin NestJS/Prisma — se testean
// contra los casos de ejemplo de ambos documentos sin necesitar una base de
// datos levantada (ver README del módulo).
//
// La zona tarifaria (antes un enum fijo CABA/Provincia) es un id de
// ZonaTarifaria — tabla configurable (documento funcional v6 §10.2: CABA +
// Cordón 1/2/3, ver DOCUMENTO TECNICO.md historial 2026-08-17). El motor no
// necesita saber cuántas zonas existen ni sus nombres, solo agrupar por id.

export interface PedidoParaFacturar {
  id: string;
  clienteId: string;
  tipoServicio: TipoServicio;
  // Solo relevante si tipoServicio === MEDICAMENTO (Guia Arbet paso 2). Null
  // para pañales, o para un pedido de medicamentos sin líneas clasificadas
  // todavía — ver determinarClasificacionMedicamento.
  tipoEnvase: TipoEnvase | null;
  fechaProgramada: string; // YYYY-MM-DD
  direccionUsada: string;
  zonaTarifariaId: string;
}

export type ReglaAplicada = "2x1" | "UNIFICADA" | "INDIVIDUAL";

export interface ViajeFacturable {
  clienteId: string;
  fecha: string;
  direccion: string;
  zonaTarifariaId: string;
  pedidoIds: string[];
  reglaAplicada: ReglaAplicada;
  tarifaUtilizada: number;
  porcentajeAplicado: number | null;
  importeCalculado: number;
  // Solo poblado en UNIFICADA: pañal y medicamento ahora tienen cada uno su
  // propio % configurable (decisión 2026-09-08 — ver PorcentajeSegundoServicio),
  // un solo `porcentajeAplicado` ya no alcanza para representar los dos.
  detalleUnificacion?: {
    tarifaPanal: number;
    porcentajePanal: number;
    importePanal: number;
    tarifaMedicamento: number;
    porcentajeMedicamento: number;
    importeMedicamento: number;
  };
  // Solo poblado cuando la unificación fue ENTRE dos clientes distintos (una
  // combinación habilitada, ver CombinacionUnificacionClientes) — trazabilidad
  // de qué pedido/cliente "socio" generó esta unificación. El pedido socio no
  // se agrega a `pedidoIds`: cada cliente se factura por separado, solo por su
  // propia porción (ver unificacion-cruzada.ts).
  socioEntreClientes?: { pedidoId: string; clienteId: string };
}

// Mapa de tarifas vigentes, indexado por una clave compuesta que distingue
// zona + tipo de servicio + Bolsa/Bulto (Guia Arbet paso 5: "Medicamentos:
// Cliente + Zona tarifaria + Bolsa/Bulto"). Solo necesita tener entradas para
// las combinaciones que efectivamente aparecen entre los pedidos a facturar
// (ver FacturacionService.generarVistaPrevia).
export type TarifasPorTipo = Record<string, number>;

export interface ClaveTarifa {
  zonaTarifariaId: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
}

export function construirClaveTarifa(clave: ClaveTarifa): string {
  return [clave.zonaTarifariaId, clave.tipoServicio, clave.tipoEnvase ?? ""].join("|");
}

export function claveTarifaDePedido(pedido: PedidoParaFacturar): string {
  return construirClaveTarifa({
    zonaTarifariaId: pedido.zonaTarifariaId,
    tipoServicio: pedido.tipoServicio,
    tipoEnvase: pedido.tipoEnvase,
  });
}

export const normalizarDireccion = (direccion: string) => direccion.trim().toUpperCase().replace(/\s+/g, " ");

export interface GrupoClienteFechaDireccion {
  clienteId: string;
  fecha: string;
  direccion: string;
  zonaTarifariaId: string;
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
        zonaTarifariaId: pedido.zonaTarifariaId,
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
// unificación posible, quedan 2 pañales para 2x1). La elegibilidad para
// unificar no depende del Bolsa/Bulto del medicamento (eso solo afecta qué
// tarifa se le aplica, no si se puede unificar).
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
// factura solo como viaje adicional ("INDIVIDUAL"). El llamador ya agrupó los
// pedidos de forma que compartan la misma clave de tarifa (mismo Bolsa/Bulto
// si son medicamentos) — acá adentro solo importa la cantidad.
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

// Agrupa una lista de pedidos (ya del mismo tipo de servicio) por su clave de
// tarifa (zona + tipo + Bolsa/Bulto) — necesario porque dos pedidos de
// medicamentos en el mismo grupo cliente+fecha+dirección pueden tener
// distinto Bolsa/Bulto, y por lo tanto distinta tarifa, así que no pueden
// compartir el mismo viaje de 2x1 sin que el "tarifaUtilizada" del viaje
// quede ambiguo.
function agruparPorClaveTarifa(pedidos: PedidoParaFacturar[]): Map<string, PedidoParaFacturar[]> {
  const grupos = new Map<string, PedidoParaFacturar[]>();
  for (const pedido of pedidos) {
    const clave = claveTarifaDePedido(pedido);
    const lista = grupos.get(clave);
    if (lista) lista.push(pedido);
    else grupos.set(clave, [pedido]);
  }
  return grupos;
}

export interface PorcentajesUnificacion {
  panal: number;
  medicamento: number;
}

// §27 completo: orquesta los pasos para UN cliente. El llamador ya filtró
// `pedidos` por cliente (y por mes/año a facturar, y ya restó los pedidos que
// se hayan resuelto en una unificación ENTRE clientes — ver
// unificacion-cruzada.ts) — `tarifas` son las vigentes para ese cliente en
// ese período, indexadas por construirClaveTarifa. La separación por cliente
// dentro de agruparPorClienteFechaDireccion es defensiva (permite testear con
// datos de varios clientes mezclados sin que se crucen, §29), no una
// responsabilidad que el llamador deba delegar.
export function calcularFacturacionCliente(
  pedidos: PedidoParaFacturar[],
  tarifas: TarifasPorTipo,
  porcentajes: PorcentajesUnificacion,
): ViajeFacturable[] {
  const viajes: ViajeFacturable[] = [];

  const tarifaDe = (pedido: PedidoParaFacturar): number => {
    const tarifa = tarifas[claveTarifaDePedido(pedido)];
    if (tarifa === undefined) {
      throw new Error(
        `Falta tarifa vigente para zona=${pedido.zonaTarifariaId} tipoServicio=${pedido.tipoServicio} tipoEnvase=${pedido.tipoEnvase ?? "-"}.`,
      );
    }
    return tarifa;
  };

  for (const grupo of agruparPorClienteFechaDireccion(pedidos)) {
    const { panales, medicamentos } = separarPorTipoServicio(grupo.pedidos);
    const { unificaciones, panalesRestantes, medicamentosRestantes } = buscarUnificaciones(
      panales,
      medicamentos,
    );

    for (const { panal, medicamento } of unificaciones) {
      const tarifaPanal = tarifaDe(panal);
      const tarifaMedicamento = tarifaDe(medicamento);
      const importePanal = tarifaPanal * (porcentajes.panal / 100);
      const importeMedicamento = tarifaMedicamento * (porcentajes.medicamento / 100);
      viajes.push({
        clienteId: grupo.clienteId,
        fecha: grupo.fecha,
        direccion: grupo.direccion,
        zonaTarifariaId: grupo.zonaTarifariaId,
        pedidoIds: [panal.id, medicamento.id],
        reglaAplicada: "UNIFICADA",
        tarifaUtilizada: tarifaPanal + tarifaMedicamento,
        porcentajeAplicado: null,
        importeCalculado: importePanal + importeMedicamento,
        detalleUnificacion: {
          tarifaPanal,
          porcentajePanal: porcentajes.panal,
          importePanal,
          tarifaMedicamento,
          porcentajeMedicamento: porcentajes.medicamento,
          importeMedicamento,
        },
      });
    }

    // 2x1 sobre lo que quedó sin unificar — sub-agrupado por clave de tarifa
    // (panalesRestantes siempre comparte una sola clave; medicamentosRestantes
    // puede tener Bolsa y Bulto mezclados dentro del mismo grupo fecha+dirección).
    for (const restantesDeUnTipo of [panalesRestantes, medicamentosRestantes]) {
      for (const [, pedidosDeEstaClave] of agruparPorClaveTarifa(restantesDeUnTipo)) {
        const tarifa = tarifaDe(pedidosDeEstaClave[0]);
        for (const viaje of aplicarDosPorUno(pedidosDeEstaClave)) {
          viajes.push({
            clienteId: grupo.clienteId,
            fecha: grupo.fecha,
            direccion: grupo.direccion,
            zonaTarifariaId: grupo.zonaTarifariaId,
            pedidoIds: viaje.pedidoIds,
            reglaAplicada: viaje.reglaAplicada,
            tarifaUtilizada: tarifa,
            porcentajeAplicado: null,
            importeCalculado: tarifa,
          });
        }
      }
    }
  }

  return viajes;
}
