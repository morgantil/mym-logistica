import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { parseDuracionAMs } from "../../../common/utils/duracion";
import { AuthService } from "../auth.service";
import { LocalAuthGuard } from "../estrategias/local-auth.guard";
import { GoogleAuthGuard } from "../estrategias/google-auth.guard";
import { Publico } from "../../../common/decorators/publico.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { LoginDto } from "./dto/login.dto";
import { ActualizarColumnasPedidosDto } from "./dto/actualizar-columnas-pedidos.dto";
import { UsuarioSinCredenciales } from "../../usuarios/domain/usuario";
import { UsuariosService } from "../../usuarios/application/usuarios.service";

const COOKIE_REFRESH = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private usuariosService: UsuariosService,
  ) {}

  // Refresh token SIEMPRE en cookie httpOnly, nunca en el body — DOCUMENTO
  // TECNICO.md sección 2 ("Almacenamiento del token de sesión"). `path`
  // acotado a /auth para que el browser no la mande en cada request a la API,
  // solo acá donde hace falta.
  private setearCookieRefresh(res: Response, refreshToken: string) {
    const maxAge = parseDuracionAMs(this.configService.get<string>("jwt.refreshExpiresIn")!);
    // En dev, front y back viven en el mismo "sitio" (localhost, distinto
    // puerto) — Lax alcanza y no hace falta HTTPS. Una vez desplegado, front
    // y back viven en dominios distintos de verdad (ej. vercel.app vs
    // onrender.com): ahí la cookie es cross-site y el navegador NO la manda
    // salvo SameSite=None — que a su vez exige Secure (HTTPS) por spec.
    const cruzaDominios = process.env.NODE_ENV === "production";
    res.cookie(COOKIE_REFRESH, refreshToken, {
      httpOnly: true,
      secure: cruzaDominios,
      sameSite: cruzaDominios ? "none" : "lax",
      path: "/auth",
      maxAge,
    });
  }

  private limpiarCookieRefresh(res: Response) {
    const cruzaDominios = process.env.NODE_ENV === "production";
    res.clearCookie(COOKIE_REFRESH, {
      path: "/auth",
      secure: cruzaDominios,
      sameSite: cruzaDominios ? "none" : "lax",
    });
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
  async callbackGoogle(@Req() req: Request, @Res() res: Response) {
    const perfil = req.user as { googleId: string; email: string; nombre: string };
    const { accessToken, refreshToken } = await this.authService.iniciarSesionConGoogle(perfil);
    this.setearCookieRefresh(res, refreshToken);
    // Es un GET de navegador completo (Google redirige acá), no un fetch del
    // front — por eso la sesión se completa con un redirect en vez de un JSON.
    // El accessToken va en el fragment (#), no en el query string, para que
    // no quede en logs de servidor ni en el historial de navegación.
    const frontendUrl = this.configService.get<string>("frontendUrl")!;
    res.redirect(`${frontendUrl}/auth/callback#accessToken=${accessToken}`);
  }

  @Get("perfil")
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }

  // Preferencia personal de la grilla de Pedidos (columnas fijas a la
  // izquierda) — decisión 2026-09-01. Self-service: cualquier usuario
  // autenticado puede leer/guardar la suya propia, sin pasar por el rol
  // Administración de UsuariosController (eso es para gestionar A OTROS).
  @Get("perfil/columnas-pedidos")
  async columnasPedidos(@UsuarioActual() usuario: UsuarioAutenticado): Promise<{ columnas: string[] }> {
    const usuarioCompleto = await this.usuariosService.buscarPorId(usuario.id);
    return { columnas: usuarioCompleto?.columnasFijasPedidos ?? [] };
  }

  @Patch("perfil/columnas-pedidos")
  async actualizarColumnasPedidos(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: ActualizarColumnasPedidosDto,
  ): Promise<{ columnas: string[] }> {
    const actualizado = await this.usuariosService.actualizar(usuario.id, usuario.id, {
      columnasFijasPedidos: dto.columnas,
    });
    return { columnas: actualizado.columnasFijasPedidos };
  }
}
