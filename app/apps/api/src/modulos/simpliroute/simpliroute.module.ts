import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LOGISTICA_PROVIDER } from "./domain/logistica-provider.port";
import { SimplirouteHttpAdapter } from "./infrastructure/simpliroute-http.adapter";
import { SimplirouteMockAdapter } from "./infrastructure/simpliroute-mock.adapter";

const logger = new Logger("SimplirouteModule");

// SIMPLIROUTE_MOCK=true (default) usa el mock; =false usa el adapter HTTP
// real (ver README de este módulo — construido contra la documentación
// pública, pendiente de probar contra una cuenta real). El resto de la app
// sigue inyectando LOGISTICA_PROVIDER sin enterarse de cuál está activo.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LOGISTICA_PROVIDER,
      inject: [ConfigService, SimplirouteMockAdapter, SimplirouteHttpAdapter],
      useFactory: (
        config: ConfigService,
        mock: SimplirouteMockAdapter,
        real: SimplirouteHttpAdapter,
      ) => {
        if (config.get("simpliroute.mock") !== false) return mock;
        if (!config.get("simpliroute.apiKey")) {
          logger.warn("SIMPLIROUTE_MOCK=false con SIMPLIROUTE_API_KEY vacío — todas las llamadas van a fallar.");
        }
        return real;
      },
    },
    SimplirouteMockAdapter,
    SimplirouteHttpAdapter,
  ],
  exports: [LOGISTICA_PROVIDER],
})
export class SimplirouteModule {}
