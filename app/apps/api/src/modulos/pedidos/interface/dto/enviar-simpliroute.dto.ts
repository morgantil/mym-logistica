import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class EnviarSimpliRouteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  pedidoIds!: string[];
}
