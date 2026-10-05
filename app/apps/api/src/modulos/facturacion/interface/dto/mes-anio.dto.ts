import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

// Igual que PeriodoDto pero sin clienteId — la liquidación a transportistas
// no se factura por cliente (un chofer reparte para todos), ver §4.2
// TEMAS_PENDIENTES.md. `fechaDesde`/`fechaHasta` opcionales (decisión
// 2026-10-04): acotan la liquidación a un rango dentro del mes en vez del
// mes completo — acá no hay invariante de "cierre" que proteger (la
// liquidación a transportistas nunca se persiste/confirma, se recalcula en
// vivo cada vez), así que el rango puede reemplazar el mes entero sin riesgo.
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

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
