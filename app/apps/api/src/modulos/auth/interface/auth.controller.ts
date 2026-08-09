import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { LocalAuthGuard } from "../estrategias/local-auth.guard";
import { GoogleAuthGuard } from "../estrategias/google-auth.guard";
import { Publico } from "../../../common/decorators/publico.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { UsuarioSinCredenciales } from "../../usuarios/domain/usuario";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // El DTO valida el shape del body; las credenciales en sí las valida LocalStrategy.
  @Publico()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body() _dto: LoginDto, @Req() req: Request) {
    const usuario = req.user as UsuarioSinCredenciales;
    return this.authService.emitirTokens(usuario);
  }

  @Publico()
  @Post("refresh")
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refrescarTokens(dto.refreshToken);
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
  async callbackGoogle(@Req() req: Request) {
    const perfil = req.user as { googleId: string; email: string; nombre: string };
    // TODO: cuando exista apps/web, acá conviene redirigir con los tokens en query/cookie
    // en vez de devolver JSON crudo.
    return this.authService.iniciarSesionConGoogle(perfil);
  }

  @Get("perfil")
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
