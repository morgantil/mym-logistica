import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

// Compartido entre etiquetas-masivo y remitos-masivo — misma forma que
// EliminarPedidosDto/EnviarSimpliRouteDto, separado porque cada acción del
// controller tiene su propio DTO (criterio ya usado en todo este módulo).
export class ImprimirMasivoDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  pedidoIds!: string[];
}
