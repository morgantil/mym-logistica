import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

// Query params compartidos por vista previa / confirmar / listar grupos:
// siempre se factura un cliente puntual en un mes/año puntual (§21 funcional).
// `fechaDesde`/`fechaHasta` (decisión 2026-10-04, reunión con el cliente) son
// opcionales y SOLO los usan los endpoints de solo-lectura (pedidos
// facturados, reporte Excel) para acotar la vista a un rango dentro del mes
// ya calculado — vista-previa/confirmar los ignoran, el cierre sigue siendo
// mensual completo (ver comentario en FacturacionService.generarVistaPrevia).
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

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
