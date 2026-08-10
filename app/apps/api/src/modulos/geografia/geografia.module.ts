import { Module } from "@nestjs/common";
import { NORMALIZADOR_DIRECCIONES } from "./domain/normalizador-direcciones.port";
import { GeorefArAdapter } from "./infrastructure/georef-ar.adapter";

@Module({
  providers: [{ provide: NORMALIZADOR_DIRECCIONES, useClass: GeorefArAdapter }],
  exports: [NORMALIZADOR_DIRECCIONES],
})
export class GeografiaModule {}
