import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type {
  CombinacionUnificacionClientes,
  GrupoFacturacion,
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
  vigenciaDesde: string;
}): Promise<TarifaCliente> {
  const { data } = await apiClient.post<TarifaCliente>("/facturacion/tarifas", datos);
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
  porcentajeMedicamento: number;
  vigenciaDesde: string;
}): Promise<PorcentajeSegundoServicio> {
  const { data } = await apiClient.post<PorcentajeSegundoServicio>(
    "/facturacion/porcentaje-segundo-servicio",
    datos,
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
  monto: number;
  vigenciaDesde: string;
}): Promise<TarifaTransportista> {
  const { data } = await apiClient.post<TarifaTransportista>("/facturacion/tarifa-transportista", datos);
  return data;
}

export async function liquidacionTransportistas(mes: number, anio: number): Promise<ResumenChofer[]> {
  const { data } = await apiClient.get<ResumenChofer[]>("/facturacion/liquidacion-transportistas", {
    params: { mes, anio },
  });
  return data;
}

export async function listarGrupos(clienteId: string, mes: number, anio: number): Promise<GrupoFacturacion[]> {
  const { data } = await apiClient.get<GrupoFacturacion[]>("/facturacion/grupos", {
    params: { clienteId, mes, anio },
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

export async function descargarReporteMensual(clienteId: string, mes: number, anio: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/facturacion/reporte-mensual", {
    params: { clienteId, mes, anio },
    responseType: "blob",
  });
  return data;
}
