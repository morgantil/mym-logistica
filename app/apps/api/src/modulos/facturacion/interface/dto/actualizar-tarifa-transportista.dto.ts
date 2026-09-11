import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class ActualizarTarifaTransportistaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
