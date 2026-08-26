import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

// Campos de Driver/User de SimpliRoute (Documentacion simpliroute/04 §44-59)
// — este DTO ya no describe una entidad local, describe lo que se manda al
// crear/actualizar un chofer directo contra la API de SimpliRoute.
export class CrearChoferDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  username!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class ActualizarChoferDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  username!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Opcional al editar — ver DatosChofer.password en logistica-provider.port.ts:
  // no está documentado si SimpliRoute preserva la contraseña actual cuando
  // se omite en el PUT.
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
