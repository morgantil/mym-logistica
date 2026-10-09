import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { JornadasChoferesService } from "../application/jornadas-choferes.service";
import { FiltroJornadasDto } from "./dto/filtro-jornadas.dto";
import { GuardarJornadaDto } from "./dto/guardar-jornada.dto";

// Jornadas de chofer (item 4.4 TEMAS_PENDIENTES.md) — mismos roles que el
// resto de Facturación/Transportistas.
@Roles(Rol.FACTURACION, Rol.ADMINISTRACION)
@Controller("jornadas-choferes")
export class JornadasChoferesController {
  constructor(private jornadasChoferesService: JornadasChoferesService) {}

  @Get()
  listar(@Query() query: FiltroJornadasDto) {
    return this.jornadasChoferesService.listar({
      choferId: query.choferId,
      fechaDesde: query.fechaDesde ? new Date(`${query.fechaDesde}T00:00:00.000Z`) : undefined,
      fechaHasta: query.fechaHasta
        ? new Date(new Date(`${query.fechaHasta}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000)
        : undefined,
    });
  }

  // Crea o reemplaza la jornada de ese chofer en esa fecha (upsert por la
  // constraint única choferId+fecha) — no hay un ":id" en la URL porque el
  // front no necesita conocerlo de antemano, siempre manda chofer+fecha.
  @Post()
  guardar(@Body() dto: GuardarJornadaDto) {
    return this.jornadasChoferesService.guardar({
      choferId: dto.choferId,
      fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
      horaInicio: dto.horaInicio ?? null,
      horaFin: dto.horaFin ?? null,
    });
  }

  @Delete(":id")
  eliminar(@Param("id") id: string) {
    return this.jornadasChoferesService.eliminar(id);
  }
}
