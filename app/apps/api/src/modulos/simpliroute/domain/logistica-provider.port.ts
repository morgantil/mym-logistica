// Puerto de integración con el proveedor de logística (hoy: SimpliRoute).
// El resto de la app depende de ESTA interfaz, nunca de SimpliRoute directamente —
// así el día que se resuelvan las validaciones técnicas pendientes (DOCUMENTO
// TECNICO.md sección 4), se agrega el adapter real sin tocar nada más.

export interface DestinatarioEnProveedor {
  idExterno: string;
  nombre: string;
  direccion: string;
  localidad: string;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface PedidoParaEnviar {
  pedidoId: string;
  destinatarioIdExterno: string;
  destinatarioNombre: string;
  destinatarioTelefono: string | null;
  direccion: string;
  fechaProgramada: Date;
  bultos: number | null;
  observaciones: string | null;
}

export interface ResultadoEnvio {
  idExterno: string;
}

export interface LogisticaProviderPort {
  // §9 funcional — por afiliado/destinatario, null si "No encontrado en SimpliRoute" (§10).
  buscarDestinatarioPorAfiliado(numeroAfiliado: string): Promise<DestinatarioEnProveedor | null>;

  // §12 funcional: "La zona deberá obtenerse según la dirección y/o coordenadas
  // ... deberá poder consultarse desde la información disponible de SimpliRoute
  // o configurarse en el sistema." CÓMO exactamente se obtiene está listado como
  // validación técnica pendiente (DOCUMENTO TECNICO.md sección 4, ítem 4) — el
  // mock devuelve null siempre, lo cual hoy es lo correcto: no inventamos una
  // zona, se cae al fallback de ZonasChoferesService ("Zona sin identificar").
  obtenerZonaSugerida(destinatario: DestinatarioEnProveedor): Promise<string | null>;

  // §18 funcional.
  enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoEnvio>;

  // §19 funcional — el mapeo a EstadoPedido propio se hace en el módulo de pedidos,
  // no acá: este puerto solo devuelve el estado crudo tal cual lo informa el proveedor.
  consultarEstado(idExterno: string): Promise<string>;
}

export const LOGISTICA_PROVIDER = Symbol("LOGISTICA_PROVIDER");
