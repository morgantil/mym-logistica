import { Body, Controller, Param, Patch, Post, Get } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { UsuariosService } from "../application/usuarios.service";
import { ActualizarUsuarioDto, AsignarClientesDto, CrearUsuarioDto } from "./dto/usuario.dto";

// Pantalla "Usuarios" — agregada 2026-08-26 al sacar el login con Google del
// MVP (ver DOCUMENTO TECNICO.md historial): sin esto no había forma de dar
// de alta/gestionar usuarios más que a mano en la base. Solo Administración.
@Roles(Rol.ADMINISTRACION)
@Controller("usuarios")
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  @Get()
  listar() {
    return this.usuariosService.listar();
  }

  // Devuelve la contraseña temporal en texto plano UNA sola vez — la pantalla
  // la muestra en un diálogo que hay que copiar antes de cerrar, no queda
  // recuperable después.
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear({
      email: dto.email,
      nombre: dto.nombre,
      roles: dto.roles,
      clienteIds: dto.clienteIds ?? [],
    });
  }

  @Patch(":id")
  actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() usuarioActual: UsuarioAutenticado,
  ) {
    return this.usuariosService.actualizar(id, usuarioActual.id, dto);
  }

  @Patch(":id/clientes-permitidos")
  actualizarClientesPermitidos(@Param("id") id: string, @Body() dto: AsignarClientesDto) {
    return this.usuariosService.actualizarClientesPermitidos(id, dto.clienteIds);
  }

  // Igual que crear(): la contraseña nueva se devuelve en texto plano una
  // sola vez, en esta respuesta.
  @Post(":id/resetear-password")
  resetearPassword(@Param("id") id: string) {
    return this.usuariosService.resetearPassword(id);
  }
}
