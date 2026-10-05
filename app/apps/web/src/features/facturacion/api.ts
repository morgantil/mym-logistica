import { CabaProvincia, TipoEnvase, TipoServicio } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type {
  CombinacionUnificacionClientes,
  GrupoFacturacion,
  MontoUnificadoMedicamento,
  PedidoFacturado,
  PorcentajeSegundoServicio,
  ResultadoVistaPrevia,
  ResumenChofer,
  TarifaCliente,
  TarifaTransportista,
} from "./tipos";

export async function listarTarifas(clienteId: string): Promise<TarifaCliente[]> {
  const { data } = await apiClient.get<TarifaCliente[]>("/facturacion/tarifas", { params: { clienteId } });
  return data;
}

export async function crearTarifa(datos: {
  clienteId: string;
  zonaTarifariaId: string;
  tipoServicio: TipoServicio;
  tipoEnvase?: TipoEnvase;
  monto: number;
}): Promise<TarifaCliente> {
  const { data } = await apiClient.post<TarifaCliente>("/facturacion/tarifas", datos);
  return data;
}

export async function actualizarTarifa(
  id: string,
  datos: Partial<{ monto: number; activa: boolean }>,
): Promise<TarifaCliente> {
  const { data } = await apiClient.patch<TarifaCliente>(`/facturacion/tarifas/${id}`, datos);
  return data;
}

export async function listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]> {
  const { data } = await apiClient.get<PorcentajeSegundoServicio[]>("/facturacion/porcentaje-segundo-servicio", {
    params: { clienteId },
  });
  return data;
}

export async function crearPorcentaje(datos: {
  clienteId: string;
  porcentajePanal: number;
}): Promise<PorcentajeSegundoServicio> {
  const { data } = await apiClient.post<PorcentajeSegundoServicio>(
    "/facturacion/porcentaje-segundo-servicio",
    datos,
  );
  return data;
}

export async function actualizarPorcentaje(
  id: string,
  datos: Partial<{ porcentajePanal: number; activa: boolean }>,
): Promise<PorcentajeSegundoServicio> {
  const { data } = await apiClient.patch<PorcentajeSegundoServicio>(
    `/facturacion/porcentaje-segundo-servicio/${id}`,
    datos,
  );
  return data;
}

export async function listarMontosUnificadoMedicamento(clienteId: string): Promise<MontoUnificadoMedicamento[]> {
  const { data } = await apiClient.get<MontoUnificadoMedicamento[]>("/facturacion/monto-unificado-medicamento", {
    params: { clienteId },
  });
  return data;
}

export async function crearMontoUnificadoMedicamento(datos: {
  clienteId: string;
  zonaTarifariaId: string;
  tipoEnvase?: TipoEnvase;
  monto: number;
}): Promise<MontoUnificadoMedicamento> {
  const { data } = await apiClient.post<MontoUnificadoMedicamento>(
    "/facturacion/monto-unificado-medicamento",
    datos,
  );
  return data;
}

export async function actualizarMontoUnificadoMedicamento(
  id: string,
  datos: Partial<{ monto: number; activa: boolean }>,
): Promise<MontoUnificadoMedicamento> {
  const { data } = await apiClient.patch<MontoUnificadoMedicamento>(
    `/facturacion/monto-unificado-medicamento/${id}`,
    datos,
  );
  return data;
}

// Decisión 2026-10-04: "% de ajuste" — actualiza de una el monto base de
// todas las tarifas por zona y todos los montos de medicamento en unificado
// activos del cliente.
export async function aplicarAjustePorcentual(
  clienteId: string,
  porcentaje: number,
): Promise<{ tarifasActualizadas: number; montosActualizados: number }> {
  const { data } = await apiClient.post<{ tarifasActualizadas: number; montosActualizados: number }>(
    "/facturacion/ajuste-porcentual",
    { clienteId, porcentaje },
  );
  return data;
}

export async function listarCombinaciones(): Promise<CombinacionUnificacionClientes[]> {
  const { data } = await apiClient.get<CombinacionUnificacionClientes[]>("/facturacion/combinaciones");
  return data;
}

export async function crearCombinacion(datos: {
  clienteMedicamentoId: string;
  clientePanalId: string;
  nombre?: string;
}): Promise<CombinacionUnificacionClientes> {
  const { data } = await apiClient.post<CombinacionUnificacionClientes>("/facturacion/combinaciones", datos);
  return data;
}

export async function eliminarCombinacion(id: string): Promise<void> {
  await apiClient.delete(`/facturacion/combinaciones/${id}`);
}

export async function listarTarifasTransportista(): Promise<TarifaTransportista[]> {
  const { data } = await apiClient.get<TarifaTransportista[]>("/facturacion/tarifa-transportista");
  return data;
}

export async function crearTarifaTransportista(datos: {
  zona: CabaProvincia;
  monto: number;
}): Promise<TarifaTransportista> {
  const { data } = await apiClient.post<TarifaTransportista>("/facturacion/tarifa-transportista", datos);
  return data;
}

export async function actualizarTarifaTransportista(
  id: string,
  datos: Partial<{ monto: number; activa: boolean }>,
): Promise<TarifaTransportista> {
  const { data } = await apiClient.patch<TarifaTransportista>(`/facturacion/tarifa-transportista/${id}`, datos);
  return data;
}

// `rango` opcional (decisión 2026-10-04, datepicker libre en la pantalla):
// acota a un sub-período dentro del mes elegido. Nunca lo usan
// generarVistaPrevia/confirmar — el cierre sigue siendo el mes completo.
export interface RangoFechas {
  fechaDesde: string;
  fechaHasta: string;
}

export async function liquidacionTransportistas(
  mes: number,
  anio: number,
  rango?: RangoFechas,
): Promise<ResumenChofer[]> {
  const { data } = await apiClient.get<ResumenChofer[]>("/facturacion/liquidacion-transportistas", {
    params: { mes, anio, ...rango },
  });
  return data;
}

export async function listarGrupos(clienteId: string, mes: number, anio: number): Promise<GrupoFacturacion[]> {
  const { data } = await apiClient.get<GrupoFacturacion[]>("/facturacion/grupos", {
    params: { clienteId, mes, anio },
  });
  return data;
}

export async function listarPedidosFacturados(
  clienteId: string,
  mes: number,
  anio: number,
  rango?: RangoFechas,
): Promise<PedidoFacturado[]> {
  const { data } = await apiClient.get<PedidoFacturado[]>("/facturacion/pedidos-facturados", {
    params: { clienteId, mes, anio, ...rango },
  });
  return data;
}

export async function generarVistaPrevia(
  clienteId: string,
  mes: number,
  anio: number,
): Promise<ResultadoVistaPrevia> {
  const { data } = await apiClient.post<ResultadoVistaPrevia>("/facturacion/vista-previa", {
    clienteId,
    mes,
    anio,
  });
  return data;
}

export async function confirmar(clienteId: string, mes: number, anio: number): Promise<GrupoFacturacion[]> {
  const { data } = await apiClient.post<GrupoFacturacion[]>("/facturacion/confirmar", { clienteId, mes, anio });
  return data;
}

export async function descargarReporteMensual(
  clienteId: string,
  mes: number,
  anio: number,
  rango?: RangoFechas,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/facturacion/reporte-mensual", {
    params: { clienteId, mes, anio, ...rango },
    responseType: "blob",
  });
  return data;
}
