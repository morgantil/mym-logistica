import { Module } from "@nestjs/common";
import { ZonasChoferesModule } from "../zonas-choferes/zonas-choferes.module";
import { JORNADAS_CHOFERES_REPOSITORIO } from "./domain/jornadas-choferes.repositorio";
import { JornadasChoferesRepositorioPrisma } from "./infrastructure/jornadas-choferes.repositorio.prisma";
import { JornadasChoferesService } from "./application/jornadas-choferes.service";
import { JornadasChoferesController } from "./interface/jornadas-choferes.controller";

@Module({
  imports: [ZonasChoferesModule],
  controllers: [JornadasChoferesController],
  providers: [
    JornadasChoferesService,
    { provide: JORNADAS_CHOFERES_REPOSITORIO, useClass: JornadasChoferesRepositorioPrisma },
  ],
})
export class JornadasChoferesModule {}
