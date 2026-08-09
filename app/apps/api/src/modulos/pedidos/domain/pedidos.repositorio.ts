import { EstadoPedido } from "@mym/shared-types";
import { Pedido } from "./pedido";

export interface FiltroPedidos {
  clienteIds?: string[]; // resultado de PermisosClienteService — null/undefined = sin restricción
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface PaginaPedidos {
  datos: Pedido[];
  total: number;
}

export interface PedidosRepositorio {
  listar(filtro: FiltroPedidos, pagina: number, porPagina: number): Promise<PaginaPedidos>;
  contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>>;
}

export const PEDIDOS_REPOSITORIO = Symbol("PEDIDOS_REPOSITORIO");
