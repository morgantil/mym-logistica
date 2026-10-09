import { IsDateString, IsOptional } from "class-validator";

export class FiltroJornadasDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  choferId?: string;
}
