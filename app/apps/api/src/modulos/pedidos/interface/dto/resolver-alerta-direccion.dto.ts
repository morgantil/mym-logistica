import { IsEnum, IsInt, Min } from "class-validator";
import { ResolucionDireccion } from "@mym/shared-types";

export class ResolverAlertaDireccionDto {
  @IsEnum(ResolucionDireccion)
  resolucion!: ResolucionDireccion;

  // Bloqueo optimista — mismo criterio que ActualizarBultosDto.
  @IsInt()
  @Min(0)
  version!: number;
}
