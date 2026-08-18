import { Type } from "class-transformer";
import { IsDate, IsNumber, IsUUID, Min } from "class-validator";

export class CrearTarifaDto {
  @IsUUID()
  clienteId!: string;

  @IsUUID()
  zonaTarifariaId!: string;

  @IsNumber()
  @Min(0)
  monto!: number;

  @Type(() => Date)
  @IsDate()
  vigenciaDesde!: Date;
}
