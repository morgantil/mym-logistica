import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class EliminarPedidosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  pedidoIds!: string[];
}
