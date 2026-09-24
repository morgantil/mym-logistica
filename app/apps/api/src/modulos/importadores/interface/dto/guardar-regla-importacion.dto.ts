import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { TipoServicio } from "@mym/shared-types";

// Sirve para crear y para actualizar (PUT-style): la regla se manda completa.
export class GuardarReglaImportacionDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(TipoServicio)
  tipoServicio!: TipoServicio;

  @IsString()
  @MaxLength(60)
  campoOrigen!: string;

  @IsIn(["IGUAL", "EMPIEZA_CON", "CONTIENE"])
  tipoCoincidencia!: "IGUAL" | "EMPIEZA_CON" | "CONTIENE";

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  valor!: string;

  @IsIn(["ASIGNAR_VALOR", "QUITAR_PREFIJO"])
  accion!: "ASIGNAR_VALOR" | "QUITAR_PREFIJO";

  @IsString()
  @MaxLength(60)
  campoDestino!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  valorDestino?: string;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
