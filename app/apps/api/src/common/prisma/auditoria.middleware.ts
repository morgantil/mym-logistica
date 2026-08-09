import { Prisma, PrismaClient, AccionAuditoria } from "@prisma/client";
import { obtenerUsuarioActual } from "../contexto/contexto-solicitud";
import { MODELOS_CON_BORRADO_LOGICO } from "./soft-delete.middleware";

const MODELOS_EXCLUIDOS = new Set(["RegistroAuditoria"]);

const ACCION_POR_METODO: Partial<Record<Prisma.PrismaAction, AccionAuditoria>> = {
  create: AccionAuditoria.CREAR,
  createMany: AccionAuditoria.CREAR,
  update: AccionAuditoria.ACTUALIZAR,
  updateMany: AccionAuditoria.ACTUALIZAR,
  upsert: AccionAuditoria.ACTUALIZAR,
  // El middleware de borrado lógico reescribe delete/deleteMany en update/updateMany
  // ANTES de que la operación llegue a la base — pero acá capturamos la intención
  // original, así que estos dos casos igual quedan registrados como BORRAR.
  delete: AccionAuditoria.BORRAR,
  deleteMany: AccionAuditoria.BORRAR,
};

function primeraMinuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function extraerEntidadId(resultado: unknown, params: Prisma.MiddlewareParams): string {
  if (resultado && typeof resultado === "object" && "id" in resultado) {
    return String((resultado as { id: unknown }).id);
  }
  // updateMany/deleteMany/createMany no devuelven un id único.
  const where = (params.args as { where?: unknown } | undefined)?.where;
  return where ? `multiple:${JSON.stringify(where)}` : "multiple";
}

/**
 * Registra el middleware de auditoría universal: cualquier create/update/upsert/delete
 * sobre cualquier modelo (salvo RegistroAuditoria) queda escrito en RegistroAuditoria
 * con usuario, timestamp, y valor anterior/nuevo.
 *
 * Debe registrarse ANTES que el middleware de borrado lógico (ver PrismaService) para
 * poder capturar la acción original (BORRAR) antes de que ese middleware la reescriba
 * como un update.
 */
export function registrarAuditoria(prisma: PrismaClient) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    if (!params.model || MODELOS_EXCLUIDOS.has(params.model)) {
      return next(params);
    }

    const accion = ACCION_POR_METODO[params.action];
    if (!accion) {
      return next(params);
    }

    const usuarioId = obtenerUsuarioActual()?.usuarioId ?? null;

    let valorAnterior: unknown = null;
    if (["update", "upsert", "delete"].includes(params.action) && params.args?.where) {
      const modeloProp = primeraMinuscula(params.model);
      const argsPrevio: Record<string, unknown> = { where: params.args.where };
      if (MODELOS_CON_BORRADO_LOGICO.has(params.model)) {
        argsPrevio.incluirEliminados = true;
      }
      valorAnterior = await (prisma as unknown as Record<string, any>)[modeloProp]
        .findUnique(argsPrevio)
        .catch(() => null);
    }

    const resultado = await next(params);

    try {
      await (prisma as unknown as Record<string, any>).registroAuditoria.create({
        data: {
          entidad: params.model,
          entidadId: extraerEntidadId(resultado, params),
          accion,
          usuarioId,
          valorAnterior: valorAnterior ? JSON.parse(JSON.stringify(valorAnterior)) : undefined,
          valorNuevo:
            accion !== AccionAuditoria.BORRAR && resultado
              ? JSON.parse(JSON.stringify(resultado))
              : undefined,
        },
      });
    } catch {
      // Nunca romper la operación principal porque falló la escritura de auditoría.
      // TODO: reemplazar por el Logger de Nest una vez que haya un módulo de logging central.
    }

    return resultado;
  });
}
