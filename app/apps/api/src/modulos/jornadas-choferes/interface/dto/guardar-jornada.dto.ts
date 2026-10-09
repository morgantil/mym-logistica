import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

const PATRON_HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;

export class GuardarJornadaDto {
  @IsString()
  @IsNotEmpty()
  choferId!: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @Matches(PATRON_HORA, { message: "horaInicio debe tener formato HH:mm" })
  horaInicio?: string;

  @IsOptional()
  @Matches(PATRON_HORA, { message: "horaFin debe tener formato HH:mm" })
  horaFin?: string;
}
