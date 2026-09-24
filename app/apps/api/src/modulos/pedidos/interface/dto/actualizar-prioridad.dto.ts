import { ArrayNotEmpty, IsArray, IsEnum, IsUUID } from "class-validator";
import { PrioridadPedido } from "@mym/shared-types";

export class ActualizarPrioridadDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  pedidoIds!: string[];

  @IsEnum(PrioridadPedido)
  prioridad!: PrioridadPedido;
}
