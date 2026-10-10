import { IsInt, Max, Min } from "class-validator";
import { MAX_DIAS_PERMITIDO, MIN_DIAS_PERMITIDO } from "../../domain/limite-reporte";

export class ActualizarLimiteReporteDto {
  @IsInt()
  @Min(MIN_DIAS_PERMITIDO)
  @Max(MAX_DIAS_PERMITIDO)
  maxDias!: number;
}
