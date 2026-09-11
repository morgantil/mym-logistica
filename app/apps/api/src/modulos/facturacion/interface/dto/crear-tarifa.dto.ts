import { IsEnum, IsNumber, IsUUID, Min, ValidateIf } from "class-validator";
import { TipoEnvase, TipoServicio } from "@mym/shared-types";

export class CrearTarifaDto {
  @IsUUID()
  clienteId!: string;

  @IsUUID()
  zonaTarifariaId!: string;

  @IsEnum(TipoServicio)
  tipoServicio!: TipoServicio;

  // Guia Arbet paso 5: obligatorio cuando tipoServicio es MEDICAMENTO (cada
  // tarifa de medicamentos es por Bolsa o por Bulto), ausente para PANAL.
  @ValidateIf((dto: CrearTarifaDto) => dto.tipoServicio === TipoServicio.MEDICAMENTO)
  @IsEnum(TipoEnvase)
  tipoEnvase?: TipoEnvase;

  @IsNumber()
  @Min(0)
  monto!: number;
}
