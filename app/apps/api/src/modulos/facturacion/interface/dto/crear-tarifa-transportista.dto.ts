import { Type } from "class-transformer";
import { IsDate, IsNumber, Min } from "class-validator";

export class CrearTarifaTransportistaDto {
  @IsNumber()
  @Min(0)
  monto!: number;

  @Type(() => Date)
  @IsDate()
  vigenciaDesde!: Date;
}
