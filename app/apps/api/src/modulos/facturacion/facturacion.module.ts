import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { JornadasChoferesModule } from "../jornadas-choferes/jornadas-choferes.module";
import { PedidosModule } from "../pedidos/pedidos.module";
import { ZonasTarifariasModule } from "../zonas-tarifarias/zonas-tarifarias.module";
import { FACTURACION_REPOSITORIO } from "./domain/facturacion.repositorio";
import { FacturacionRepositorioPrisma } from "./infrastructure/facturacion.repositorio.prisma";
import { FacturacionService } from "./application/facturacion.service";
import { FacturacionController } from "./interface/facturacion.controller";

@Module({
  imports: [PedidosModule, ClientesModule, ZonasTarifariasModule, JornadasChoferesModule],
  controllers: [FacturacionController],
  providers: [
    FacturacionService,
    { provide: FACTURACION_REPOSITORIO, useClass: FacturacionRepositorioPrisma },
  ],
  exports: [FacturacionService],
})
export class FacturacionModule {}
