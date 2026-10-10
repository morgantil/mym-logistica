import { Body, Controller, Get, Param, ParseEnumPipe, Patch } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { TipoReporte } from "@mym/shared-types";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { LimitesReporteService } from "../application/limites-reporte.service";
import { ActualizarLimiteReporteDto } from "./dto/actualizar-limite-reporte.dto";

// Pedido en reunión 2026-10-10: tope de días de cada reporte Excel, editable
// por Administración — ver comentario en schema.prisma (modelo
// LimiteReporte). La lectura queda abierta a cualquier autenticado (mismo
// criterio que /choferes/zonas — no es sensible, y las pantallas que
// descargan reportes necesitan saber el tope vigente aunque no puedan
// cambiarlo); solo PATCH queda restringido a Administración.
@Controller("limites-reporte")
export class LimitesReporteController {
  constructor(private limitesReporteService: LimitesReporteService) {}

  @Get()
  listar() {
    return this.limitesReporteService.listar();
  }

  @Roles(Rol.ADMINISTRACION)
  @Patch(":reporte")
  actualizar(
    @Param("reporte", new ParseEnumPipe(TipoReporte)) reporte: TipoReporte,
    @Body() dto: ActualizarLimiteReporteDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.limitesReporteService.actualizar(reporte, dto.maxDias, usuario.id);
  }
}
