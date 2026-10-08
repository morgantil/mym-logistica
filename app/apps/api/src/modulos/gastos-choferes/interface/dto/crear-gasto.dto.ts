import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { TipoGastoChofer } from "@mym/shared-types";
import { DatosFiscalesCombustibleDto } from "./datos-fiscales-combustible.dto";

// ABM manual (item 14.1 TEMAS_PENDIENTES.md) — a diferencia del import, acá
// choferId es obligatorio: el chofer siempre se elige de un desplegable.
export class CrearGastoDto extends DatosFiscalesCombustibleDto {
  @IsEnum(TipoGastoChofer)
  tipo!: TipoGastoChofer;

  @IsDateString()
  fecha!: string;

  @IsNumber()
  @IsPositive()
  monto!: number;

  @IsString()
  @IsNotEmpty()
  choferId!: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsString()
  comprobante?: string;
}
