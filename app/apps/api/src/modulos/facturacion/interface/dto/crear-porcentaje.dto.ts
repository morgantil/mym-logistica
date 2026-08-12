import { Type } from "class-transformer";
import { IsDate, IsNumber, IsUUID, Max, Min } from "class-validator";

export class CrearPorcentajeDto {
  @IsUUID()
  clienteId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje!: number;

  @Type(() => Date)
  @IsDate()
  vigenciaDesde!: Date;
}
