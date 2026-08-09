import { Module } from "@nestjs/common";
import { PedidosModule } from "../pedidos/pedidos.module";
import { DashboardController } from "./interface/dashboard.controller";

@Module({
  imports: [PedidosModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
