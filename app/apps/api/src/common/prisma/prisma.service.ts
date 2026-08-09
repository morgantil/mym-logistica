import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { registrarBorradoLogico } from "./soft-delete.middleware";
import { registrarAuditoria } from "./auditoria.middleware";

// Cliente Prisma único de la app. El resto de los módulos inyecta PrismaService,
// nunca instancia PrismaClient por su cuenta.
//
// Trae registrados, en este orden (importa):
// 1. Auditoría (auditoria.middleware.ts) — captura la acción ORIGINAL (ej. BORRAR)
//    antes de que el borrado lógico la reescriba.
// 2. Borrado lógico (soft-delete.middleware.ts) — delete/deleteMany se convierten
//    en update seteando `eliminadoEn`; find*/count filtran `eliminadoEn: null` salvo
//    que se pida explícitamente `{ incluirEliminados: true }`.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    registrarAuditoria(this);
    registrarBorradoLogico(this);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
