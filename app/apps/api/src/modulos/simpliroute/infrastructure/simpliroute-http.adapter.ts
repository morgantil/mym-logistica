import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DestinatarioEnProveedor,
  LogisticaProviderPort,
  PedidoParaEnviar,
  ResultadoEnvio,
} from "../domain/logistica-provider.port";

const BASE_URL = "https://api.simpliroute.com";

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

  // Nota: este provider se instancia siempre (Nest resuelve las dependencias
  // del factory de SimplirouteModule de forma eager), esté o no
  // SIMPLIROUTE_MOCK activo — por eso acá no se loguea nada todavía. El aviso
  // de "falta la API key" vive en el módulo, donde sí se sabe si este adapter
  // es el que realmente se va a usar.
  constructor(config: ConfigService) {
    this.apiUrl = config.get<string>("simpliroute.apiUrl") || BASE_URL;
    this.apiKey = config.get<string>("simpliroute.apiKey") ?? "";
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

  // No existe en la documentación pública ningún endpoint de "sugerencia de
  // zona por dirección" — GET /v1/zones/ solo lista zonas ya configuradas en
  // la cuenta, no resuelve cuál corresponde a una dirección puntual. Sigue
  // devolviendo null a propósito (§12 funcional; ver comentario en el
  // puerto) — el fallback por localidad de ZonasChoferesService se sigue
  // usando siempre hasta que se confirme otra vía (ForceField/Territory
  // Planner requiere el addon `territory_planner`, no viene activado por
  // defecto).
  async obtenerZonaSugerida(_destinatario: DestinatarioEnProveedor): Promise<string | null> {
    return null;
  }

  // §18 funcional: crea una Visit. `load` = bultos es una interpretación —
  // SimpliRoute no define la unidad de `load` (depende de configuración de
  // cuenta, Documentacion simpliroute/05 §13) — a confirmar con la cuenta
  // real. Los errores se propagan a propósito: PedidosService.enviarASimpliRoute
  // ya los captura por pedido individual sin frenar al resto (§18).
  async enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoEnvio> {
    const body = [
      {
        title: pedido.destinatarioNombre,
        address: pedido.direccion,
        planned_date: pedido.fechaProgramada.toISOString().slice(0, 10),
        reference: pedido.pedidoId,
        contact_name: pedido.destinatarioNombre,
        contact_phone: pedido.destinatarioTelefono ?? "",
        notes: pedido.observaciones ?? "",
        ...(pedido.bultos !== null ? { load: pedido.bultos } : {}),
      },
    ];

    const respuesta = await this.solicitar<VisitaSimpliRoute | VisitaSimpliRoute[]>(
      "POST",
      "/v1/routes/visits/",
      body,
    );
    const visita = primerElemento(respuesta);
    return { idExterno: String(visita.id) };
  }

  // §19 funcional — devuelve el estado crudo tal cual lo informa SimpliRoute;
  // el mapeo a EstadoPedido propio vive en el módulo de pedidos (ver puerto).
  async consultarEstado(idExterno: string): Promise<string> {
    const respuesta = await this.solicitar<VisitaSimpliRoute | VisitaSimpliRoute[]>(
      "GET",
      `/v1/routes/visits/${encodeURIComponent(idExterno)}/`,
    );
    return primerElemento(respuesta).status;
  }
}
