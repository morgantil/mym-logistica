import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ChoferProveedor,
  DatosChofer,
  DatosVehiculo,
  DestinatarioEnProveedor,
  EstadoVisita,
  LogisticaProviderPort,
  PedidoParaEnviar,
  ResultadoEnvio,
  VehiculoProveedor,
  ZonaProveedor,
} from "../domain/logistica-provider.port";

const BASE_URL = "https://api.simpliroute.com";

// Tiempo de Servicio confirmado por el cliente (reunión 02/10/2026, Pablo
// Renzo, captura real de una Visit corregida a mano): fijo para todos los
// envíos, formato HH:mm:ss tal como documenta el campo `duration` del Visit
// Object (Documentacion simpliroute/02).
const DURACION_SERVICIO_FIJA = "00:02:00";

// SimpliRoute no publica un envelope de error único para toda la API
// (Documentacion simpliroute/01, "Regla sobre errores") ni un status HTTP de
// éxito garantizado por endpoint — se revisa 2xx/no-2xx, se intenta parsear
// JSON, y si el body no es JSON se preserva crudo en el mensaje.
export class SimplirouteHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly cuerpo: unknown,
  ) {
    super(`SimpliRoute respondió ${status}: ${typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)}`);
  }
}

// Varios endpoints de Visits/Clients devuelven el resultado envuelto en un
// array incluso para un solo recurso (ej. GET retrieve individual de Visit —
// Documentacion simpliroute/02; GET/POST de Clients — Documentacion
// simpliroute/05, "Root: Array"). Tolerante en lectura en vez de asumir una
// sola forma.
function primerElemento<T>(datos: T | T[]): T {
  return Array.isArray(datos) ? datos[0] : datos;
}

function aNumero(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

interface ClientSimpliRoute {
  id: number | string;
  key: string;
  title: string;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  contact_phone?: string | null;
}

interface VisitaSimpliRoute {
  id: number | string;
  status: string;
  // Marca real de cuándo el chofer completó la entrega desde su app — queda
  // null si el status se cambió a mano (ej. una Visit de prueba) en vez de
  // por un checkout real. Confirmado vía OPTIONS + PATCH manual 2026-08-28.
  checkout_time?: string | null;
  // Geocodificadas por SimpliRoute al crear la Visit, con la dirección que
  // le mandamos — confirmado con pruebas reales 2026-09-03.
  latitude?: string | number | null;
  longitude?: string | number | null;
  geocode_alert?: string | null;
  // ID del conductor asignado — confirmado en la tabla de campos del Visit
  // Object (Documentacion simpliroute/02).
  driver?: number | null;
}

// GET /v1/zones/ — Documentacion simpliroute/04 §65-71. Solo lectura pública
// (sin POST/PUT/PATCH/DELETE) — de ahí que este adapter no tenga métodos de
// escritura para zonas.
interface ZonaSimpliRoute {
  id: number;
  name: string;
  coordinates: { lat: string; lng: string }[];
  vehicles: number[];
  enabled: boolean;
  schedules: string[];
}

// GET /v1/plans/{fecha}/vehicles/ — confirmado contra la cuenta real
// 2026-10-07 (ver obtenerOCrearRuta). Documentación oficial no detalla el
// shape (`NOT_DOCUMENTED`), este es el observado.
interface VehiculoConRutasSimpliRoute {
  id: number;
  routes: { id: string; plan_id: string }[];
}

// GET/PUT/PATCH /v1/accounts/drivers/ — Documentacion simpliroute/04 §44-59,
// pero verificado y corregido contra la cuenta real 2026-08-28 (el doc
// tenía varios puntos desactualizados/incorrectos):
// - Create/update van con el body como objeto plano, NO como array (el doc
//   oficial mostraba un array de un elemento; la API real rechaza eso con
//   "Expected a dictionary, but got list").
// - PUT/PATCH exigen re-enviar un flag de "user type" (`is_driver: true`)
//   aunque no cambie, si no tira "You must select user type".
// - DELETE no está implementado pese a listarse en el header Allow — devuelve
//   405. La baja real es un soft-delete: PATCH con `status: "deleted"`.
// - `status` (choices: active/deleted/blocked, descubierto vía OPTIONS) es la
//   fuente de verdad de si el chofer está activo — más confiable que
//   `blocked`, que en la práctica quedó en `false` incluso con status
//   "deleted".
interface ChoferSimpliRoute {
  id: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  is_driver: boolean;
  blocked?: boolean;
  status?: string;
}

// GET/POST/PATCH/PUT/DELETE /v1/routes/vehicles/ — Documentacion simpliroute/04
// §4-41. A diferencia de Drivers, el root de create/update es un objeto, no
// un array (ver ejemplo oficial "Crear Vehicle").
interface VehiculoSimpliRoute {
  id: number;
  name: string;
  license_plate: string | null;
  default_driver: number | string | null;
  status: string;
}

function mapearZona(zona: ZonaSimpliRoute): ZonaProveedor {
  return {
    id: zona.id,
    nombre: zona.name,
    habilitada: zona.enabled,
    dias: zona.schedules,
    poligono: zona.coordinates.map((c) => ({ lat: Number(c.lat), lng: Number(c.lng) })),
    vehiculosIds: zona.vehicles,
  };
}

function mapearChofer(chofer: ChoferSimpliRoute): ChoferProveedor {
  return {
    id: chofer.id,
    nombre: chofer.name,
    username: chofer.username,
    telefono: chofer.phone || null,
    email: chofer.email || null,
    activo: chofer.is_driver && chofer.blocked !== true && chofer.status !== "deleted",
  };
}

function mapearVehiculo(vehiculo: VehiculoSimpliRoute): VehiculoProveedor {
  return {
    id: vehiculo.id,
    nombre: vehiculo.name,
    patente: vehiculo.license_plate || null,
    choferPredeterminadoId: vehiculo.default_driver !== null ? Number(vehiculo.default_driver) : null,
    estado: vehiculo.status,
  };
}

// Adapter real — reemplaza a SimplirouteMockAdapter cuando SIMPLIROUTE_MOCK=false
// (ver simpliroute.module.ts). Construido contra el contrato documentado en
// `Documentacion simpliroute/` (14 archivos, apéndice del proyecto — ver
// DOCUMENTO TECNICO.md historial). Sin token real todavía: revisar el README
// de este módulo antes de darlo por probado en producción, tiene la lista de
// supuestos de mapeo que hay que confirmar apenas exista una cuenta real.
@Injectable()
export class SimplirouteHttpAdapter implements LogisticaProviderPort {
  private readonly logger = new Logger(SimplirouteHttpAdapter.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly depositoDireccion: string;
  private readonly depositoLatitud: number;
  private readonly depositoLongitud: number;

  // Nota: este provider se instancia siempre (Nest resuelve las dependencias
  // del factory de SimplirouteModule de forma eager), esté o no
  // SIMPLIROUTE_MOCK activo — por eso acá no se loguea nada todavía. El aviso
  // de "falta la API key" vive en el módulo, donde sí se sabe si este adapter
  // es el que realmente se va a usar.
  constructor(config: ConfigService) {
    this.apiUrl = config.get<string>("simpliroute.apiUrl") || BASE_URL;
    this.apiKey = config.get<string>("simpliroute.apiKey") ?? "";
    this.depositoDireccion = config.get<string>("simpliroute.depositoDireccion") ?? "CABA, Argentina";
    this.depositoLatitud = config.get<number>("simpliroute.depositoLatitud") ?? -34.6037;
    this.depositoLongitud = config.get<number>("simpliroute.depositoLongitud") ?? -58.3816;
  }

  private async solicitar<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
    const respuesta = await fetch(`${this.apiUrl}${ruta}`, {
      method: metodo,
      headers: {
        // Formato exacto de SimpliRoute: "Token <valor>", NO "Bearer <valor>".
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    const texto = await respuesta.text();
    let datos: unknown = texto;
    try {
      datos = texto ? JSON.parse(texto) : null;
    } catch {
      // body no-JSON — se preserva crudo, ver SimplirouteHttpError.
    }

    if (!respuesta.ok) {
      throw new SimplirouteHttpError(respuesta.status, datos);
    }
    return datos as T;
  }

  // §9-§10 funcional. Supuesto de mapeo (documentado, a confirmar con la
  // cuenta real — ver README): el padrón de destinatarios de MyM ya está
  // cargado en SimpliRoute como "Client master" (Documentacion
  // simpliroute/05, flujo recomendado ERP→Client Master), con `Client.key` =
  // nuestro `numeroAfiliado`. No debe frenar una importación completa si
  // falla (mismo criterio que GeorefArAdapter.clasificarCabaProvincia): un
  // error de red o de la cuenta no encontrada se trata igual que "No
  // encontrado en SimpliRoute" (§10), nunca como excepción no controlada.
  async buscarDestinatarioPorAfiliado(numeroAfiliado: string): Promise<DestinatarioEnProveedor | null> {
    try {
      const resultados = await this.solicitar<ClientSimpliRoute[]>(
        "GET",
        `/v1/accounts/clients/?key=${encodeURIComponent(numeroAfiliado)}`,
      );
      const encontrado = primerElemento(resultados);
      if (!encontrado) return null;

      return {
        idExterno: String(encontrado.id),
        nombre: encontrado.title,
        direccion: encontrado.address,
        // El Client de SimpliRoute no expone una localidad separada de la
        // dirección completa — no se inventa un valor. Hoy nadie persiste
        // este campo (ver DestinatariosService.sincronizarConSimpliRoute,
        // que solo usa idExterno/latitud/longitud de este objeto).
        localidad: "",
        telefono: encontrado.contact_phone ?? null,
        latitud: aNumero(encontrado.latitude),
        longitud: aNumero(encontrado.longitude),
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar SimpliRoute para el afiliado ${numeroAfiliado}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  // §18 funcional: crea una Visit. `load` = bultos es una interpretación —
  // SimpliRoute no define la unidad de `load` (depende de configuración de
  // cuenta, Documentacion simpliroute/05 §13) — a confirmar con la cuenta
  // real. Los errores se propagan a propósito: PedidosService.enviarASimpliRoute
  // ya los captura por pedido individual sin frenar al resto (§18).
  async enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoEnvio> {
    // Reunión 2026-10-23: antes `notes` era solo observaciones, ahora
    // arranca con el N.º de pedido interno (para que el chofer identifique
    // el pedido de un vistazo en el celular, sin leer todo el texto largo)
    // — SIN sacar observaciones todavía: el reemplazo total por un ID corto
    // quedó "requiere más debate" en la reunión, pendiente de validar con
    // las choferas (ver TEMAS_PENDIENTES.md §20.5). La nota fija del cliente
    // (Cliente.notaSimpliRoute) va en el medio.
    const notas = [`#${pedido.numero}`, pedido.notaCliente, pedido.observaciones]
      .filter((parte): parte is string => Boolean(parte))
      .join(" · ");

    const sellerUuid = pedido.seller ? await this.resolverSellerUuid(pedido.seller) : null;

    const body = [
      {
        title: pedido.destinatarioNombre,
        address: pedido.direccion,
        planned_date: pedido.fechaProgramada.toISOString().slice(0, 10),
        // Reunión 2026-10-23: el remito real cuando el cliente lo tiene
        // habilitado — si no, se mantiene el comportamiento de siempre
        // (nuestro propio id de pedido como referencia).
        reference: pedido.referencia ?? pedido.pedidoId,
        contact_name: pedido.destinatarioNombre,
        contact_phone: pedido.destinatarioTelefono ?? "",
        notes: notas,
        // Tiempo de Servicio confirmado por el cliente (reunión 02/10/2026,
        // Pablo Renzo): fijo 2 minutos para todos los envíos.
        duration: DURACION_SERVICIO_FIJA,
        // Decisión 2026-10-04: "Carga 1"/"Carga 3" — ver comentario en
        // PedidoParaEnviar (logistica-provider.port.ts). Reemplaza el uso
        // anterior de `load` para la cantidad de bultos.
        ...(pedido.cargaPanal ? { load: 1 } : {}),
        ...(pedido.cargaEspecial ? { load_3: 1 } : {}),
        ...(pedido.tipoVisita ? { visit_type: pedido.tipoVisita } : {}),
        ...(sellerUuid ? { seller: sellerUuid } : {}),
      },
    ];

    const respuesta = await this.solicitar<VisitaSimpliRoute | VisitaSimpliRoute[]>(
      "POST",
      "/v1/routes/visits/",
      body,
    );
    const visita = primerElemento(respuesta);
    return {
      idExterno: String(visita.id),
      latitud: aNumero(visita.latitude),
      longitud: aNumero(visita.longitude),
      geocodeAlert: visita.geocode_alert ?? null,
    };
  }

  // Reunión 2026-10-23: `seller` en SimpliRoute es un UUID que referencia un
  // Seller ya existente (GET /v1/sellers/), no texto libre — pero Pablo pide
  // cargarlo como texto libre por cliente. Se resuelve acá por nombre/alias
  // (sin distinguir mayúsculas). Sellers requiere habilitación de cuenta vía
  // Customer Success (documentado oficialmente) — si la cuenta no lo tiene
  // habilitado, o no hay coincidencia, se devuelve null y el envío sigue
  // igual sin ese campo (nunca bloquea el pedido por esto).
  private async resolverSellerUuid(nombreOAlias: string): Promise<string | null> {
    try {
      const sellers = await this.solicitar<{ id: string; name: string; alias: string }[]>(
        "GET",
        "/v1/sellers/",
      );
      const buscado = nombreOAlias.trim().toLowerCase();
      const encontrado = sellers.find(
        (s) => s.name?.toLowerCase() === buscado || s.alias?.toLowerCase() === buscado,
      );
      return encontrado?.id ?? null;
    } catch (error) {
      this.logger.warn(
        `No se pudo resolver el seller "${nombreOAlias}" (¿Sellers habilitado en la cuenta?): ${
          error instanceof Error ? error.message : "error desconocido"
        }`,
      );
      return null;
    }
  }

  // Bug real 2026-10-07 (reunión, confirmado contra la cuenta real):
  // `driver`/`vehicle` de la Visit están documentados como campos del Visit
  // Object, pero un PATCH directo sobre ellos devuelve 200 y los IGNORA en
  // silencio — nunca quedan guardados. El mecanismo real, confirmado paso a
  // paso contra la cuenta real (crear Plan → crear Route con vehicle/driver
  // → PATCH visit.route): el conductor/vehículo de una Visit salen de la
  // Route a la que está vinculada, no de campos propios. Acá se busca (o
  // crea, si todavía no existe ese chofer/vehículo/fecha) la Route y se
  // vincula la Visit a ella.
  async asignarChoferVehiculo(
    idExterno: string,
    choferIdExterno: number,
    vehiculoIdExterno: number,
    fecha: Date,
  ): Promise<void> {
    const rutaId = await this.obtenerOCrearRuta(choferIdExterno, vehiculoIdExterno, fecha);
    await this.solicitar<void>("PATCH", `/v1/routes/visits/${encodeURIComponent(idExterno)}/`, { route: rutaId });
  }

  // `GET /v1/plans/{fecha}/vehicles/` devuelve, por vehículo, las Routes que
  // ya tiene ese día (`routes: [{id, plan_id}]`) — se reusa la primera si
  // existe (un chofer puede tener varios pedidos el mismo día, todos van a
  // la misma Route) en vez de crear una nueva cada vez. Si no existe
  // ninguna, se crea una Route nueva — pero DENTRO del Plan del día si ya
  // hay uno (de CUALQUIER otro vehículo), no uno nuevo por vehículo. Bug
  // real reportado 2026-10-21 (reunión, Pablo Renzo): antes esta función
  // creaba un Plan nuevo cada vez que un vehículo distinto necesitaba su
  // primera Route del día, así que un día con pedidos para 3 choferes
  // terminaba con 3 Planes separados en SimpliRoute en vez de 1 solo Plan
  // con 3 Rutas adentro (el requerimiento real: "como la grilla 21 del día
  // 10", un único plan diario con todos los envíos). Solo se crea un Plan
  // mínimo (nombre único por timestamp, recomendado por la documentación
  // oficial) la PRIMERA vez que se necesita una Route ese día — después,
  // cualquier otro vehículo que necesite Route ese mismo día se agrega
  // dentro del mismo Plan ya existente. SimpliRoute exige punto de
  // inicio/fin para crear una Route aunque no tengamos un depósito real
  // configurado (ver simpliroute.depositoDireccion/Latitud/Longitud).
  private async obtenerOCrearRuta(choferIdExterno: number, vehiculoIdExterno: number, fecha: Date): Promise<string> {
    const fechaStr = fecha.toISOString().slice(0, 10);

    const vehiculos = await this.solicitar<VehiculoConRutasSimpliRoute[]>(
      "GET",
      `/v1/plans/${fechaStr}/vehicles/`,
    );
    const rutaExistente = vehiculos.find((v) => v.id === vehiculoIdExterno)?.routes?.[0];
    if (rutaExistente) return rutaExistente.id;

    // Plan de CUALQUIER vehículo que ya tenga una Route ese día — se reusa
    // en vez de crear uno nuevo, así todas las Rutas del día quedan juntas
    // en un único Plan.
    const planIdExistente = vehiculos.find((v) => v.routes?.[0])?.routes[0].plan_id;
    const planId =
      planIdExistente ??
      (
        await this.solicitar<{ id: string }>("POST", "/v1/plans/create-plan/", {
          name: `Plan MyM ${fechaStr} ${Date.now()}`,
          start_date: fechaStr,
          end_date: fechaStr,
        })
      ).id;

    const ruta = await this.solicitar<{ id: string }>("POST", "/v1/routes/routes/", {
      vehicle: vehiculoIdExterno,
      driver: choferIdExterno,
      planned_date: fechaStr,
      plan: planId,
      estimated_time_start: "08:00:00",
      estimated_time_end: "18:00:00",
      location_start_address: this.depositoDireccion,
      location_start_latitude: this.depositoLatitud,
      location_start_longitude: this.depositoLongitud,
      location_end_address: this.depositoDireccion,
      location_end_latitude: this.depositoLatitud,
      location_end_longitude: this.depositoLongitud,
    });
    return ruta.id;
  }

  // §19 funcional — devuelve el estado crudo tal cual lo informa SimpliRoute;
  // el mapeo a EstadoPedido propio vive en el módulo de pedidos (ver puerto).
  async consultarEstado(idExterno: string): Promise<EstadoVisita | null> {
    try {
      const respuesta = await this.solicitar<VisitaSimpliRoute | VisitaSimpliRoute[]>(
        "GET",
        `/v1/routes/visits/${encodeURIComponent(idExterno)}/`,
      );
      const visita = primerElemento(respuesta);
      return {
        estado: visita.status,
        fechaEntrega: visita.checkout_time ? new Date(visita.checkout_time) : null,
        choferIdExterno: visita.driver ?? null,
      };
    } catch (error) {
      if (error instanceof SimplirouteHttpError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // §12 funcional. Solo lectura pública (Documentacion simpliroute/04 §65-71) —
  // ZonasChoferesService cachea el resultado, esto nunca se llama en cada
  // request de la app.
  async listarZonas(): Promise<ZonaProveedor[]> {
    const zonas = await this.solicitar<ZonaSimpliRoute[]>("GET", "/v1/zones/");
    return zonas.map(mapearZona);
  }

  async listarChoferes(): Promise<ChoferProveedor[]> {
    const choferes = await this.solicitar<ChoferSimpliRoute[]>("GET", "/v1/accounts/drivers/");
    return choferes.filter((c) => c.is_driver).map(mapearChofer);
  }

  // Body como objeto plano (no array) — verificado contra la cuenta real
  // 2026-08-28, ver comentario de ChoferSimpliRoute más arriba.
  async crearChofer(datos: DatosChofer): Promise<ChoferProveedor> {
    const body = {
      username: datos.username,
      name: datos.nombre,
      phone: datos.telefono ?? "",
      email: datos.email ?? "",
      is_admin: false,
      is_driver: true,
      password: datos.password,
    };
    const respuesta = await this.solicitar<ChoferSimpliRoute | ChoferSimpliRoute[]>(
      "POST",
      "/v1/accounts/drivers/",
      body,
    );
    return mapearChofer(primerElemento(respuesta));
  }

  // `is_driver: true` va siempre, aunque no cambie — sin él la API responde
  // "You must select user type" (ver comentario de ChoferSimpliRoute).
  async actualizarChofer(id: number, datos: DatosChofer): Promise<ChoferProveedor> {
    const body = {
      username: datos.username,
      name: datos.nombre,
      phone: datos.telefono ?? "",
      email: datos.email ?? "",
      is_admin: false,
      is_driver: true,
      ...(datos.password ? { password: datos.password } : {}),
    };
    const respuesta = await this.solicitar<ChoferSimpliRoute | ChoferSimpliRoute[]>(
      "PUT",
      `/v1/accounts/drivers/${id}/`,
      body,
    );
    return mapearChofer(primerElemento(respuesta));
  }

  // DELETE real devuelve 405 pese a listarse en Allow — la baja real es un
  // soft-delete vía PATCH status=deleted (ver comentario de ChoferSimpliRoute).
  async eliminarChofer(id: number): Promise<void> {
    await this.solicitar<void>("PATCH", `/v1/accounts/drivers/${id}/`, {
      is_driver: true,
      status: "deleted",
    });
  }

  async listarVehiculos(): Promise<VehiculoProveedor[]> {
    const vehiculos = await this.solicitar<VehiculoSimpliRoute[]>("GET", "/v1/routes/vehicles/");
    return vehiculos.map(mapearVehiculo);
  }

  // Root objeto (no array) según ejemplo oficial de Vehicle — a diferencia de Drivers.
  async crearVehiculo(datos: DatosVehiculo): Promise<VehiculoProveedor> {
    const body = {
      name: datos.nombre,
      license_plate: datos.patente ?? undefined,
      default_driver: datos.choferPredeterminadoId ?? null,
    };
    const vehiculo = await this.solicitar<VehiculoSimpliRoute>("POST", "/v1/routes/vehicles/", body);
    return mapearVehiculo(vehiculo);
  }

  // PATCH está documentado como actualización parcial para Vehicle (a
  // diferencia de Users, que solo tiene PUT) — se usa acá para no pisar
  // campos que esta app no administra.
  async actualizarVehiculo(id: number, datos: DatosVehiculo): Promise<VehiculoProveedor> {
    const body = {
      name: datos.nombre,
      ...(datos.patente !== undefined ? { license_plate: datos.patente } : {}),
      ...(datos.choferPredeterminadoId !== undefined
        ? { default_driver: datos.choferPredeterminadoId }
        : {}),
    };
    const vehiculo = await this.solicitar<VehiculoSimpliRoute>(
      "PATCH",
      `/v1/routes/vehicles/${id}/`,
      body,
    );
    return mapearVehiculo(vehiculo);
  }

  async eliminarVehiculo(id: number): Promise<void> {
    await this.solicitar<void>("DELETE", `/v1/routes/vehicles/${id}/`);
  }
}
