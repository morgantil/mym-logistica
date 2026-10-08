import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { TipoGastoChofer } from "@mym/shared-types";
import { DatosFiscalesCombustibleDto } from "./datos-fiscales-combustible.dto";

export class ActualizarGastoDto extends DatosFiscalesCombustibleDto {
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
