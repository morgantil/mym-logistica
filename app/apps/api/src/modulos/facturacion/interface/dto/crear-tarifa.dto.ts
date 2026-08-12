import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNumber, IsUUID, Min } from "class-validator";
import { CabaProvincia } from "@mym/shared-types";

export class CrearTarifaDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(CabaProvincia)
  tipo!: CabaProvincia;

  @IsNumber()
  @Min(0)
  monto!: number;

  @Type(() => Date)
  @IsDate()
  vigenciaDesde!: Date;
}
