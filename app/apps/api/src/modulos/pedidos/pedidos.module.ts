import { Module } from "@nestjs/common";
import { PermisosModule } from "../../common/permisos/permisos.module";
import { ClientesModule } from "../clientes/clientes.module";
import { DestinatariosModule } from "../destinatarios/destinatarios.module";
import { SimplirouteModule } from "../simpliroute/simpliroute.module";
import { GeografiaModule } from "../geografia/geografia.module";
import { ZonasChoferesModule } from "../zonas-choferes/zonas-choferes.module";
import { PEDIDOS_REPOSITORIO } from "./domain/pedidos.repositorio";
import { PedidosRepositorioPrisma } from "./infrastructure/pedidos.repositorio.prisma";
import { PedidosService } from "./application/pedidos.service";
import { PedidosController } from "./interface/pedidos.controller";

@Module({
  imports: [
    PermisosModule,
    ClientesModule,
    DestinatariosModule,
    SimplirouteModule,
    ZonasChoferesModule,
    GeografiaModule,
  ],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    { provide: PEDIDOS_REPOSITORIO, useClass: PedidosRepositorioPrisma },
  ],
  exports: [PedidosService],
})
export class PedidosModule {}
