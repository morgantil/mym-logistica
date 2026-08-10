import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { PedidosService } from "../application/pedidos.service";
import { ActualizarBultosDto } from "./dto/actualizar-bultos.dto";
import { EnviarSimpliRouteDto } from "./dto/enviar-simpliroute.dto";
import { ListarPedidosDto } from "./dto/listar-pedidos.dto";

@Controller("pedidos")
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  // Grilla principal — §14 funcional.
  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Query() query: ListarPedidosDto) {
    return this.pedidosService.listarParaUsuario(
      usuario.id,
      { estado: query.estado },
      query.pagina,
      query.porPagina,
    );
  }

  // §17 funcional: "Revisión antes de enviar" — cada pedido viene con sus
  // motivos bloqueantes (lista vacía = ya se puede enviar).
  @Get("revision")
  revisarPendientesDeEnvio(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.revisarPendientesDeEnvio(usuario.id);
  }

  // §16 funcional: carga de bultos desde la grilla — rol Logística.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/bultos")
  actualizarBultos(@Param("id") id: string, @Body() dto: ActualizarBultosDto) {
    return this.pedidosService.actualizarBultos(id, dto.bultos, dto.version);
  }

  // §18 funcional: envío a SimpliRoute — rol Operaciones. Un pedido inválido
  // no frena a los demás, ver PedidosService.enviarASimpliRoute.
  @Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
  @Post("enviar-simpliroute")
  enviarASimpliRoute(@Body() dto: EnviarSimpliRouteDto) {
    return this.pedidosService.enviarASimpliRoute(dto.pedidoIds);
  }
}
