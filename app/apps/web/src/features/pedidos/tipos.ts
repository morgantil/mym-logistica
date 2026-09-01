import type { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";

export interface ProductoPedido {
  codigo: string | null;
  descripcion: string;
  cantidad: number;
}

// Espejo de PedidoListado (apps/api/src/modulos/pedidos/domain/pedido.ts) — lo
// que devuelven GET /pedidos y GET /pedidos/revision. Trae más campos crudos de
// Prisma de los que se listan acá (la API no hace `select` explícito todavía);
// esta interfaz solo declara los que la grilla realmente usa.
export interface PedidoListado {
  id: string;
  numero: number;
  clienteId: string;
  destinatarioId: string;
  numeroAfiliado: string;
  direccionUsada: string;
  localidad: string;
  zonaTarifariaId: string | null;
  fechaProgramada: string;
  tipoServicio: TipoServicio;
  estado: EstadoPedido;
  estadoValidacion: EstadoValidacion;
  estadoSimpliroute: EstadoSimpliroute;
  zonaId: string | null;
  choferId: string | null;
  bultos: number | null;
  observaciones: string | null;
  etiquetaImpresaEn: string | null;
  version: number;
  clienteNombre: string;
  destinatarioNombre: string;
  destinatarioTelefono: string | null;
  zonaNombre: string | null;
  choferNombre: string | null;
  productos: ProductoPedido[];
}

export interface PaginaPedidos {
  datos: PedidoListado[];
  total: number;
}

// Respuesta de GET /pedidos/revision — §17 funcional.
export interface PedidoConErroresBloqueantes {
  pedido: PedidoListado;
  erroresBloqueantes: string[];
}

// Respuesta de POST /pedidos/enviar-simpliroute — §18 funcional.
export interface ResultadoEnvioMasivo {
  enviados: string[];
  errores: { pedidoId: string; errores: string[] }[];
}
