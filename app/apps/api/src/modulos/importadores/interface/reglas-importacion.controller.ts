import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { TipoServicio } from "@mym/shared-types";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { ReglaImportacionService } from "../application/regla-importacion.service";
import { DatosReglaImportacion } from "../domain/regla-importacion.repositorio";
import { GuardarReglaImportacionDto } from "./dto/guardar-regla-importacion.dto";

function aDatos(dto: GuardarReglaImportacionDto): DatosReglaImportacion {
  return {
    clienteId: dto.clienteId,
    tipoServicio: dto.tipoServicio,
    campoOrigen: dto.campoOrigen as DatosReglaImportacion["campoOrigen"],
    tipoCoincidencia: dto.tipoCoincidencia,
    valor: dto.valor,
    accion: dto.accion,
    campoDestino: dto.campoDestino as DatosReglaImportacion["campoDestino"],
    valorDestino: dto.valorDestino ?? "",
    orden: dto.orden ?? 0,
    activa: dto.activa ?? true,
  };
}

// Reglas de importación editables (decisión 2026-09-24) — mismos roles que
// ya operan la importación de Excel.
@Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
@Controller("reglas-importacion")
export class ReglasImportacionController {
  constructor(private reglaImportacionService: ReglaImportacionService) {}

  @Get()
  listar(@Query("clienteId") clienteId?: string, @Query("tipoServicio") tipoServicio?: TipoServicio) {
    return this.reglaImportacionService.listar({ clienteId, tipoServicio });
  }

  @Post()
  crear(@Body() dto: GuardarReglaImportacionDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.reglaImportacionService.crear(aDatos(dto), usuario.id);
  }

  @Put(":id")
  actualizar(
    @Param("id") id: string,
    @Body() dto: GuardarReglaImportacionDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.reglaImportacionService.actualizar(id, aDatos(dto), usuario.id);
  }

  @Delete(":id")
  eliminar(@Param("id") id: string) {
    return this.reglaImportacionService.eliminar(id);
  }
}
