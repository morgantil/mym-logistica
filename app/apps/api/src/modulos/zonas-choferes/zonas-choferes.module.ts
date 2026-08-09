import { Module } from "@nestjs/common";
import { ZonasChoferesService } from "./application/zonas-choferes.service";
import { ZonasChoferesController } from "./interface/zonas-choferes.controller";

@Module({
  controllers: [ZonasChoferesController],
  providers: [ZonasChoferesService],
  exports: [ZonasChoferesService],
})
export class ZonasChoferesModule {}
