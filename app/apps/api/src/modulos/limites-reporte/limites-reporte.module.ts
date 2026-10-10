import { Module } from "@nestjs/common";
import { LIMITES_REPORTE_REPOSITORIO } from "./domain/limites-reporte.repositorio";
import { LimitesReporteRepositorioPrisma } from "./infrastructure/limites-reporte.repositorio.prisma";
import { LimitesReporteService } from "./application/limites-reporte.service";
import { LimitesReporteController } from "./interface/limites-reporte.controller";

@Module({
  controllers: [LimitesReporteController],
  providers: [
    LimitesReporteService,
    { provide: LIMITES_REPORTE_REPOSITORIO, useClass: LimitesReporteRepositorioPrisma },
  ],
  exports: [LimitesReporteService],
})
export class LimitesReporteModule {}
