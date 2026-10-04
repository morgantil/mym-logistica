import { IsNumber, IsUUID, Max, Min } from "class-validator";

// Decisión 2026-10-04: "% de ajuste" sobre las tarifas por zona y el monto de
// medicamento en unificado de un cliente — puede ser negativo (una rebaja).
// Límites generosos (±90%) solo para frenar un tipeo claramente absurdo
// (ej. escribir 9000 en vez de 9), no una regla de negocio real.
export class AjustePorcentualDto {
  @IsUUID()
  clienteId!: string;

  @IsNumber()
  @Min(-90)
  @Max(900)
  porcentaje!: number;
}
