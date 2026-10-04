import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsuariosModule } from "../usuarios/usuarios.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./interface/auth.controller";
import { LocalStrategy } from "./estrategias/local.strategy";
import { JwtStrategy } from "./estrategias/jwt.strategy";
import { SesionesService } from "./sesiones.service";

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("jwt.secret"),
        signOptions: { expiresIn: config.get("jwt.expiresIn") },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SesionesService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
