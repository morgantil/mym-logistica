import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class ActualizarComentarioDto {
  @IsOptional()
  @IsString()
  comentario?: string;

  // Bloqueo optimista — mismo criterio que ActualizarBultosDto.
  @IsInt()
  @Min(0)
  version!: number;
}
