import { Type } from "class-transformer";
import { IsDate, IsNumber, IsUUID, Max, Min } from "class-validator";

// Decisión 2026-09-08: un % configurable para CADA lado (pañal y
// medicamento), no un único "% del segundo servicio" sobre un pañal fijo al
// 100% — ver DOCUMENTO TECNICO.md historial de esa fecha.
export class CrearPorcentajeDto {
  @IsUUID()
  clienteId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajePanal!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeMedicamento!: number;

  @Type(() => Date)
  @IsDate()
  vigenciaDesde!: Date;
}
