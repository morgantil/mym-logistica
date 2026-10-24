import { IsInt, Min } from "class-validator";

// Reasignación manual de chofer (reunión 2026-10-21) — ver
// PedidosService.reasignarChofer.
export class ReasignarChoferDto {
  @IsInt()
  choferIdExterno!: number;

  // Bloqueo optimista — mismo criterio que ActualizarRutaDto.
  @IsInt()
  @Min(0)
  version!: number;
}
