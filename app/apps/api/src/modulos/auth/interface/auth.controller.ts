import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { parseDuracionAMs } from "../../../common/utils/duracion";
import { AuthService } from "../auth.service";
import { LocalAuthGuard } from "../estrategias/local-auth.guard";
import { GoogleAuthGuard } from "../estrategias/google-auth.guard";
import { Publico } from "../../../common/decorators/publico.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { LoginDto } from "./dto/login.dto";
import { UsuarioSinCredenciales } from "../../usuarios/domain/usuario";

const COOKIE_REFRESH = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Refresh token SIEMPRE en cookie httpOnly, nunca en el body — DOCUMENTO
  // TECNICO.md sección 2 ("Almacenamiento del token de sesión"). `path`
  // acotado a /auth para que el browser no la mande en cada request a la API,
  // solo acá donde hace falta.
  private setearCookieRefresh(res: Response, refreshToken: string) {
    const maxAge = parseDuracionAMs(this.configService.get<string>("jwt.refreshExpiresIn")!);
    res.cookie(COOKIE_REFRESH, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge,
    });
  }

  private limpiarCookieRefresh(res: Response) {
    res.clearCookie(COOKIE_REFRESH, { path: "/auth" });
  }

  // El DTO valida el shape del body; las credenciales en sí las valida LocalStrategy.
  @Publico()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const usuario = req.user as UsuarioSinCredenciales;
    const { accessToken, refreshToken } = await this.authService.emitirTokens(usuario);
    this.setearCookieRefresh(res, refreshToken);
    return { accessToken };
  }

  @Publico()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[COOKIE_REFRESH];
    if (!refreshToken) {
      this.limpiarCookieRefresh(res);
      return { accessToken: null };
    }
    const tokens = await this.authService.refrescarTokens(refreshToken);
    this.setearCookieRefresh(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  // Público a propósito, igual que /refresh: cerrar sesión no debería depender
  // de que el access token siga vigente en memoria — solo hace falta la cookie.
  @Publico()
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[COOKIE_REFRESH];
    if (refreshToken) {
      await this.authService.cerrarSesion(refreshToken);
    }
    this.limpiarCookieRefresh(res);
    return { ok: true };
  }

  @Publico()
  @UseGuards(GoogleAuthGuard)
  @Get("google")
  iniciarGoogle() {
    // Passport redirige a Google. No hay body: el guard maneja todo el flujo.
  }

  @Publico()
  @UseGuards(GoogleAuthGuard)
  @Get("google/callback")
  async callbackGoogle(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const perfil = req.user as { googleId: string; email: string; nombre: string };
    const { accessToken, refreshToken } = await this.authService.iniciarSesionConGoogle(perfil);
    this.setearCookieRefresh(res, refreshToken);
    // TODO: cuando exista apps/web, acá conviene redirigir a una URL del front
    // con el accessToken en vez de devolver JSON crudo (esto es un GET de
    // navegador completo, no un fetch del front).
    return { accessToken };
  }

  @Get("perfil")
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
