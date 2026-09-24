import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { SinonimoRecetaService } from "../application/sinonimo-receta.service";
import { ActualizarSinonimoRecetaDto } from "./dto/actualizar-sinonimo-receta.dto";
import { CrearSinonimoRecetaDto } from "./dto/crear-sinonimo-receta.dto";

// ABM de sinónimos de "Receta" (decisión 2026-09-13, ver TEMAS_PENDIENTES.md
// §13.14) — mismos roles que ya operan la importación de Excel.
@Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
@Controller("sinonimos-receta")
export class SinonimosRecetaController {
  constructor(private sinonimoRecetaService: SinonimoRecetaService) {}

  @Get()
  listar() {
    return this.sinonimoRecetaService.listar();
  }

  @Post()
  crear(@Body() dto: CrearSinonimoRecetaDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.sinonimoRecetaService.crear(
      dto.valorOrigen,
      dto.valorCanonico,
      dto.tipoCoincidencia ?? "IGUAL",
      dto.orden ?? 0,
      usuario.id,
    );
  }

  @Patch(":id")
  actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarSinonimoRecetaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.sinonimoRecetaService.actualizar(id, dto.valorCanonico, dto.tipoCoincidencia, dto.orden, usuario.id);
  }

  @Delete(":id")
  eliminar(@Param("id") id: string) {
    return this.sinonimoRecetaService.eliminar(id);
  }
}
