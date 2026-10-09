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

  // Pedido en reunión 2026-10-09: quien da de alta el usuario tiene que
  // poder elegir la contraseña en vez de que siempre salga una generada al
  // azar. Opcional — si se omite, se sigue generando una temporal como
  // hasta ahora (ver UsuariosService.crear).
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
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

  // Qué pantallas ve este usuario en el menú — decisión 2026-10-04, ver
  // comentario en schema.prisma. Vacío/omitido = sin restricción propia.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  pantallasPermitidas?: string[];
}

export class AsignarClientesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  clienteIds!: string[];
}
