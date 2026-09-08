import { TipoServicioCliente } from "@mym/shared-types";
import { ArrayNotEmpty, IsArray, IsEnum, IsString } from "class-validator";

export class CrearClienteDto {
  @IsString()
  nombre!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  patronesDeteccion!: string[];

  @IsEnum(TipoServicioCliente)
  tipoServicio!: TipoServicioCliente;
}
