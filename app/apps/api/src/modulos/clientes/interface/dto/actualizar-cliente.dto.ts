import { TipoServicioCliente } from "@mym/shared-types";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsEnum(TipoServicioCliente)
  tipoServicio?: TipoServicioCliente;
}
