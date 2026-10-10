import { TipoReporte } from "@mym/shared-types";

// Ver comentario en schema.prisma (modelo LimiteReporte) — editable por
// Administración, un valor independiente por tipo de reporte.
export interface LimiteReporte {
  reporte: TipoReporte;
  maxDias: number;
  actualizadoEn: Date;
}

export const MAX_DIAS_PERMITIDO = 100;
export const MIN_DIAS_PERMITIDO = 1;
