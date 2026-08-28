import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

// Igual que PeriodoDto pero sin clienteId — la liquidación a transportistas
// no se factura por cliente (un chofer reparte para todos), ver §4.2
// TEMAS_PENDIENTES.md.
export class MesAnioDto {
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
