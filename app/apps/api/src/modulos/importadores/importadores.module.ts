import { Module } from "@nestjs/common";
import { DestinatariosModule } from "../destinatarios/destinatarios.module";
import { PedidosModule } from "../pedidos/pedidos.module";
import { ZonasChoferesModule } from "../zonas-choferes/zonas-choferes.module";
import { ZonasTarifariasModule } from "../zonas-tarifarias/zonas-tarifarias.module";
import { GeografiaModule } from "../geografia/geografia.module";
import { IMPORTACION_EXCEL_REPOSITORIO } from "./domain/importacion-excel.repositorio";
import { LECTOR_EXCEL } from "./domain/lector-excel.port";
import { REGLA_IMPORTACION_REPOSITORIO } from "./domain/regla-importacion.repositorio";
import { PERFIL_IMPORTACION_REPOSITORIO } from "./domain/perfil-importacion.repositorio";
import { SINONIMO_RECETA_REPOSITORIO } from "./domain/sinonimo-receta.repositorio";
import { ImportacionExcelRepositorioPrisma } from "./infrastructure/importacion-excel.repositorio.prisma";
import { LectorExcelExceljsAdapter } from "./infrastructure/lector-excel-exceljs.adapter";
import { PerfilImportacionRepositorioPrisma } from "./infrastructure/perfil-importacion.repositorio.prisma";
import { ReglaImportacionRepositorioPrisma } from "./infrastructure/regla-importacion.repositorio.prisma";
import { SinonimoRecetaRepositorioPrisma } from "./infrastructure/sinonimo-receta.repositorio.prisma";
import { ImportarExcelService } from "./application/importar-excel.service";
import { ReglaImportacionService } from "./application/regla-importacion.service";
import { SinonimoRecetaService } from "./application/sinonimo-receta.service";
import { ImportadoresController } from "./interface/importadores.controller";
import { ReglasImportacionController } from "./interface/reglas-importacion.controller";
import { SinonimosRecetaController } from "./interface/sinonimos-receta.controller";

@Module({
  imports: [
    DestinatariosModule,
    PedidosModule,
    ZonasChoferesModule,
    ZonasTarifariasModule,
    GeografiaModule,
  ],
  controllers: [ImportadoresController, SinonimosRecetaController, ReglasImportacionController],
  providers: [
    ImportarExcelService,
    SinonimoRecetaService,
    ReglaImportacionService,
    { provide: LECTOR_EXCEL, useClass: LectorExcelExceljsAdapter },
    { provide: PERFIL_IMPORTACION_REPOSITORIO, useClass: PerfilImportacionRepositorioPrisma },
    { provide: IMPORTACION_EXCEL_REPOSITORIO, useClass: ImportacionExcelRepositorioPrisma },
    { provide: REGLA_IMPORTACION_REPOSITORIO, useClass: ReglaImportacionRepositorioPrisma },
    { provide: SINONIMO_RECETA_REPOSITORIO, useClass: SinonimoRecetaRepositorioPrisma },
  ],
})
export class ImportadoresModule {}
