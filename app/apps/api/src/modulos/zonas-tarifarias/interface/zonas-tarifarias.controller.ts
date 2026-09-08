import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ZonasTarifariasService } from "../application/zonas-tarifarias.service";
import {
  ActualizarZonaTarifariaDto,
  AsignarLocalidadDto,
  AsignarPartidoDto,
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

  // Mapeo Partido/Municipio → Cordón — decisión 2026-09-08 (ver DOCUMENTO
  // TECNICO.md historial): reemplazó al mapeo por Zona de SimpliRoute que
  // existía antes (sacado el mismo día — esas zonas cruzan varios partidos
  // reales cada una, daban resultados imprecisos).
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
