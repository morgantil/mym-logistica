import { Type } from "class-transformer";
import { IsInt, IsUUID, Max, Min } from "class-validator";

// Query params compartidos por vista previa / confirmar / listar grupos:
// siempre se factura un cliente puntual en un mes/año puntual (§21 funcional).
export class PeriodoDto {
  @IsUUID()
  clienteId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  anio!: number;
}
