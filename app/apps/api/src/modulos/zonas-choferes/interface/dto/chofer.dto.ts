import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CrearChoferDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class ActualizarChoferDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
