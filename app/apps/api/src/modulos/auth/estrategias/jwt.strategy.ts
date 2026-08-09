import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsuariosService } from "../../usuarios/application/usuarios.service";

interface PayloadJwt {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwt.secret") as string,
    });
  }

  async validate(payload: PayloadJwt) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException();
    }
    // Esto es lo que termina en `request.user` — ver UsuarioActual y RolesGuard.
    return { id: usuario.id, email: usuario.email, roles: usuario.roles };
  }
}
