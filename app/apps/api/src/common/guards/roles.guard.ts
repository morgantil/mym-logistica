import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Rol } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { UsuarioAutenticado } from "../decorators/usuario-actual.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true; // endpoint sin @Roles() explícito: cualquier usuario autenticado pasa
    }

    const usuario: UsuarioAutenticado = context.switchToHttp().getRequest().user;
    const tieneAlgunRol = rolesRequeridos.some((rol) => usuario?.roles?.includes(rol));

    if (!tieneAlgunRol) {
      throw new ForbiddenException("No tenés el rol necesario para esta acción.");
    }
    return true;
  }
}
