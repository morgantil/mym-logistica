import { Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { EstadoPedido } from "@mym/shared-types";

// `clienteId`/`fechaDesde`/`fechaHasta` los usa la pantalla de Embalaje y
// Despacho (§8.1 funcional v6) — el filtrado por "qué clientes puede ver
// este usuario" lo sigue aplicando PedidosService.listarParaUsuario vía
// PermisosClienteService, cruzado con `clienteId` si viene.
export class ListarPedidosDto {
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaDesde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaHasta?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bultosDesde?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bultosHasta?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  busqueda?: string;

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
