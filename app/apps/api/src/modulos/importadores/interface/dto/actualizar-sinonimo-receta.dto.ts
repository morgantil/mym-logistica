import { IsString, MaxLength, MinLength } from "class-validator";

export class ActualizarSinonimoRecetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valorCanonico!: string;
}
