import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class CrearClienteDto {
  @IsString()
  nombre!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  patronesDeteccion!: string[];
}
