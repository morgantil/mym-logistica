import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ZonasTarifariasService } from "../application/zonas-tarifarias.service";
import { ActualizarZonaTarifariaDto, AsignarLocalidadDto, CrearZonaTarifariaDto } from "./dto/zona-tarifaria.dto";

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
}
