import { Module } from "@nestjs/common";
import { ZonasTarifariasService } from "./application/zonas-tarifarias.service";
import { ZonasTarifariasController } from "./interface/zonas-tarifarias.controller";

@Module({
  controllers: [ZonasTarifariasController],
  providers: [ZonasTarifariasService],
  exports: [ZonasTarifariasService],
})
export class ZonasTarifariasModule {}
