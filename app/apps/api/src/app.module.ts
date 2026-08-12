import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import configuration from "./config/configuration";
import { PrismaModule } from "./common/prisma/prisma.module";
import { PermisosModule } from "./common/permisos/permisos.module";
import { ContextoInterceptor } from "./common/contexto/contexto.interceptor";
import { ConflictoVersionFilter } from "./common/filters/conflicto-version.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { UsuariosModule } from "./modulos/usuarios/usuarios.module";
import { AuthModule } from "./modulos/auth/auth.module";
import { ClientesModule } from "./modulos/clientes/clientes.module";
import { DestinatariosModule } from "./modulos/destinatarios/destinatarios.module";
import { PedidosModule } from "./modulos/pedidos/pedidos.module";
import { ZonasChoferesModule } from "./modulos/zonas-choferes/zonas-choferes.module";
import { SimplirouteModule } from "./modulos/simpliroute/simpliroute.module";
import { DashboardModule } from "./modulos/dashboard/dashboard.module";
import { ImportadoresModule } from "./modulos/importadores/importadores.module";
import { FacturacionModule } from "./modulos/facturacion/facturacion.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    PermisosModule,
    UsuariosModule,
    AuthModule,
    ClientesModule,
    DestinatariosModule,
    PedidosModule,
    ZonasChoferesModule,
    SimplirouteModule,
    DashboardModule,
    ImportadoresModule,
    FacturacionModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ContextoInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: ConflictoVersionFilter },
  ],
})
export class AppModule {}
