import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./common/prisma/prisma.module";
import { PermisosModule } from "./common/permisos/permisos.module";
import { ContextoInterceptor } from "./common/contexto/contexto.interceptor";
import { ConflictoVersionFilter } from "./common/filters/conflicto-version.filter";
import { LoggingExceptionFilter } from "./common/filters/logging-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { UsuariosModule } from "./modulos/usuarios/usuarios.module";
import { AuthModule } from "./modulos/auth/auth.module";
import { ClientesModule } from "./modulos/clientes/clientes.module";
import { DestinatariosModule } from "./modulos/destinatarios/destinatarios.module";
import { PedidosModule } from "./modulos/pedidos/pedidos.module";
import { ZonasChoferesModule } from "./modulos/zonas-choferes/zonas-choferes.module";
import { ZonasTarifariasModule } from "./modulos/zonas-tarifarias/zonas-tarifarias.module";
import { SimplirouteModule } from "./modulos/simpliroute/simpliroute.module";
import { DashboardModule } from "./modulos/dashboard/dashboard.module";
import { ImportadoresModule } from "./modulos/importadores/importadores.module";
import { FacturacionModule } from "./modulos/facturacion/facturacion.module";
import { GastosChoferesModule } from "./modulos/gastos-choferes/gastos-choferes.module";
import { JornadasChoferesModule } from "./modulos/jornadas-choferes/jornadas-choferes.module";
import { LimitesReporteModule } from "./modulos/limites-reporte/limites-reporte.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Límite global contra abuso básico (scraping, scripts) — generoso a
    // propósito, no debería notarlo el uso normal. Rutas sensibles como
    // /auth/login tienen su propio límite más estricto con @Throttle() en
    // el controller (ver AuthController) — mejora de seguridad 2026-10-10,
    // antes no había ningún freno a fuerza bruta contra el login.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    PermisosModule,
    UsuariosModule,
    AuthModule,
    ClientesModule,
    DestinatariosModule,
    PedidosModule,
    ZonasChoferesModule,
    ZonasTarifariasModule,
    SimplirouteModule,
    DashboardModule,
    ImportadoresModule,
    FacturacionModule,
    GastosChoferesModule,
    JornadasChoferesModule,
    LimitesReporteModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ContextoInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Orden importa: entre filtros globales, Nest le da precedencia al
    // ÚLTIMO registrado que matchee el tipo de excepción — confirmado
    // probando en vivo (al revés de lo intuitivo). ConflictoVersionFilter
    // va último para que su 409 específico no quede pisado por el 500
    // genérico del catch-all de abajo.
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
    { provide: APP_FILTER, useClass: ConflictoVersionFilter },
  ],
})
export class AppModule {}
