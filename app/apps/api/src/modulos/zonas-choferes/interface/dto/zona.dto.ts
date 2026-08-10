import { IsOptional, IsString, IsUUID, MinLength, ValidateIf } from "class-validator";

export class CrearZonaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class ActualizarZonaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class AsignarChoferDto {
  // Mandar null (o no mandar choferId) quita el chofer asignado a la zona.
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  choferId?: string | null;
}
