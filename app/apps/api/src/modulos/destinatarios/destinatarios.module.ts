import { Module } from "@nestjs/common";
import { SimplirouteModule } from "../simpliroute/simpliroute.module";
import { DESTINATARIOS_REPOSITORIO } from "./domain/destinatarios.repositorio";
import { DestinatariosRepositorioPrisma } from "./infrastructure/destinatarios.repositorio.prisma";
import { DestinatariosService } from "./application/destinatarios.service";

// Este módulo todavía no expone controller propio: por ahora solo lo consume
// el módulo de importadores durante el procesamiento del Excel (§8, §11 funcional).
// Se le puede agregar una interface/destinatarios.controller.ts cuando haga falta
// una pantalla de administración del padrón fuera del flujo de importación.
@Module({
  imports: [SimplirouteModule],
  providers: [
    DestinatariosService,
    { provide: DESTINATARIOS_REPOSITORIO, useClass: DestinatariosRepositorioPrisma },
  ],
  exports: [DestinatariosService],
})
export class DestinatariosModule {}
