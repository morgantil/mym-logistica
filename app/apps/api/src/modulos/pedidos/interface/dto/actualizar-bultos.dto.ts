import { IsInt, Min } from "class-validator";

export class ActualizarBultosDto {
  @IsInt()
  @Min(0)
  bultos!: number;

  // Bloqueo optimista — DOCUMENTO TECNICO.md sección 2. El front manda la
  // versión que tenía cargada; si no coincide con la actual, 409.
  @IsInt()
  @Min(0)
  version!: number;
}
