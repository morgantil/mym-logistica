import { IsNumber, IsUUID, Max, Min } from "class-validator";

// Decisión 2026-09-08: % configurable del lado pañal en una entrega
// unificada (no un pañal fijo al 100% — ver DOCUMENTO TECNICO.md historial
// de esa fecha). Decisión 2026-09-12: el lado medicamento dejó de ser un %
// acá — ver CrearMontoUnificadoMedicamentoDto.
export class CrearPorcentajeDto {
  @IsUUID()
  clienteId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajePanal!: number;
}
