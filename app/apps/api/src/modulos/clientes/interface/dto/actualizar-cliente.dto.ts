import { TipoServicioCliente } from "@mym/shared-types";
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  patronesDeteccion?: string[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsEnum(TipoServicioCliente)
  tipoServicio?: TipoServicioCliente;
}
