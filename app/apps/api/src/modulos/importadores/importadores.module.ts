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
import { ImportacionExcelRepositorioPrisma } from "./infrastructure/importacion-excel.repositorio.prisma";
import { LectorExcelExceljsAdapter } from "./infrastructure/lector-excel-exceljs.adapter";
import { PerfilImportacionRepositorioPrisma } from "./infrastructure/perfil-importacion.repositorio.prisma";
import { ImportarExcelService } from "./application/importar-excel.service";
import { ImportadoresController } from "./interface/importadores.controller";

@Module({
  imports: [
    ClientesModule,
    DestinatariosModule,
    PedidosModule,
    ZonasChoferesModule,
    ZonasTarifariasModule,
    GeografiaModule,
  ],
  controllers: [ImportadoresController],
  providers: [
    ImportarExcelService,
    { provide: LECTOR_EXCEL, useClass: LectorExcelExceljsAdapter },
    { provide: PERFIL_IMPORTACION_REPOSITORIO, useClass: PerfilImportacionRepositorioPrisma },
    { provide: IMPORTACION_EXCEL_REPOSITORIO, useClass: ImportacionExcelRepositorioPrisma },
  ],
})
export class ImportadoresModule {}
