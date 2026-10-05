import { FormatoRemito, TipoServicioCliente } from "@mym/shared-types";
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

  @IsOptional()
  @IsBoolean()
  facturaPorCordon?: boolean;

  // Null explícito = sacarle el remito preimpreso configurado.
  @IsOptional()
  @IsEnum(FormatoRemito)
  formatoRemito?: FormatoRemito | null;

  @IsOptional()
  @IsBoolean()
  usaCarga3?: boolean;
}
