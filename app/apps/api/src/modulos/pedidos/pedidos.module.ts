import { Module } from "@nestjs/common";
import { PermisosModule } from "../../common/permisos/permisos.module";
import { PEDIDOS_REPOSITORIO } from "./domain/pedidos.repositorio";
import { PedidosRepositorioPrisma } from "./infrastructure/pedidos.repositorio.prisma";
import { PedidosService } from "./application/pedidos.service";
import { PedidosController } from "./interface/pedidos.controller";

@Module({
  imports: [PermisosModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    { provide: PEDIDOS_REPOSITORIO, useClass: PedidosRepositorioPrisma },
  ],
  exports: [PedidosService],
})
export class PedidosModule {}
