import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ZonasChoferesService } from "../application/zonas-choferes.service";
import { ActualizarChoferDto, CrearChoferDto } from "./dto/chofer.dto";
import { ActualizarZonaDto, AsignarChoferDto, CrearZonaDto } from "./dto/zona.dto";

@Controller()
export class ZonasChoferesController {
  constructor(private service: ZonasChoferesService) {}

  // `conChofer=true` es lo que usa la pantalla de administración para mostrar
  // qué chofer tiene asignado cada zona — el resto de la app (ej. selects
  // simples) sigue viendo la lista plana.
  @Get("zonas")
  listarZonas(@Query("conChofer") conChofer?: string) {
    return conChofer === "true" ? this.service.listarZonasConChofer() : this.service.listarZonas();
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("zonas")
  crearZona(@Body() dto: CrearZonaDto) {
    return this.service.crearZona(dto.nombre);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("zonas/:id")
  actualizarZona(@Param("id") id: string, @Body() dto: ActualizarZonaDto) {
    return this.service.actualizarZona(id, dto.nombre);
  }

  // §12-§13 funcional: asignar (o quitar, con choferId null) el chofer de una zona.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("zonas/:id/chofer")
  asignarChofer(@Param("id") id: string, @Body() dto: AsignarChoferDto) {
    return this.service.asignarChofer(id, dto.choferId ?? null);
  }

  @Get("choferes")
  listarChoferes(@Query("incluirInactivos") incluirInactivos?: string) {
    return incluirInactivos === "true"
      ? this.service.listarTodosLosChoferes()
      : this.service.listarChoferes();
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("choferes")
  crearChofer(@Body() dto: CrearChoferDto) {
    return this.service.crearChofer(dto.nombre);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("choferes/:id")
  actualizarChofer(@Param("id") id: string, @Body() dto: ActualizarChoferDto) {
    return this.service.actualizarChofer(id, dto);
  }
}
