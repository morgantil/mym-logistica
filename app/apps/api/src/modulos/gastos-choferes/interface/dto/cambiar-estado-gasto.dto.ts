import { IsEnum } from "class-validator";
import { EstadoGastoChofer } from "@mym/shared-types";

export class CambiarEstadoGastoDto {
  @IsEnum(EstadoGastoChofer)
  estado!: EstadoGastoChofer;
}
