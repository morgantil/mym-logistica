import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  patronesDeteccion?: string[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
