import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface UsuarioAutenticado {
  id: string;
  email: string;
  roles: string[];
}

// Uso: metodo(@UsuarioActual() usuario: UsuarioAutenticado)
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
