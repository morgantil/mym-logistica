import { IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CrearSinonimoRecetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valorOrigen!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valorCanonico!: string;

  @IsOptional()
  @IsIn(["IGUAL", "EMPIEZA_CON", "CONTIENE"])
  tipoCoincidencia?: "IGUAL" | "EMPIEZA_CON" | "CONTIENE";

  @IsOptional()
  @IsInt()
  orden?: number;
}
