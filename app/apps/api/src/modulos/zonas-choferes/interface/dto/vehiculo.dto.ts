import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

// Campos de Vehicle de SimpliRoute que esta app administra (Documentacion
// simpliroute/04 §4-41) — hay muchos más campos en la API real (capacidad,
// horarios, etc.) que no hacen falta para el caso de uso de MyM y no se
// exponen acá.
export class CrearVehiculoDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  patente?: string;

  @IsOptional()
  @IsInt()
  choferPredeterminadoId?: number;
}

export class ActualizarVehiculoDto extends CrearVehiculoDto {}
