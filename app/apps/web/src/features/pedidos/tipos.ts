import type {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  FormatoRemito,
  PrioridadPedido,
  TipoEnvase,
  TipoServicio,
} from "@mym/shared-types";

export interface ProductoPedido {
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  // Nº de orden/ticket del sistema de origen (ej. Farmanet) para esta línea
  // puntual — puede diferir entre productos de un mismo pedido si vinieron
  // de órdenes de origen distintas agrupadas en la misma entrega.
  ticket: string | null;
  // Solo medicamentos: Bolsa o Bulto de esta línea.
  tipoEnvase: TipoEnvase | null;
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
  direccionOriginal: string; // tal cual vino del Excel — ver resolverAlertaDireccion
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
  // Campo libre editable por el operador en cualquier momento — decisión
  // 2026-10-04, separado de `observaciones` (que viene del Excel).
  comentario: string | null;
  // Qué ruta de SimpliRoute le corresponde (ej. "Ruta 1") — decisión
  // 2026-10-04, cargada a mano, ver RutaCelda.
  ruta: string | null;
  // Decisión 2026-09-16: true bloquea el envío hasta resolverse (ver
  // ResolverDireccionDialog).
  alertaDireccionPendiente: boolean;
  etiquetaImpresaEn: string | null;
  // Decisión 2026-09-24: Normal/Urgente/Crítica — pinta la fila de la grilla.
  prioridad: PrioridadPedido;
  // Solo medicamentos (null para pañales). Si un pedido agrupa varias
  // líneas con valores distintos, vienen separados por " / ".
  remito: string | null;
  receta: string | null;
  recetaResuelta: string | null;
  tipoPedido: string | null;
  retiroDeReceta: string | null;
  tiempoDeEntrega: string | null;
  horarioEntrega: string | null;
  // Cuántos pedidos del sistema de origen (Nº de ticket distintos) se
  // agruparon en este Pedido — decisión 2026-09-11, caso real Farmapal.
  cantidadPedidoOriginal: number;
  version: number;
  clienteNombre: string;
  // Null = el cliente no tiene remito preimpreso configurado (pantalla Clientes).
  clienteFormatoRemito: FormatoRemito | null;
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
  | "observaciones"
  | "remito"
  | "receta"
  | "tipoPedido"
  | "tiempoDeEntrega"
  | "retiroDeReceta"
  | "horarioEntrega"
  | "prioridad";

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

// Respuesta de POST /pedidos/eliminar — decisión 2026-09-11.
export interface ResultadoEliminacionMasiva {
  eliminados: string[];
  errores: { pedidoId: string; errores: string[] }[];
}
