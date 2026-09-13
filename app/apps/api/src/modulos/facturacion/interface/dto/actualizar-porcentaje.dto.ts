import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

export class ActualizarPorcentajeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajePanal?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
