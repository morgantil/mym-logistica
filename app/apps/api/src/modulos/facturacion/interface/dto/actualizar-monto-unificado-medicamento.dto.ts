import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class ActualizarMontoUnificadoMedicamentoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
