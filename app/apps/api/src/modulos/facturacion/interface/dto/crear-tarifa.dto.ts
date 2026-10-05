import { IsEnum, IsNumber, IsOptional, IsUUID, Min, ValidateIf } from "class-validator";
import { PrioridadPedido, TipoEnvase, TipoServicio } from "@mym/shared-types";

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

  // Decisión 2026-10-04: la Prioridad también puede cambiar la tarifa —
  // omitido = NORMAL (mismo criterio que las tarifas ya cargadas).
  @IsOptional()
  @IsEnum(PrioridadPedido)
  prioridad?: PrioridadPedido;

  @IsNumber()
  @Min(0)
  monto!: number;
}
