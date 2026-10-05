import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsOptional } from "class-validator";
import { TipoGastoChofer } from "@mym/shared-types";

export class FiltroGastosDto {
  @IsOptional()
  @IsEnum(TipoGastoChofer)
  tipo?: TipoGastoChofer;

  @IsOptional()
  choferId?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  soloSinAsignar?: boolean;
}
