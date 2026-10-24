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

  // Reunión 2026-10-23 — ver comentario en schema.prisma. Null explícito =
  // borrar el valor cargado.
  @IsOptional()
  @IsString()
  tipoVisitaSimpliRoute?: string | null;

  @IsOptional()
  @IsString()
  notaSimpliRoute?: string | null;

  @IsOptional()
  @IsString()
  sellerSimpliRoute?: string | null;

  @IsOptional()
  @IsBoolean()
  remitoHabilitado?: boolean;
}
