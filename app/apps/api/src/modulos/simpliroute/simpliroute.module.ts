import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LOGISTICA_PROVIDER } from "./domain/logistica-provider.port";
import { SimplirouteMockAdapter } from "./infrastructure/simpliroute-mock.adapter";

// Cuando se resuelva el acceso a la API real (DOCUMENTO TECNICO.md sección 4),
// se agrega infrastructure/simpliroute-http.adapter.ts implementando el mismo
// puerto, y esta factory elige entre uno u otro según config.simpliroute.mock.
// El resto de la app sigue inyectando LOGISTICA_PROVIDER sin enterarse del cambio.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LOGISTICA_PROVIDER,
      inject: [ConfigService, SimplirouteMockAdapter],
      useFactory: (config: ConfigService, mock: SimplirouteMockAdapter) => {
        if (config.get("simpliroute.mock") !== false) {
          return mock;
        }
        throw new Error(
          "SIMPLIROUTE_MOCK=false pero todavía no existe el adapter HTTP real. " +
            "Ver DOCUMENTO TECNICO.md sección 4.",
        );
      },
    },
    SimplirouteMockAdapter,
  ],
  exports: [LOGISTICA_PROVIDER],
})
export class SimplirouteModule {}
