import { CabaProvincia } from "@mym/shared-types";
import { IsEnum, IsNumber, Min } from "class-validator";

export class CrearTarifaTransportistaDto {
  @IsEnum(CabaProvincia)
  zona!: CabaProvincia;

  @IsNumber()
  @Min(0)
  monto!: number;
}
