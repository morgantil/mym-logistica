import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { EstadoPedido } from "@mym/shared-types";

// Filtro por cliente puntual queda para cuando haga falta: el filtrado por
// "qué clientes puede ver este usuario" ya lo aplica PedidosService.listarParaUsuario
// vía PermisosClienteService, independientemente de este DTO.
export class ListarPedidosDto {
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200) // sin techo, un cliente del API podía pedir todo de una y anular la paginación
  porPagina: number = 50;
}
