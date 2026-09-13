import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { DestinatariosModule } from "../destinatarios/destinatarios.module";
import { PedidosModule } from "../pedidos/pedidos.module";
import { ZonasChoferesModule } from "../zonas-choferes/zonas-choferes.module";
import { ZonasTarifariasModule } from "../zonas-tarifarias/zonas-tarifarias.module";
import { GeografiaModule } from "../geografia/geografia.module";
import { IMPORTACION_EXCEL_REPOSITORIO } from "./domain/importacion-excel.repositorio";
import { LECTOR_EXCEL } from "./domain/lector-excel.port";
import { PERFIL_IMPORTACION_REPOSITORIO } from "./domain/perfil-importacion.repositorio";
import { SINONIMO_RECETA_REPOSITORIO } from "./domain/sinonimo-receta.repositorio";
import { ImportacionExcelRepositorioPrisma } from "./infrastructure/importacion-excel.repositorio.prisma";
import { LectorExcelExceljsAdapter } from "./infrastructure/lector-excel-exceljs.adapter";
import { PerfilImportacionRepositorioPrisma } from "./infrastructure/perfil-importacion.repositorio.prisma";
import { SinonimoRecetaRepositorioPrisma } from "./infrastructure/sinonimo-receta.repositorio.prisma";
import { ImportarExcelService } from "./application/importar-excel.service";
import { SinonimoRecetaService } from "./application/sinonimo-receta.service";
import { ImportadoresController } from "./interface/importadores.controller";
import { SinonimosRecetaController } from "./interface/sinonimos-receta.controller";

@Module({
  imports: [
    ClientesModule,
    DestinatariosModule,
    PedidosModule,
    ZonasChoferesModule,
    ZonasTarifariasModule,
    GeografiaModule,
  ],
  controllers: [ImportadoresController, SinonimosRecetaController],
  providers: [
    ImportarExcelService,
    SinonimoRecetaService,
    { provide: LECTOR_EXCEL, useClass: LectorExcelExceljsAdapter },
    { provide: PERFIL_IMPORTACION_REPOSITORIO, useClass: PerfilImportacionRepositorioPrisma },
    { provide: IMPORTACION_EXCEL_REPOSITORIO, useClass: ImportacionExcelRepositorioPrisma },
    { provide: SINONIMO_RECETA_REPOSITORIO, useClass: SinonimoRecetaRepositorioPrisma },
  ],
})
export class ImportadoresModule {}
