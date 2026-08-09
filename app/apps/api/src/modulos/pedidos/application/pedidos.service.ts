import { Inject, Injectable } from "@nestjs/common";
import { PermisosClienteService } from "../../../common/permisos/permisos-cliente.service";
import { FiltroPedidos, PEDIDOS_REPOSITORIO, PedidosRepositorio } from "../domain/pedidos.repositorio";

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDOS_REPOSITORIO) private readonly repositorio: PedidosRepositorio,
    private permisosCliente: PermisosClienteService,
  ) {}

  // La grilla principal (§14 funcional) siempre pasa por acá, así que el filtro de
  // "permisos por cliente" queda aplicado en un solo lugar para todo el sistema.
  async listarParaUsuario(
    usuarioId: string,
    filtro: Omit<FiltroPedidos, "clienteIds">,
    pagina: number,
    porPagina: number,
  ) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.listar(
      { ...filtro, clienteIds: clienteIds ?? undefined },
      pagina,
      porPagina,
    );
  }

  async contarPorEstadoParaUsuario(usuarioId: string) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.contarPorEstado(clienteIds ?? undefined);
  }
}
