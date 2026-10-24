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

  // Reunión 2026-10-23 — ver comentario en schema.prisma.
  @IsOptional()
  @IsString()
  tipoVisitaSimpliRoute?: string;

  @IsOptional()
  @IsString()
  notaSimpliRoute?: string;

  @IsOptional()
  @IsString()
  sellerSimpliRoute?: string;

  @IsOptional()
  @IsBoolean()
  remitoHabilitado?: boolean;
}
