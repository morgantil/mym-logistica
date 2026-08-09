import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ClientesService } from "../application/clientes.service";
import { CrearClienteDto } from "./dto/crear-cliente.dto";

@Controller("clientes")
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Get()
  listar() {
    return this.clientesService.listarActivos();
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
}
