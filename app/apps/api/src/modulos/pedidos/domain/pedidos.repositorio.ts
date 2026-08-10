import { CabaProvincia, EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";
import { Pedido, PedidoListado } from "./pedido";

export interface DatosCrearPedido {
  clienteId: string;
  destinatarioId: string;
  importacionId: string | null;
  numeroAfiliado: string;
  direccionOriginal: string;
  direccionUsada: string;
  localidad: string;
  cabaProvincia: CabaProvincia | null;
  fechaProgramada: Date;
  tipoServicio: TipoServicio;
  observaciones: string | null;
  productos: { codigo: string | null; descripcion: string; cantidad: number }[];
  zonaId: string | null;
  choferId: string | null;
  estadoSimpliroute: EstadoSimpliroute;
  estadoValidacion: EstadoValidacion;
}

export interface FiltroPedidos {
  clienteIds?: string[]; // resultado de PermisosClienteService — null/undefined = sin restricción
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface PaginaPedidos {
  datos: PedidoListado[];
  total: number;
}

export interface PedidosRepositorio {
  listar(filtro: FiltroPedidos, pagina: number, porPagina: number): Promise<PaginaPedidos>;
  contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>>;
  crear(datos: DatosCrearPedido): Promise<Pedido>;
  obtenerPorId(id: string): Promise<Pedido | null>;

  // §17 funcional: candidatos a "Revisión antes de enviar" — los que todavía
  // no se mandaron a SimpliRoute.
  listarPendientesDeEnvio(clienteIds?: string[]): Promise<PedidoListado[]>;

  // Ambos con bloqueo optimista: lanzan ConflictoVersionError (ver ese archivo)
  // si `version` no coincide con la fila actual — alguien más lo modificó primero.
  actualizarBultos(id: string, bultos: number, version: number): Promise<Pedido>;
  marcarEnviado(id: string, datos: { simplirouteId: string; version: number }): Promise<Pedido>;
}

export const PEDIDOS_REPOSITORIO = Symbol("PEDIDOS_REPOSITORIO");
