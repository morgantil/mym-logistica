import { Controller, Get } from "@nestjs/common";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { PedidosService } from "../../pedidos/application/pedidos.service";

// DOCUMENTO TECNICO.md, candidata #6: "endpoints de agregación (BE) desde ahora,
// pantalla (FE) después". Se arranca con pedidos-por-estado; el resto de las métricas
// (entregas fallidas de la semana, etc.) se agregan acá a medida que se necesiten,
// sin tener que tocar el modelo de datos.
@Controller("dashboard")
export class DashboardController {
  constructor(private pedidosService: PedidosService) {}

  @Get("pedidos-por-estado")
  pedidosPorEstado(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.contarPorEstadoParaUsuario(usuario.id);
  }
}
