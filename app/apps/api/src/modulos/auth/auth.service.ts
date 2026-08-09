import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UsuariosService } from "../usuarios/application/usuarios.service";
import { Usuario, UsuarioSinCredenciales } from "../usuarios/domain/usuario";

export interface ParTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Usado por LocalStrategy — DOCUMENTO TECNICO.md: reset de contraseña es manual
  // por un admin en el MVP, así que acá solo se valida, no se auto-registra a nadie.
  async validarCredenciales(email: string, password: string): Promise<UsuarioSinCredenciales> {
    const usuario = await this.usuariosService.buscarPorEmail(email);
    if (!usuario || !usuario.passwordHash || !usuario.activo) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const passwordValida = await argon2.verify(usuario.passwordHash, password);
    if (!passwordValida) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const { passwordHash: _passwordHash, ...usuarioSinCredenciales } = usuario;
    return usuarioSinCredenciales;
  }

  async hashearPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async emitirTokens(usuario: Pick<Usuario, "id" | "email" | "roles">): Promise<ParTokens> {
    const payload = { sub: usuario.id, email: usuario.email, roles: usuario.roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("jwt.secret"),
        expiresIn: this.configService.get("jwt.expiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("jwt.refreshSecret"),
        expiresIn: this.configService.get("jwt.refreshExpiresIn"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refrescarTokens(refreshToken: string): Promise<ParTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get("jwt.refreshSecret"),
      });
      const usuario = await this.usuariosService.buscarPorId(payload.sub);
      if (!usuario) {
        throw new UnauthorizedException();
      }
      return this.emitirTokens(usuario);
    } catch {
      throw new UnauthorizedException("Refresh token inválido o vencido.");
    }
  }

  async iniciarSesionConGoogle(perfil: {
    googleId: string;
    email: string;
    nombre: string;
  }): Promise<ParTokens> {
    const usuario = await this.usuariosService.buscarOCrearPorGoogle(perfil);
    return this.emitirTokens(usuario);
  }
}
