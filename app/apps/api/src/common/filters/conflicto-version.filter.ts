import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ConflictoVersionError } from "../../modulos/pedidos/domain/conflicto-version.error";

// Traduce el error de dominio (bloqueo optimista, DOCUMENTO TECNICO.md sección 2)
// a HTTP 409. Sin esto, Nest lo trataría como error no controlado y respondería 500.
@Catch(ConflictoVersionError)
export class ConflictoVersionFilter implements ExceptionFilter {
  catch(exception: ConflictoVersionError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: "Conflict",
      message: exception.message,
    });
  }
}
