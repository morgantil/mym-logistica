import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";

// Mejora de robustez 2026-10-10 (ver REPORTE_SEGURIDAD_Y_ROBUSTEZ.md): antes
// no había ningún logging global de errores — Nest igual imprime los no
// manejados a consola por su cuenta, pero sin contexto (qué ruta, qué
// usuario) y mezclado con cualquier otra cosa. Esto NO reemplaza a Sentry
// (pendiente, requiere cuenta nueva) — es la versión "solo código" mientras
// tanto: deja algo útil en los logs de Render para cuando haga falta mirar
// qué pasó.
//
// Extiende BaseExceptionFilter (no @Catch(Error) a mano) para no reinventar
// cómo Nest arma la respuesta de cada tipo de excepción — el filtro
// específico que ya existía (ConflictoVersionFilter) sigue resolviendo su
// caso (409) porque está registrado DESPUÉS de este en AppModule: entre
// filtros globales, Nest le da precedencia al último registrado que
// matchee el tipo — confirmado probando en vivo (un 409 real se devolvía
// como 500 hasta invertir el orden). Si se agrega otro filtro específico
// nuevo, tiene que ir después de este también.
@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger("Excepciones");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const usuario = (request as { user?: { id: string; email: string } }).user;

    const esHttpException = exception instanceof HttpException;
    const status = esHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const contexto = `${request.method} ${request.originalUrl} — usuario=${usuario?.email ?? "anónimo"}`;

    if (status >= 500) {
      // Error real (bug, caída de un servicio externo, etc.) — con stack.
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${status} ${contexto}`, stack);
    } else if (status >= 400) {
      // Esperado (validación, no encontrado, permisos) — no es un bug,
      // nivel más bajo para no inundar los logs con ruido normal.
      const mensaje = esHttpException ? JSON.stringify(exception.getResponse()) : String(exception);
      this.logger.warn(`${status} ${contexto} — ${mensaje}`);
    }

    super.catch(exception, host);
  }
}
