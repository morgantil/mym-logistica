import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { ejecutarConContexto } from "./contexto-solicitud";

// Interceptor global (registrado en AppModule) que guarda el usuario autenticado
// en AsyncLocalStorage para que el middleware de auditoría de Prisma pueda leerlo
// sin que cada service tenga que pasarlo a mano en cada llamada.
//
// Corre después de los guards, así que `request.user` ya está poblado si hay sesión.
@Injectable()
export class ContextoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const usuarioId = request?.user?.id;

    return new Observable((subscriber) => {
      ejecutarConContexto({ usuarioId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
