import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { TipoGastoChofer } from "@mym/shared-types";

export class ActualizarGastoDto {
  @IsOptional()
  @IsEnum(TipoGastoChofer)
  tipo?: TipoGastoChofer;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  monto?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  choferId?: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsString()
  comprobante?: string;
}
