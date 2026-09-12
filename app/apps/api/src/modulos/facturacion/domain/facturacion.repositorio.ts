import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { GrupoFacturacion, PedidoFacturado } from "./grupo-facturacion";
import { PedidoParaLiquidarTransportista } from "./motor-liquidacion-transportistas";
import {
  CombinacionUnificacionClientes,
  PorcentajeSegundoServicio,
  TarifaCliente,
  TarifaTransportista,
} from "./tarifa";

export interface DatosCrearTarifa {
  clienteId: string;
  zonaTarifariaId: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  monto: number;
}

export interface DatosActualizarTarifa {
  monto?: number;
  activa?: boolean;
}

export interface DatosCrearPorcentaje {
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
}

export interface DatosActualizarPorcentaje {
  porcentajePanal?: number;
  porcentajeMedicamento?: number;
  activa?: boolean;
}

export interface DatosCrearTarifaTransportista {
  monto: number;
}

export interface DatosActualizarTarifaTransportista {
  monto?: number;
  activa?: boolean;
}

export interface DatosCrearGrupoFacturacion {
  clienteId: string;
  mes: number;
  anio: number;
  reglaAplicada: string;
  tarifaUtilizada: number;
  porcentajeAplicado: number | null;
  porcentajePanalAplicado?: number | null;
  porcentajeMedicamentoAplicado?: number | null;
  pedidoSocioId?: string | null;
  clienteSocioId?: string | null;
  cantidadViajes: number;
  importeCalculado: number;
  pedidoIds: string[];
}

export interface DatosCrearCombinacion {
  clienteMedicamentoId: string;
  clientePanalId: string;
}

export interface DatosCrearParUnificacion {
  combinacionId: string;
  pedidoPanalId: string;
  pedidoMedicamentoId: string;
}

export interface FacturacionRepositorio {
  // Tarifas — §23 funcional. Decisión 2026-09-11: sin historial por vigencia,
  // una fila por cliente+zona+tipo+envase, editable y con toggle activa/inactiva
  // (ver comentario en tarifa.ts). `tarifaActiva` es la que corresponde a esa
  // combinación con activa=true — no depende de ninguna fecha.
  listarTarifas(clienteId: string): Promise<TarifaCliente[]>;
  tarifaActiva(
    clienteId: string,
    zonaTarifariaId: string,
    tipoServicio: TipoServicio,
    tipoEnvase: TipoEnvase | null,
  ): Promise<TarifaCliente | null>;
  // Rechaza si ya existe una fila para esa combinación exacta (clienteId +
  // zonaTarifariaId + tipoServicio + tipoEnvase) — para esa hay que usar
  // actualizarTarifa, no crear una nueva.
  crearTarifa(datos: DatosCrearTarifa): Promise<TarifaCliente>;
  actualizarTarifa(id: string, datos: DatosActualizarTarifa): Promise<TarifaCliente>;

  // Porcentaje aplicado en entregas unificadas — §25 funcional. Un solo
  // registro por cliente, con los dos valores (panal y medicamento). Sin
  // vigencia desde 2026-09-11, mismo criterio que las tarifas.
  listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]>;
  porcentajeActivo(clienteId: string): Promise<PorcentajeSegundoServicio | null>;
  crearPorcentaje(datos: DatosCrearPorcentaje): Promise<PorcentajeSegundoServicio>;
  actualizarPorcentaje(id: string, datos: DatosActualizarPorcentaje): Promise<PorcentajeSegundoServicio>;

  // Combinaciones habilitadas de unificación ENTRE clientes — Guia Arbet
  // paso 4/8 ("Combinaciones habilitadas de Pañales + Medicamentos").
  listarCombinaciones(): Promise<CombinacionUnificacionClientes[]>;
  // Combinaciones activas donde el cliente participa, en cualquiera de los
  // dos roles (medicamento o pañal) — usado por FacturacionService para
  // saber con qué otros clientes buscar unificación cruzada.
  listarCombinacionesDeCliente(clienteId: string): Promise<CombinacionUnificacionClientes[]>;
  crearCombinacion(datos: DatosCrearCombinacion): Promise<CombinacionUnificacionClientes>;
  eliminarCombinacion(id: string): Promise<void>;

  // Guia Arbet paso 4, riesgo #2 (ver UnificacionCruzadaPar en schema.prisma):
  // de los ids pasados, cuáles ya están vinculados a otro pedido en una
  // unificación cruzada confirmada, y con cuál. Sirve tanto para saber si un
  // "propio" ya tiene un par decidido (hay que respetarlo, no volver a
  // adivinar) como para excluir de los candidatos a un socio que ya está
  // comprometido con otro pedido distinto.
  obtenerParesPorPedidos(pedidoIds: string[]): Promise<Map<string, string>>;
  // De los ids pasados, cuáles pertenecen a un GrupoFacturacion ya
  // CONFIRMADO — un candidato en este estado ya no puede ofrecerse para una
  // NUEVA unificación cruzada (su cliente ya lo facturó y cerró el mes con
  // otra regla; ver DOCUMENTO TECNICO.md historial).
  listarPedidosConGrupoConfirmado(pedidoIds: string[]): Promise<Set<string>>;
  // La combinación activa (o no) que conecta a estos dos clientes, sin
  // importar el orden — para saber a qué combinación pertenece un par a
  // grabar en confirmar().
  buscarCombinacionEntreClientes(
    clienteAId: string,
    clienteBId: string,
  ): Promise<CombinacionUnificacionClientes | null>;
  // Graba (o confirma que ya existe, idéntico) el par pañal/medicamento de
  // una unificación cruzada recién confirmada. Si alguno de los dos pedidos
  // ya está vinculado con un pedido DISTINTO, rechaza — eso indicaría una
  // condición de carrera entre dos confirmaciones concurrentes, no un caso
  // normal.
  crearParUnificacion(datos: DatosCrearParUnificacion): Promise<void>;

  // Liquidación a transportistas — monto por viaje. Sin clienteId: un único
  // valor global. Sin vigencia desde 2026-09-11, mismo criterio que las tarifas.
  listarTarifasTransportista(): Promise<TarifaTransportista[]>;
  tarifaTransportistaActiva(): Promise<TarifaTransportista | null>;
  crearTarifaTransportista(datos: DatosCrearTarifaTransportista): Promise<TarifaTransportista>;
  actualizarTarifaTransportista(
    id: string,
    datos: DatosActualizarTarifaTransportista,
  ): Promise<TarifaTransportista>;

  // §4.2 TEMAS_PENDIENTES.md — pedidos ENTREGADO con chofer asignado en el
  // período, para el cálculo de cuántos viajes hizo cada uno. Por
  // fechaEntregaEfectiva (la real, de SimpliRoute), no fechaProgramada — a
  // diferencia de listarFacturables (facturación a clientes), que sigue
  // usando fechaProgramada porque ahí lo que importa es el mes que se le
  // factura al cliente, no cuándo se confirmó la entrega. Sin clienteId: un
  // chofer reparte para todos los clientes en el mismo período.
  listarEntregadosPorChoferEnPeriodo(
    fechaDesde: Date,
    fechaHasta: Date,
  ): Promise<PedidoParaLiquidarTransportista[]>;

  // Grupos de facturación (vista previa / confirmación) — §21, §32 funcional.
  existeGrupoConfirmado(clienteId: string, mes: number, anio: number): Promise<boolean>;
  // Desvincula los pedidos de cualquier BORRADOR existente de ese
  // cliente/mes/año y los borra — decisión 2026-09-11: hay que llamarlo ANTES
  // de volver a listar los pedidos facturables de una "vista previa" nueva,
  // porque listarFacturables excluye los que ya tienen grupoFacturacionId. Si
  // se limpia recién en reemplazarBorrador (al final), un pedido que ya
  // había quedado en un BORRADOR de un cálculo anterior nunca se vuelve a
  // levantar al recalcular — bug real encontrado probando el peso por
  // pedidos originales (ver DOCUMENTO TECNICO.md historial).
  limpiarBorrador(clienteId: string, mes: number, anio: number): Promise<void>;
  // Reemplaza los BORRADOR existentes de ese cliente/mes/año por los nuevos
  // (permite recalcular la simulación las veces que haga falta antes de
  // confirmar — DOCUMENTO TECNICO.md sección 2, "vista previa de facturación").
  reemplazarBorrador(
    clienteId: string,
    mes: number,
    anio: number,
    grupos: DatosCrearGrupoFacturacion[],
  ): Promise<GrupoFacturacion[]>;
  listarGrupos(clienteId: string, mes: number, anio: number): Promise<GrupoFacturacion[]>;
  confirmar(clienteId: string, mes: number, anio: number, usuarioId: string): Promise<GrupoFacturacion[]>;

  // §31 funcional ("Reporte mensual"): detalle por pedido con el resumen del
  // viaje al que pertenece, para exportar a Excel.
  listarPedidosFacturados(clienteId: string, mes: number, anio: number): Promise<PedidoFacturado[]>;
}

export const FACTURACION_REPOSITORIO = Symbol("FACTURACION_REPOSITORIO");
