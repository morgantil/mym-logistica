import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ZonasChoferesService } from "../application/zonas-choferes.service";
import { ActualizarChoferDto, CrearChoferDto } from "./dto/chofer.dto";
import { ActualizarVehiculoDto, CrearVehiculoDto } from "./dto/vehiculo.dto";

@Controller()
export class ZonasChoferesController {
  constructor(private service: ZonasChoferesService) {}

  // Zonas es de solo lectura acá — SimpliRoute no publica alta/edición de
  // Zonas en su API pública, cualquier cambio se sigue haciendo ahí.
  @Get("zonas")
  listarZonas() {
    return this.service.listarZonas();
  }

  @Get("choferes")
  listarChoferes() {
    return this.service.listarChoferes();
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("choferes")
  crearChofer(@Body() dto: CrearChoferDto) {
    return this.service.crearChofer(dto);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("choferes/:id")
  actualizarChofer(@Param("id", ParseIntPipe) id: number, @Body() dto: ActualizarChoferDto) {
    return this.service.actualizarChofer(id, dto);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Delete("choferes/:id")
  eliminarChofer(@Param("id", ParseIntPipe) id: number) {
    return this.service.eliminarChofer(id);
  }

  @Get("vehiculos")
  listarVehiculos() {
    return this.service.listarVehiculos();
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("vehiculos")
  crearVehiculo(@Body() dto: CrearVehiculoDto) {
    return this.service.crearVehiculo(dto);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("vehiculos/:id")
  actualizarVehiculo(@Param("id", ParseIntPipe) id: number, @Body() dto: ActualizarVehiculoDto) {
    return this.service.actualizarVehiculo(id, dto);
  }

  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Delete("vehiculos/:id")
  eliminarVehiculo(@Param("id", ParseIntPipe) id: number) {
    return this.service.eliminarVehiculo(id);
  }

  // Botón "Sincronizar ahora" del frontend — el resto de las lecturas se
  // refrescan solas cuando el cache está vencido (ZonasChoferesService).
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("simpliroute-cache/sincronizar")
  sincronizar() {
    return this.service.sincronizar();
  }
}
