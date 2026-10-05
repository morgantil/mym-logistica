import { PrioridadPedido, TipoEnvase, TipoServicio } from "@mym/shared-types";
import { determinarClasificacionMedicamento } from "./clasificacion-medicamento";

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
  // Decisión 2026-10-04: la tarifa puede variar según la Prioridad del
  // pedido (ej. Urgente o Fin de semana), ver ClaveTarifa.
  prioridad: PrioridadPedido;
  fechaProgramada: string; // YYYY-MM-DD
  direccionUsada: string;
  zonaTarifariaId: string;
  // Cuántos pedidos del sistema de origen representa este Pedido (ver
  // Pedido.cantidadPedidoOriginal en schema.prisma) — decisión 2026-09-11,
  // caso real Farmapal: varias líneas con mismo afiliado/dirección/fecha
  // pero distinto Nº de ticket se agrupan en un solo Pedido por logística,
  // pero para el 2×1 son pedidos originales separados. Siempre ≥1.
  cantidadPedidoOriginal: number;
  // Coordenada real de la entrega, geocodificada por SimpliRoute al enviar
  // (ver Pedido.latitudEntrega) — null hasta que el pedido se envía, o si no
  // pudo geocodificar. Usada solo por unificacion-cruzada.ts para emparejar
  // pedidos de dos clientes distintos por ubicación real en vez de texto.
  latitudEntrega: number | null;
  longitudEntrega: number | null;
}

export type ReglaAplicada = "2x1" | "UNIFICADA" | "INDIVIDUAL";

export interface ViajeFacturable {
  clienteId: string;
  fecha: string;
  direccion: string;
  zonaTarifariaId: string;
  pedidoIds: string[];
  reglaAplicada: ReglaAplicada;
  // Cuántos viajes representa esta fila — decisión 2026-09-11: un Pedido no
  // puede pertenecer a dos GrupoFacturacion a la vez, así que el 2×1 de un
  // grupo entero (mismo cliente+fecha+dirección+clave de tarifa) sale en UNA
  // sola fila con esta cantidad, en vez de una fila por cada par de pedidos.
  // Siempre 1 en UNIFICADA/INDIVIDUAL, puede ser >1 en 2x1 (ver
  // calcularViajesPorPeso).
  cantidadViajes: number;
  tarifaUtilizada: number;
  porcentajeAplicado: number | null;
  // Monto fijo del lado MEDICAMENTO de una unificación CRUZADA (decisión
  // 2026-09-12, reemplaza al % que usaba antes) — solo poblado cuando
  // `propio` es el lado medicamento en unificacion-cruzada.ts. Para la
  // unificación INTERNA (mismo cliente, pañal+medicamento juntos en un solo
  // viaje) ese monto vive en `detalleUnificacion.montoFijoMedicamento`.
  montoFijoMedicamentoAplicado?: number;
  importeCalculado: number;
  // Solo poblado en UNIFICADA interna (mismo cliente, pañal+medicamento en
  // un solo viaje): pañal sigue siendo tarifa×% (decisión 2026-09-08), pero
  // medicamento pasó a un monto fijo por zona (decisión 2026-09-12) — un
  // solo `porcentajeAplicado` ya no alcanza para representar los dos lados.
  detalleUnificacion?: {
    tarifaPanal: number;
    porcentajePanal: number;
    importePanal: number;
    montoFijoMedicamento: number;
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
  prioridad: PrioridadPedido;
}

export function construirClaveTarifa(clave: ClaveTarifa): string {
  return [clave.zonaTarifariaId, clave.tipoServicio, clave.tipoEnvase ?? "", clave.prioridad].join("|");
}

export function claveTarifaDePedido(pedido: PedidoParaFacturar): string {
  return construirClaveTarifa({
    zonaTarifariaId: pedido.zonaTarifariaId,
    tipoServicio: pedido.tipoServicio,
    tipoEnvase: pedido.tipoEnvase,
    prioridad: pedido.prioridad,
  });
}

// Mismo orden de severidad que pedido.ts (módulo de Pedidos) — duplicado a
// propósito: este archivo es función pura sin dependencias de otros módulos
// (ver comentario al inicio del archivo), y es la misma regla de negocio
// (Normal < Fin de semana < Urgente < Crítica), no una coincidencia.
const SEVERIDAD_PRIORIDAD: Record<PrioridadPedido, number> = {
  [PrioridadPedido.NORMAL]: 0,
  [PrioridadPedido.FIN_DE_SEMANA]: 1,
  [PrioridadPedido.URGENTE]: 2,
  [PrioridadPedido.CRITICA]: 3,
};

// Cuando varios pedidos de medicamentos con prioridad distinta caen en el
// mismo viaje (misma fecha+dirección) y hay que facturarlos juntos como un
// solo Bolsa/Bulto (ver facturarMedicamentosDelGrupo), se cobra a la
// prioridad más alta del grupo — nunca se le cobra "Normal" a un viaje que
// incluye un pedido Urgente.
function prioridadMasAlta(pedidos: PedidoParaFacturar[]): PrioridadPedido {
  return pedidos.reduce<PrioridadPedido>(
    (maxima, pedido) => (SEVERIDAD_PRIORIDAD[pedido.prioridad] > SEVERIDAD_PRIORIDAD[maxima] ? pedido.prioridad : maxima),
    PrioridadPedido.NORMAL,
  );
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

export interface ViajePorPeso {
  pedidoIds: string[];
  reglaAplicada: "2x1" | "INDIVIDUAL";
  cantidadViajes: number;
}

// §27 pasos 5-6, §24 funcional, extendido 2026-09-11 con el peso por pedidos
// originales: cada 2 pedidos ORIGINALES (no 2 filas de Pedido — ver
// cantidadPedidoOriginal) forman 1 viaje, redondeando hacia arriba si sobra
// uno (mismos ejemplos del documento Arbet: 4→2 viajes, 5→3 viajes, 10→5
// viajes — todos con peso 1 cada uno, caso más común). Un Pedido no se puede
// partir entre dos filas de facturación (no puede pertenecer a dos
// GrupoFacturacion a la vez), así que TODO el grupo sale en una sola fila con
// la cantidad de viajes que representa. El llamador ya agrupó los pedidos de
// forma que compartan la misma clave de tarifa (mismo Bolsa/Bulto si son
// medicamentos).
export function calcularViajesPorPeso(pedidos: PedidoParaFacturar[]): ViajePorPeso {
  const pesoTotal = pedidos.reduce((total, pedido) => total + pedido.cantidadPedidoOriginal, 0);
  return {
    pedidoIds: pedidos.map((pedido) => pedido.id),
    reglaAplicada: pesoTotal > 1 ? "2x1" : "INDIVIDUAL",
    cantidadViajes: Math.ceil(pesoTotal / 2),
  };
}

// Agrupa una lista de pedidos (ya del mismo tipo de servicio) por su clave de
// tarifa (zona + tipo + Bolsa/Bulto). Usado solo para pañales — todos
// comparten siempre la misma clave (tipoEnvase null), así que arma un único
// grupo; se mantiene la función por si algún día pañales tuviera más de una
// clave posible. Medicamentos NO usa esto — ver facturarMedicamentosDelGrupo.
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

export interface ConfigUnificacionInterna {
  porcentajePanal: number;
  // Monto fijo por zona (y opcionalmente envase) del lado medicamento —
  // decisión 2026-09-12, misma clave que `tarifas` (construirClaveTarifa).
  montosUnificadoMedicamento: TarifasPorTipo;
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
  config: ConfigUnificacionInterna,
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
      const importePanal = tarifaPanal * (config.porcentajePanal / 100);
      const montoFijoMedicamento = config.montosUnificadoMedicamento[claveTarifaDePedido(medicamento)];
      if (montoFijoMedicamento === undefined) {
        throw new Error(
          `Falta un monto fijo de unificado para zona=${medicamento.zonaTarifariaId} tipoEnvase=${medicamento.tipoEnvase ?? "-"}.`,
        );
      }
      viajes.push({
        clienteId: grupo.clienteId,
        fecha: grupo.fecha,
        direccion: grupo.direccion,
        zonaTarifariaId: grupo.zonaTarifariaId,
        pedidoIds: [panal.id, medicamento.id],
        reglaAplicada: "UNIFICADA",
        cantidadViajes: 1,
        tarifaUtilizada: tarifaPanal + montoFijoMedicamento,
        porcentajeAplicado: null,
        importeCalculado: importePanal + montoFijoMedicamento,
        detalleUnificacion: {
          tarifaPanal,
          porcentajePanal: config.porcentajePanal,
          importePanal,
          montoFijoMedicamento,
          importeMedicamento: montoFijoMedicamento,
        },
      });
    }

    // 2x1 de pañales sobre lo que quedó sin unificar — sub-agrupado por clave
    // de tarifa (siempre una sola, tipoEnvase null). Una sola fila por clave,
    // con la cantidad de viajes que pesa ese grupo (ver calcularViajesPorPeso)
    // — no una fila por cada par de Pedidos.
    for (const [, pedidosDeEstaClave] of agruparPorClaveTarifa(panalesRestantes)) {
      const tarifa = tarifaDe(pedidosDeEstaClave[0]);
      const { pedidoIds, reglaAplicada, cantidadViajes } = calcularViajesPorPeso(pedidosDeEstaClave);
      viajes.push({
        clienteId: grupo.clienteId,
        fecha: grupo.fecha,
        direccion: grupo.direccion,
        zonaTarifariaId: grupo.zonaTarifariaId,
        pedidoIds,
        reglaAplicada,
        cantidadViajes,
        tarifaUtilizada: tarifa,
        porcentajeAplicado: null,
        importeCalculado: tarifa * cantidadViajes,
      });
    }

    // 2x1 de medicamentos sobre lo que quedó sin unificar — decisión
    // 2026-09-16 (Leonardo): a diferencia de pañales, acá NO se sub-agrupa
    // por clave de tarifa (eso separaría Bolsa de Bulto en filas distintas
    // aunque compartan cliente+fecha+dirección, o sea aunque sean el mismo
    // 2x1 real). Todos los pedidos de medicamentos restantes de este grupo
    // — sin importar de qué afiliado sean ni si mezclan Bolsa/Bulto —
    // comparten un único 2x1, facturado con la misma regla "mezcla→Bulto"
    // que ya existe para las líneas de un solo pedido
    // (determinarClasificacionMedicamento), ahora aplicada a nivel del grupo
    // entero: "si llevan n bolsas y n bultos, se cobra Bulto; si es todo
    // bolsas, Bolsa; si es todo bultos, Bulto" — y la cantidad de viajes
    // sigue la fórmula de siempre (cada 2 pedidos originales = 1 viaje). Esto
    // NO afecta a `unificaciones` de arriba: qué medicamento se empareja con
    // un pañal sigue usando el tipoEnvase propio de ESE pedido puntual.
    if (medicamentosRestantes.length > 0) {
      const clasificacionGrupo = determinarClasificacionMedicamento(
        medicamentosRestantes.map((pedido) => pedido.tipoEnvase),
      );
      const prioridadGrupo = prioridadMasAlta(medicamentosRestantes);
      const clave = construirClaveTarifa({
        zonaTarifariaId: grupo.zonaTarifariaId,
        tipoServicio: TipoServicio.MEDICAMENTO,
        tipoEnvase: clasificacionGrupo,
        prioridad: prioridadGrupo,
      });
      const tarifa = tarifas[clave];
      if (tarifa === undefined) {
        throw new Error(
          `Falta tarifa vigente para zona=${grupo.zonaTarifariaId} tipoServicio=${TipoServicio.MEDICAMENTO} tipoEnvase=${clasificacionGrupo ?? "-"} prioridad=${prioridadGrupo}.`,
        );
      }
      const { pedidoIds, reglaAplicada, cantidadViajes } = calcularViajesPorPeso(medicamentosRestantes);
      viajes.push({
        clienteId: grupo.clienteId,
        fecha: grupo.fecha,
        direccion: grupo.direccion,
        zonaTarifariaId: grupo.zonaTarifariaId,
        pedidoIds,
        reglaAplicada,
        cantidadViajes,
        tarifaUtilizada: tarifa,
        porcentajeAplicado: null,
        importeCalculado: tarifa * cantidadViajes,
      });
    }
  }

  return viajes;
}
