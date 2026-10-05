import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from "class-validator";
import { PrioridadPedido, TipoEnvase } from "@mym/shared-types";

// Monto fijo del lado medicamento en una entrega unificada — decisión
// 2026-09-12, ver tarifa.ts. `tipoEnvase` es opcional a propósito: si se
// omite, el monto aplica igual a Bolsa y Bulto (una sola fila cubre los
// dos); se puede cargar por separado más adelante si hace falta diferenciar.
export class CrearMontoUnificadoMedicamentoDto {
  @IsUUID()
  clienteId!: string;

  @IsUUID()
  zonaTarifariaId!: string;

  @IsOptional()
  @IsEnum(TipoEnvase)
  tipoEnvase?: TipoEnvase;

  // Decisión 2026-10-04: omitido = NORMAL, mismo criterio que CrearTarifaDto.
  @IsOptional()
  @IsEnum(PrioridadPedido)
  prioridad?: PrioridadPedido;

  @IsNumber()
  @Min(0)
  monto!: number;
}
