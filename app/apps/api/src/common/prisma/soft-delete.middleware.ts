import { Prisma, PrismaClient } from "@prisma/client";

// Modelos que tienen el campo `eliminadoEn` — ver DOCUMENTO TECNICO.md sección 2
// ("Borrado lógico"). Si agregás el campo a un modelo nuevo, sumalo acá.
export const MODELOS_CON_BORRADO_LOGICO = new Set([
  "Usuario",
  "Cliente",
  "TarifaCliente",
  "PorcentajeSegundoServicio",
  "Destinatario",
  "Zona",
  "Chofer",
  "Pedido",
  "Producto",
  "GastoChofer",
  "JornadaChofer",
]);

const ACCIONES_LECTURA_UNICA = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow"];
const ACCIONES_LECTURA_MULTIPLE = ["findMany", "count", "aggregate"];
const ACCIONES_BORRADO = ["delete", "deleteMany"];

/**
 * Registra el middleware de borrado lógico sobre una instancia de PrismaClient:
 *
 * - `delete` / `deleteMany` nunca borran físicamente: se reescriben como `update`
 *   seteando `eliminadoEn`. El `eliminadoPorId` lo agrega quien llame a prisma
 *   pasando `{ eliminadoPorId }` en el `data` original (ver ejemplo en README de este módulo).
 * - Las lecturas filtran `eliminadoEn: null` por defecto. Para incluir eliminados
 *   explícitamente, pasar `{ incluirEliminados: true }` dentro de `args` — el
 *   middleware lo intercepta y lo quita antes de mandarlo a Prisma real.
 */
export function registrarBorradoLogico(prisma: PrismaClient) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    if (!params.model || !MODELOS_CON_BORRADO_LOGICO.has(params.model)) {
      return next(params);
    }

    const incluirEliminados = (params.args as Record<string, unknown> | undefined)?.[
      "incluirEliminados"
    ];
    if (params.args && "incluirEliminados" in params.args) {
      delete (params.args as Record<string, unknown>)["incluirEliminados"];
    }

    if (ACCIONES_LECTURA_UNICA.includes(params.action)) {
      if (!incluirEliminados) {
        params.args.where = { ...params.args.where, eliminadoEn: null };
      }
    }

    if (ACCIONES_LECTURA_MULTIPLE.includes(params.action)) {
      if (!incluirEliminados) {
        params.args = params.args ?? {};
        params.args.where = { ...params.args.where, eliminadoEn: null };
      }
    }

    if (params.action === "delete") {
      params.action = "update";
      params.args.data = { eliminadoEn: new Date() };
    }

    if (params.action === "deleteMany") {
      params.action = "updateMany";
      params.args.data = { eliminadoEn: new Date() };
    }

    return next(params);
  });
}
