import { GrupoFacturacion, PedidoFacturado } from "./grupo-facturacion";
import { PorcentajeSegundoServicio, TarifaCliente, TarifaTransportista } from "./tarifa";

export interface DatosCrearTarifa {
  clienteId: string;
  zonaTarifariaId: string;
  monto: number;
  vigenciaDesde: Date;
}

export interface DatosCrearPorcentaje {
  clienteId: string;
  porcentaje: number;
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
  importeCalculado: number;
  pedidoIds: string[];
}

export interface FacturacionRepositorio {
  // Tarifas — §23 funcional. `tarifaVigente` es la que corresponde según
  // vigenciaDesde/vigenciaHasta para una fecha puntual (normalmente "hoy",
  // al generar la vista previa).
  listarTarifas(clienteId: string): Promise<TarifaCliente[]>;
  tarifaVigente(clienteId: string, zonaTarifariaId: string, fecha: Date): Promise<TarifaCliente | null>;
  // Cierra automáticamente la tarifa anterior del mismo tipo (vigenciaHasta =
  // el día antes de la nueva vigenciaDesde) para no dejar dos tarifas del
  // mismo tipo vigentes al mismo tiempo.
  crearTarifa(datos: DatosCrearTarifa): Promise<TarifaCliente>;

  // Porcentaje del segundo servicio en entregas unificadas — §25 funcional.
  listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]>;
  porcentajeVigente(clienteId: string, fecha: Date): Promise<PorcentajeSegundoServicio | null>;
  crearPorcentaje(datos: DatosCrearPorcentaje): Promise<PorcentajeSegundoServicio>;

  // Liquidación a transportistas — monto por viaje, configurable con
  // vigencia (decisión 2026-08-26). Sin clienteId: un único valor.
  listarTarifasTransportista(): Promise<TarifaTransportista[]>;
  tarifaTransportistaVigente(fecha: Date): Promise<TarifaTransportista | null>;
  crearTarifaTransportista(datos: DatosCrearTarifaTransportista): Promise<TarifaTransportista>;

  // Grupos de facturación (vista previa / confirmación) — §21, §32 funcional.
  existeGrupoConfirmado(clienteId: string, mes: number, anio: number): Promise<boolean>;
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
