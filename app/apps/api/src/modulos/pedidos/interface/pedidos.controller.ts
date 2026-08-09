import { Controller, Get, Query } from "@nestjs/common";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { PedidosService } from "../application/pedidos.service";
import { ListarPedidosDto } from "./dto/listar-pedidos.dto";

@Controller("pedidos")
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  // Grilla principal — §14 funcional. Agrupación desde Excel (§7), envío a
  // SimpliRoute (§18) y carga de bultos (§16) quedan para cuando se resuelva el
  // módulo de importadores/simpliroute — ver README de esos módulos.
  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Query() query: ListarPedidosDto) {
    return this.pedidosService.listarParaUsuario(
      usuario.id,
      { estado: query.estado },
      query.pagina,
      query.porPagina,
    );
  }
}
