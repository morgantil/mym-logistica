import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class ActualizarRutaDto {
  @IsOptional()
  @IsString()
  ruta?: string;

  // Bloqueo optimista — mismo criterio que ActualizarBultosDto.
  @IsInt()
  @Min(0)
  version!: number;
}
