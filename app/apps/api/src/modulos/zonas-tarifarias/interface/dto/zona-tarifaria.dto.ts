import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CrearZonaTarifariaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class ActualizarZonaTarifariaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class AsignarLocalidadDto {
  @IsString()
  @MinLength(1)
  localidad!: string;

  @IsUUID()
  zonaTarifariaId!: string;
}

export class AsignarZonaSimpliRouteDto {
  @IsInt()
  zonaSimpliRouteId!: number;

  @IsUUID()
  zonaTarifariaId!: string;
}

export class AsignarPartidoDto {
  @IsString()
  @MinLength(1)
  partido!: string;

  @IsUUID()
  zonaTarifariaId!: string;
}
