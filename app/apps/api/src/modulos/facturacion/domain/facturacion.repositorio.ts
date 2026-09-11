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
  vigenciaDesde: Date;
}

export interface DatosCrearPorcentaje {
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
  vigenciaDesde: Date;
}

export interface DatosCrearTarifaTransportista {
  monto: number;
  vigenciaDesde: Date;
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

export interface FacturacionRepositorio {
  // Tarifas — §23 funcional. `tarifaVigente` es la que corresponde según
  // vigenciaDesde/vigenciaHasta para una fecha puntual (normalmente "hoy",
  // al generar la vista previa).
  listarTarifas(clienteId: string): Promise<TarifaCliente[]>;
  // La vigencia y el cierre automático (ver crearTarifa) son por la
  // combinación completa zona+tipoServicio+tipoEnvase — dos tarifas de
  // MEDICAMENTO en la misma zona pero distinto Bolsa/Bulto son independientes.
  tarifaVigente(
    clienteId: string,
    zonaTarifariaId: string,
    tipoServicio: TipoServicio,
    tipoEnvase: TipoEnvase | null,
    fecha: Date,
  ): Promise<TarifaCliente | null>;
  // Cierra automáticamente la tarifa anterior de la misma combinación
  // (vigenciaHasta = el día antes de la nueva vigenciaDesde) para no dejar
  // dos vigentes al mismo tiempo.
  crearTarifa(datos: DatosCrearTarifa): Promise<TarifaCliente>;

  // Porcentaje aplicado en entregas unificadas — §25 funcional. Un solo
  // registro por cliente/vigencia con los dos valores (panal y medicamento).
  listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]>;
  porcentajeVigente(clienteId: string, fecha: Date): Promise<PorcentajeSegundoServicio | null>;
  crearPorcentaje(datos: DatosCrearPorcentaje): Promise<PorcentajeSegundoServicio>;

  // Combinaciones habilitadas de unificación ENTRE clientes — Guia Arbet
  // paso 4/8 ("Combinaciones habilitadas de Pañales + Medicamentos").
  listarCombinaciones(): Promise<CombinacionUnificacionClientes[]>;
  // Combinaciones activas donde el cliente participa, en cualquiera de los
  // dos roles (medicamento o pañal) — usado por FacturacionService para
  // saber con qué otros clientes buscar unificación cruzada.
  listarCombinacionesDeCliente(clienteId: string): Promise<CombinacionUnificacionClientes[]>;
  crearCombinacion(datos: DatosCrearCombinacion): Promise<CombinacionUnificacionClientes>;
  eliminarCombinacion(id: string): Promise<void>;

  // Liquidación a transportistas — monto por viaje, configurable con
  // vigencia (decisión 2026-08-26). Sin clienteId: un único valor.
  listarTarifasTransportista(): Promise<TarifaTransportista[]>;
  tarifaTransportistaVigente(fecha: Date): Promise<TarifaTransportista | null>;
  crearTarifaTransportista(datos: DatosCrearTarifaTransportista): Promise<TarifaTransportista>;

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
