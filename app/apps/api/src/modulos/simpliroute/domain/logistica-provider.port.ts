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
  // Decisión 2026-10-04 (reunión con el cliente): "Carga 1" (campo `load` de
  // la Visit) marca pañales — true para pedidos PANAL, false/omitido para
  // medicamentos (sin instrucción confirmada para esos todavía). Reemplaza
  // el uso anterior de `load` para mandar la cantidad de bultos.
  cargaPanal: boolean;
  // "Carga 3" (campo `load_3`) — true solo si el Cliente del pedido tiene
  // Cliente.usaCarga3 activado (hoy: SACEIP SOLIS, ver schema.prisma).
  cargaEspecial: boolean;
  // N.º de pedido interno — reunión 2026-10-23: se manda en `notes` (antes
  // del texto de observaciones) para que el chofer pueda identificar el
  // pedido de un vistazo en su celular sin leer todo el texto largo.
  numero: number;
  // Campos nuevos de la reunión 2026-10-23, todos opcionales — valores
  // fijos por cliente (Cliente.tipoVisitaSimpliRoute/notaSimpliRoute/
  // sellerSimpliRoute), más `referencia` (el remito, solo si
  // Cliente.remitoHabilitado — ver PedidosService.enviarASimpliRoute).
  tipoVisita: string | null;
  notaCliente: string | null;
  seller: string | null;
  referencia: string | null;
}

export interface ResultadoEnvio {
  idExterno: string;
  // SimpliRoute geocodifica la Visit con la dirección enviada en el mismo
  // momento de crearla (confirmado con pruebas reales 2026-09-03) — estas
  // coordenadas son la ubicación real de la entrega, independiente de las
  // que tenga guardadas el Client (que puede estar desactualizado). Null si
  // SimpliRoute no pudo geocodificar nada.
  latitud: number | null;
  longitud: number | null;
  // Confianza de esa geocodificación tal cual la informa SimpliRoute (ej.
  // "no alert" | "medium") — sin catálogo cerrado documentado, se guarda tal
  // cual viene.
  geocodeAlert: string | null;
}

export interface EstadoVisita {
  // Valor crudo de SimpliRoute: "pending" | "entered" | "completed" | "failed"
  // (confirmado vía OPTIONS contra la cuenta real 2026-08-28) — el mapeo a
  // EstadoPedido propio se hace en el módulo de pedidos, no acá.
  estado: string;
  // `checkout_time` de la Visit — la marca real de cuándo el chofer completó
  // la entrega desde su app. Null si todavía no se registró (incluye el caso
  // de una Visit marcada completed/failed manualmente, sin checkout real).
  fechaEntrega: Date | null;
  // Campo `driver` de la Visit (Integer ID) — confirmado en la documentación
  // oficial (Documentacion simpliroute/02, tabla de campos del Visit Object).
  // Decisión 2026-10-04: un despachante puede reasignar la Visit a otro
  // chofer directo en SimpliRoute después de enviada — esto es lo que
  // permite a PedidosService.sincronizarEstados detectarlo y actualizar la
  // grilla sola, sin tener que borrar el pedido. Null si la Visit todavía no
  // tiene chofer asignado.
  choferIdExterno: number | null;
  // Campo `route` de la Visit (UUID de la Route, o null) — confirmado
  // empíricamente 2026-10-26 contra la cuenta real: borrar una Route en
  // SimpliRoute NO borra ni devuelve 404 en sus Visits, las deja existiendo
  // con `route: null` y `status` sin cambiar (sigue "pending" para siempre).
  // `DELETE /v1/routes/routes/{id}/` está marcado NOT_DOCUMENTED en la
  // documentación oficial — no asumir qué hace sin verificarlo, como pasó acá
  // (el primer intento asumía 404, que nunca ocurre en este caso real). Ver
  // PedidosService.sincronizarEstados: "pending" + sin ruta = la Visit se
  // cayó de su ruta, hay que revertir el pedido, no tratarlo como "pendiente
  // sin cambios".
  tieneRuta: boolean;
}

// §12 funcional (Zona): "deberá poder consultarse desde la información
// disponible de SimpliRoute". Decisión 2026-08-25/26 (DOCUMENTO TECNICO.md
// historial): SimpliRoute es la fuente de verdad para Zonas, Choferes y
// Vehículos. Zonas es de solo lectura pública en la API (sin
// POST/PUT/PATCH/DELETE) — `poligono` viene tal cual lo devuelve
// `GET /v1/zones/`, el point-in-polygon para resolver a qué zona pertenece
// una dirección es lógica nuestra (ver zonas-choferes/domain/punto-en-poligono.ts),
// SimpliRoute no expone un endpoint para eso.
export interface CoordenadaProveedor {
  lat: number;
  lng: number;
}

export interface ZonaProveedor {
  id: number;
  nombre: string;
  habilitada: boolean;
  dias: string[];
  poligono: CoordenadaProveedor[];
  vehiculosIds: number[];
}

// Choferes/Vehículos SÍ tienen CRUD completo publicado
// (`/v1/accounts/drivers/`, `/v1/routes/vehicles/`) — se leen y también se
// escriben contra SimpliRoute, nunca solo contra una copia local.
export interface ChoferProveedor {
  id: number;
  nombre: string;
  username: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
}

export interface DatosChofer {
  nombre: string;
  username: string;
  telefono?: string | null;
  email?: string | null;
  // Requerido al crear. Al actualizar, SimpliRoute solo documenta PUT (no
  // PATCH) para Users, con `password` en el ejemplo de body — no está
  // documentado si omitirlo preserva la contraseña existente
  // (Documentacion simpliroute/04, "PUT semantics = NOT_DOCUMENTED" para
  // Users). El adapter HTTP lo omite del body si no se manda, pero esto
  // queda como NEEDS_VERIFICATION hasta probarlo contra la cuenta real.
  password?: string;
}

export interface VehiculoProveedor {
  id: number;
  nombre: string;
  patente: string | null;
  choferPredeterminadoId: number | null;
  estado: string;
}

export interface DatosVehiculo {
  nombre: string;
  patente?: string | null;
  choferPredeterminadoId?: number | null;
}

export interface LogisticaProviderPort {
  // §9 funcional — por afiliado/destinatario, null si "No encontrado en SimpliRoute" (§10).
  buscarDestinatarioPorAfiliado(numeroAfiliado: string): Promise<DestinatarioEnProveedor | null>;

  // §18 funcional.
  enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoEnvio>;

  // Decisión 2026-10-04, corregida 2026-10-07 (bug real encontrado en
  // reunión, confirmado contra la cuenta real de SimpliRoute): asigna la
  // Visit ya creada a un Conductor/Vehículo puntual. La primera versión
  // mandaba `driver`/`vehicle` directo por PATCH a la Visit — la API
  // responde 200 pero IGNORA esos dos campos en silencio, nunca quedan
  // guardados (confirmado probando contra la cuenta real). El mecanismo real
  // (confirmado contra la cuenta real, ver `obtenerOCrearRuta` en el
  // adapter): la Visit se vincula a una Route (`PATCH visit.route`), y el
  // conductor/vehículo salen de ESA Route, no de campos propios de la Visit
  // — hace falta una Route (dentro de un Plan) para el chofer/vehículo/fecha,
  // creándola si todavía no existe ese día. Se llama SEPARADO de
  // enviarPedido porque la zona/chofer recién se resuelve con la coordenada
  // real que devuelve la creación de la Visit (ver
  // PedidosService.enviarASimpliRoute) — no se puede saber antes.
  asignarChoferVehiculo(
    idExterno: string,
    choferIdExterno: number,
    vehiculoIdExterno: number,
    fecha: Date,
  ): Promise<void>;

  // §19 funcional — el mapeo a EstadoPedido propio se hace en el módulo de pedidos,
  // no acá: este puerto solo devuelve el estado crudo tal cual lo informa el proveedor.
  // `null` = la Visit ya no existe en SimpliRoute (404 — típicamente porque se
  // borró la ruta/plan que la contenía) — ver PedidosService.sincronizarEstados,
  // que en ese caso revierte el pedido a NO_ENVIADO en vez de tratarlo como error.
  consultarEstado(idExterno: string): Promise<EstadoVisita | null>;

  // §12-§13 funcional — catálogos que ZonasChoferesService cachea localmente
  // y refresca periódicamente (nunca se consultan en vivo en cada request).
  listarZonas(): Promise<ZonaProveedor[]>;
  listarChoferes(): Promise<ChoferProveedor[]>;
  listarVehiculos(): Promise<VehiculoProveedor[]>;

  crearChofer(datos: DatosChofer): Promise<ChoferProveedor>;
  actualizarChofer(id: number, datos: DatosChofer): Promise<ChoferProveedor>;
  eliminarChofer(id: number): Promise<void>;

  crearVehiculo(datos: DatosVehiculo): Promise<VehiculoProveedor>;
  actualizarVehiculo(id: number, datos: DatosVehiculo): Promise<VehiculoProveedor>;
  eliminarVehiculo(id: number): Promise<void>;
}

export const LOGISTICA_PROVIDER = Symbol("LOGISTICA_PROVIDER");
