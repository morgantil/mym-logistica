import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class ActualizarTarifaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
