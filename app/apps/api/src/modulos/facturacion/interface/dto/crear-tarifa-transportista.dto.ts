import { IsNumber, Min } from "class-validator";

export class CrearTarifaTransportistaDto {
  @IsNumber()
  @Min(0)
  monto!: number;
}
