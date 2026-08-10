import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ClientesService } from "../application/clientes.service";
import { ActualizarClienteDto } from "./dto/actualizar-cliente.dto";
import { CrearClienteDto } from "./dto/crear-cliente.dto";

@Controller("clientes")
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  // `incluirInactivos=true` es lo que usa la pantalla de administración de
  // Clientes para poder reactivar uno — el resto de la app (selector del
  // importador, permisos por cliente) sigue viendo solo los activos por defecto.
  @Get()
  listar(@Query("incluirInactivos") incluirInactivos?: string) {
    return incluirInactivos === "true"
      ? this.clientesService.listarTodos()
      : this.clientesService.listarActivos();
  }

  @Get(":id")
  buscarPorId(@Param("id") id: string) {
    return this.clientesService.buscarPorId(id);
  }

  @Roles(Rol.ADMINISTRACION)
  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return this.clientesService.crear(dto);
  }

  // Cubre editar nombre/patrones y activar/desactivar (§ "borrado lógico" no
  // aplica acá: desactivar un cliente es un estado de negocio reversible, no
  // un borrado — el cliente sigue viéndose en pedidos/facturación históricos).
  @Roles(Rol.ADMINISTRACION)
  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarClienteDto) {
    return this.clientesService.actualizar(id, dto);
  }
}
