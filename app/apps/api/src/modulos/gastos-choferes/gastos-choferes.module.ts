import { Module } from "@nestjs/common";
import { ZonasChoferesModule } from "../zonas-choferes/zonas-choferes.module";
import { LECTOR_EXCEL } from "../importadores/domain/lector-excel.port";
import { LectorExcelExceljsAdapter } from "../importadores/infrastructure/lector-excel-exceljs.adapter";
import { GASTOS_CHOFERES_REPOSITORIO } from "./domain/gastos-choferes.repositorio";
import { GastosChoferesRepositorioPrisma } from "./infrastructure/gastos-choferes.repositorio.prisma";
import { GastosChoferesService } from "./application/gastos-choferes.service";
import { GastosChoferesController } from "./interface/gastos-choferes.controller";

@Module({
  imports: [ZonasChoferesModule],
  controllers: [GastosChoferesController],
  providers: [
    GastosChoferesService,
    { provide: GASTOS_CHOFERES_REPOSITORIO, useClass: GastosChoferesRepositorioPrisma },
    // No exportado por ImportadoresModule — se re-provee acá (stateless, sin
    // problema en registrarlo en dos módulos, ver comentario en ese módulo).
    { provide: LECTOR_EXCEL, useClass: LectorExcelExceljsAdapter },
  ],
})
export class GastosChoferesModule {}
