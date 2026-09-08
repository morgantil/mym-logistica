import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ZonasTarifariasService } from "../application/zonas-tarifarias.service";
import {
  ActualizarZonaTarifariaDto,
  AsignarLocalidadDto,
  AsignarPartidoDto,
  AsignarZonaSimpliRouteDto,
  CrearZonaTarifariaDto,
} from "./dto/zona-tarifaria.dto";

@Controller("zonas-tarifarias")
export class ZonasTarifariasController {
  constructor(private service: ZonasTarifariasService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Post()
  crear(@Body() dto: CrearZonaTarifariaDto) {
    return this.service.crear(dto.nombre);
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarZonaTarifariaDto) {
    return this.service.actualizar(id, dto);
  }

  // §10.2 funcional: mapeo Localidad → Cordón, configurable.
  @Get("localidades")
  listarMapeoLocalidades() {
    return this.service.listarMapeoLocalidades();
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Post("localidades")
  asignarLocalidad(@Body() dto: AsignarLocalidadDto) {
    return this.service.asignarLocalidad(dto.localidad, dto.zonaTarifariaId);
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Delete("localidades/:id")
  quitarLocalidad(@Param("id") id: string) {
    return this.service.quitarLocalidad(id);
  }

  // Mapeo Zona de SimpliRoute → Cordón — decisión 2026-08-26 (ver DOCUMENTO
  // TECNICO.md historial): alternativa más liviana al mapeo por localidad,
  // 11 zonas reales en vez de cientos de localidades.
  @Get("zonas-simpliroute")
  listarMapeoZonasSimpliRoute() {
    return this.service.listarMapeoZonasSimpliRoute();
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Post("zonas-simpliroute")
  asignarZonaSimpliRoute(@Body() dto: AsignarZonaSimpliRouteDto) {
    return this.service.asignarZonaSimpliRoute(dto.zonaSimpliRouteId, dto.zonaTarifariaId);
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Delete("zonas-simpliroute/:zonaSimpliRouteId")
  quitarZonaSimpliRoute(@Param("zonaSimpliRouteId", ParseIntPipe) zonaSimpliRouteId: number) {
    return this.service.quitarZonaSimpliRoute(zonaSimpliRouteId);
  }

  // Mapeo Partido/Municipio → Cordón — decisión 2026-09-08 (ver DOCUMENTO
  // TECNICO.md historial): más preciso que el de zonas de SimpliRoute
  // (esas cruzan varios partidos reales cada una).
  @Get("partidos")
  listarMapeoPartidos() {
    return this.service.listarMapeoPartidos();
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Post("partidos")
  asignarPartido(@Body() dto: AsignarPartidoDto) {
    return this.service.asignarPartido(dto.partido, dto.zonaTarifariaId);
  }

  @Roles(Rol.ADMINISTRACION, Rol.FACTURACION)
  @Delete("partidos/:partido")
  quitarPartido(@Param("partido") partido: string) {
    return this.service.quitarPartido(partido);
  }
}
