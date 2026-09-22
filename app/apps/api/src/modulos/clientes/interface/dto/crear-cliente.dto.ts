import { TipoServicioCliente } from "@mym/shared-types";
import { IsEnum, IsString } from "class-validator";

export class CrearClienteDto {
  @IsString()
  nombre!: string;

  @IsEnum(TipoServicioCliente)
  tipoServicio!: TipoServicioCliente;
}
