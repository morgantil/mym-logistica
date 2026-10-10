import type { TipoReporte } from "@mym/shared-types";

// Tope de días (Desde/Hasta) de cada reporte Excel, editable por
// Administración — ver REPORTE_SEGURIDAD_Y_ROBUSTEZ.md.
export interface LimiteReporte {
  reporte: TipoReporte;
  maxDias: number;
  actualizadoEn: string;
}
