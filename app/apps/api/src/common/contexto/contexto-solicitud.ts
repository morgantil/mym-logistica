import { AsyncLocalStorage } from "node:async_hooks";

export interface DatosContexto {
  usuarioId?: string;
}

// Permite que el middleware de auditoría de Prisma (que no tiene acceso al
// request HTTP) sepa qué usuario está autenticado en la request actual.
// Se puebla en ContextoInterceptor, que corre después de los guards de auth.
const almacenamiento = new AsyncLocalStorage<DatosContexto>();

export function ejecutarConContexto<T>(datos: DatosContexto, fn: () => T): T {
  return almacenamiento.run(datos, fn);
}

export function obtenerUsuarioActual(): DatosContexto | undefined {
  return almacenamiento.getStore();
}
