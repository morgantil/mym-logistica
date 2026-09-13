import { IsString, MaxLength, MinLength } from "class-validator";

export class CrearSinonimoRecetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valorOrigen!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valorCanonico!: string;
}
