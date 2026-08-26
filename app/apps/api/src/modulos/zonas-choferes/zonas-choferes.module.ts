import { Module } from "@nestjs/common";
import { SimplirouteModule } from "../simpliroute/simpliroute.module";
import { ZonasChoferesService } from "./application/zonas-choferes.service";
import { ZonasChoferesController } from "./interface/zonas-choferes.controller";

@Module({
  imports: [SimplirouteModule],
  controllers: [ZonasChoferesController],
  providers: [ZonasChoferesService],
  exports: [ZonasChoferesService],
})
export class ZonasChoferesModule {}
