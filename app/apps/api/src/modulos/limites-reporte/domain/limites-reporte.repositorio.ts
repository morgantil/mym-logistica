import { TipoReporte } from "@mym/shared-types";
import { LimiteReporte } from "./limite-reporte";

export interface LimitesReporteRepositorio {
  listar(): Promise<LimiteReporte[]>;
  obtener(reporte: TipoReporte): Promise<LimiteReporte | null>;
  actualizar(reporte: TipoReporte, maxDias: number, actualizadoPorId: string): Promise<LimiteReporte>;
}

export const LIMITES_REPORTE_REPOSITORIO = Symbol("LIMITES_REPORTE_REPOSITORIO");
