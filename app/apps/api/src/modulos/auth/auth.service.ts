import { randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { parseDuracionAMs } from "../../common/utils/duracion";
import { UsuariosService } from "../usuarios/application/usuarios.service";
import { Usuario, UsuarioSinCredenciales } from "../usuarios/domain/usuario";
import { SesionesService } from "./sesiones.service";

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
    private sesionesService: SesionesService,
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

  // Cada refresh token emitido queda registrado en SesionesService — es lo que
  // permite revocarlo de verdad después (DOCUMENTO TECNICO.md sección 2).
  async emitirTokens(usuario: Pick<Usuario, "id" | "email" | "roles">): Promise<ParTokens> {
    const payload = { sub: usuario.id, email: usuario.email, roles: usuario.roles };
    const refreshExpiresIn = this.configService.get<string>("jwt.refreshExpiresIn")!;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        // `jti` random por token: sin esto, dos tokens firmados para el mismo
        // usuario dentro del mismo segundo (`iat` es en segundos) son
        // byte-idénticos — el `tokenHash` con constraint UNIQUE de
        // SesionRefreshToken rompía con un 500 real en ese caso (visto con
        // React StrictMode disparando el refresh inicial dos veces seguidas).
        { ...payload, jti: randomUUID() },
        {
          secret: this.configService.get("jwt.secret"),
          expiresIn: this.configService.get("jwt.expiresIn"),
        },
      ),
      this.jwtService.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.configService.get("jwt.refreshSecret"),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    await this.sesionesService.crear(
      usuario.id,
      refreshToken,
      new Date(Date.now() + parseDuracionAMs(refreshExpiresIn)),
    );

    return { accessToken, refreshToken };
  }

  // Rotación: el refresh token usado queda revocado acá mismo, antes de emitir
  // uno nuevo — así un mismo refresh token nunca sirve dos veces, y si alguien
  // lo robó, el uso legítimo posterior del dueño real ya no va a matchear
  // contra una sesión válida (señal de que algo raro pasó, aunque hoy no
  // dispara ninguna alerta automática — queda para más adelante si hace falta).
  async refrescarTokens(refreshToken: string): Promise<ParTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get("jwt.refreshSecret"),
      });

      const sesion = await this.sesionesService.buscarValida(refreshToken);
      if (!sesion) {
        throw new UnauthorizedException();
      }

      const usuario = await this.usuariosService.buscarPorId(payload.sub);
      if (!usuario) {
        throw new UnauthorizedException();
      }

      await this.sesionesService.revocarPorId(sesion.id);
      return this.emitirTokens(usuario);
    } catch {
      throw new UnauthorizedException("Refresh token inválido, vencido o revocado.");
    }
  }

  async cerrarSesion(refreshToken: string): Promise<void> {
    await this.sesionesService.revocarToken(refreshToken);
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
