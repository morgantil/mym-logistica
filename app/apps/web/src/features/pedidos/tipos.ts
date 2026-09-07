import type { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";

export interface ProductoPedido {
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  // Nº de orden/ticket del sistema de origen (ej. Farmanet) para esta línea
  // puntual — puede diferir entre productos de un mismo pedido si vinieron
  // de órdenes de origen distintas agrupadas en la misma entrega.
  ticket: string | null;
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
  creadoEn: string;
  // SimpliRoute geocodificó la Visit con baja confianza (ej. "medium") al
  // enviar — null hasta el envío, o "no alert" si geocodificó bien.
  geocodeAlert: string | null;
}

// Espejo de CampoOrdenPedido (apps/api) — mismos ids que usan las columnas de
// la grilla. "productos" queda afuera: es un cálculo agregado, no ordenable
// con el mismo mecanismo que el resto (ver pedidos.repositorio.ts).
export type CampoOrdenPedido =
  | "cliente"
  | "estado"
  | "numero"
  | "afiliado"
  | "destinatario"
  | "telefono"
  | "direccion"
  | "localidad"
  | "fecha"
  | "fechaSubida"
  | "bultos"
  | "zona"
  | "chofer"
  | "validacion"
  | "simpliroute"
  | "observaciones";

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
