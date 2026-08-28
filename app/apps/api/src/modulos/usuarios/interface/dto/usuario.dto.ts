import { Rol } from "@prisma/client";
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CrearUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(Rol, { each: true })
  roles!: Rol[];

  // IDs de Cliente a los que queda restringido — vacío/omitido = ve todos.
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  clienteIds?: string[];
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Rol, { each: true })
  roles?: Rol[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class AsignarClientesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  clienteIds!: string[];
}
