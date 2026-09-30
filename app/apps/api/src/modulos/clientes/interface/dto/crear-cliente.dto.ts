import { TipoServicioCliente } from "@mym/shared-types";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class CrearClienteDto {
  @IsString()
  nombre!: string;

  @IsEnum(TipoServicioCliente)
  tipoServicio!: TipoServicioCliente;

  // Default false (tarifa plana CABA/Provincia) — ver Cliente.facturaPorCordon.
  @IsOptional()
  @IsBoolean()
  facturaPorCordon?: boolean;
}
