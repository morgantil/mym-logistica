import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";
import { Pedido, PedidoFacturable, PedidoListado } from "./pedido";

export interface DatosCrearPedido {
  clienteId: string;
  destinatarioId: string;
  importacionId: string | null;
  numeroAfiliado: string;
  direccionOriginal: string;
  direccionUsada: string;
  localidad: string;
  zonaTarifariaId: string | null;
  fechaProgramada: Date;
  tipoServicio: TipoServicio;
  observaciones: string | null;
  productos: { codigo: string | null; descripcion: string; cantidad: number; ticket: string | null }[];
  zonaId: string | null;
  zonaNombre: string | null;
  choferId: string | null;
  choferNombre: string | null;
  estadoSimpliroute: EstadoSimpliroute;
  estadoValidacion: EstadoValidacion;
}

export interface FiltroPedidos {
  clienteIds?: string[]; // resultado de PermisosClienteService — null/undefined = sin restricción
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
  // Filtro "mayor/menor" sobre bultos — decisión 2026-09-01. bultos=null
  // (sin cargar todavía) queda afuera en cuanto se usa cualquiera de los dos.
  bultosDesde?: number;
  bultosHasta?: number;
  // Búsqueda libre — matchea contra destinatario, dirección o Nº de afiliado
  // (case-insensitive, "contiene"). Decisión 2026-09-01.
  busqueda?: string;
}

// Ordenamiento de la grilla — decisión 2026-09-01. Whitelist explícita (no un
// string libre) para no exponer un campo interno o permitir una inyección de
// orderBy vía query param. "productos" queda afuera a propósito: es un
// cálculo agregado sobre la relación, no una columna — ordenar por eso
// necesitaría un query bastante más pesado, se dejó sin implementar.
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

export interface OrdenPedidos {
  campo: CampoOrdenPedido;
  direccion: "asc" | "desc";
}

export interface FiltroPedidosFacturables {
  clienteId: string;
  fechaDesde: Date;
  fechaHasta: Date; // exclusiva
}

export interface PaginaPedidos {
  datos: PedidoListado[];
  total: number;
}

// §19 funcional — candidato a sincronizar: ya se mandó a SimpliRoute
// (estadoSimpliroute=ENVIADO) y todavía no llegó a un estado terminal propio
// (COORDINADO o EN_TRANSITO, nunca ENTREGADO/ENTREGA_FALLIDA/CANCELADO — una
// vez ahí no tiene sentido seguir consultando esa Visit).
export interface PedidoParaSincronizar {
  id: string;
  simplirouteId: string;
  version: number;
}

export interface PedidosRepositorio {
  listar(filtro: FiltroPedidos, pagina: number, porPagina: number, orden?: OrdenPedidos): Promise<PaginaPedidos>;
  contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>>;
  crear(datos: DatosCrearPedido): Promise<Pedido>;
  obtenerPorId(id: string): Promise<Pedido | null>;
  // Con nombres de cliente/destinatario y productos — lo que necesita la
  // etiqueta de bulto (§8.2 funcional v6), a diferencia de obtenerPorId.
  obtenerListadoPorId(id: string): Promise<PedidoListado | null>;

  // §17 funcional: candidatos a "Revisión antes de enviar" — los que todavía
  // no se mandaron a SimpliRoute.
  listarPendientesDeEnvio(clienteIds?: string[]): Promise<PedidoListado[]>;

  // §30 funcional ("información necesaria para facturación"): candidatos a
  // facturar de un cliente en un período — entregados y todavía sin asignar
  // a un grupo de facturación (evita facturar dos veces el mismo pedido).
  // La escritura de grupoFacturacionId/reglaAplicada (una vez calculado el
  // motor) la hace directamente FacturacionRepositorioPrisma dentro de su
  // propia transacción — necesita atomicidad con la creación de
  // GrupoFacturacion, que no se puede lograr cruzando dos repositorios.
  listarFacturables(filtro: FiltroPedidosFacturables): Promise<PedidoFacturable[]>;

  // Igual que listarFacturables pero SIN excluir los que ya tienen
  // grupoFacturacionId — para usar como pool de lectura al buscar una
  // unificación ENTRE clientes (Guia_Desarrollo_Logica_Facturacion_Arbet.docx
  // paso 4): el pedido "socio" puede ya estar facturado dentro de SU PROPIO
  // GrupoFacturacion (de su propio cliente) sin que eso invalide que sirva de
  // referencia para la unificación del OTRO cliente. Si acá se usara
  // listarFacturables, el resultado dependería del ORDEN en que se generó la
  // vista previa de cada cliente (bug real encontrado en pruebas 2026-09-08:
  // corriendo primero el cliente de pañales, su pedido queda con
  // grupoFacturacionId seteado y desaparece del pool cuando el cliente de
  // medicamentos busca su socio después). Nunca se usa para escribir.
  listarEntregadosEnPeriodo(filtro: FiltroPedidosFacturables): Promise<PedidoFacturable[]>;

  // Ambos con bloqueo optimista: lanzan ConflictoVersionError (ver ese archivo)
  // si `version` no coincide con la fila actual — alguien más lo modificó primero.
  actualizarBultos(id: string, bultos: number, version: number): Promise<Pedido>;
  // `correccionZonaChofer` solo se completa cuando el recálculo con la
  // coordenada real de la entrega (post-envío) dio una zona/chofer distinta
  // a la asignada antes de enviar — ver PedidosService.enviarASimpliRoute.
  marcarEnviado(
    id: string,
    datos: {
      simplirouteId: string;
      version: number;
      latitudEntrega: number | null;
      longitudEntrega: number | null;
      geocodeAlert: string | null;
      correccionZonaChofer?: {
        zonaId: string | null;
        zonaNombre: string | null;
        choferId: string | null;
        choferNombre: string | null;
        zonaPreEnvioId: string | null;
        zonaPreEnvioNombre: string | null;
        choferPreEnvioId: string | null;
        choferPreEnvioNombre: string | null;
      };
    },
  ): Promise<Pedido>;

  // SimpliRoute ya creó la Visit (no se puede evitar, la geocodificación pasa
  // en ese mismo momento) pero la coordenada devuelta cayó fuera de Buenos
  // Aires — error de geocodificación garantizado (ver
  // validar-coordenada-buenos-aires.ts). Deja `estadoSimpliroute: ERROR` y
  // NO avanza `estado` a COORDINADO, para que no se vea como un envío
  // normal. Guarda igual `simplirouteId`/coordenadas para poder revisar la
  // Visita a mano en SimpliRoute.
  marcarErrorGeocodificacion(
    id: string,
    datos: {
      simplirouteId: string;
      version: number;
      latitudEntrega: number | null;
      longitudEntrega: number | null;
      geocodeAlert: string | null;
    },
  ): Promise<Pedido>;

  // §19 funcional — sincronización de estados reales con SimpliRoute.
  listarPendientesDeSincronizar(): Promise<PedidoParaSincronizar[]>;
  // Con bloqueo optimista, igual que arriba.
  actualizarEstadoDesdeProveedor(
    id: string,
    datos: { estado: EstadoPedido; fechaEntregaEfectiva: Date | null; version: number },
  ): Promise<Pedido>;

  // Sin bloqueo optimista a propósito: es solo informativo ("¿ya se imprimió
  // alguna etiqueta?"), no hay dato de negocio en juego que se pueda pisar.
  marcarEtiquetaImpresa(id: string): Promise<void>;

  // Borrado lógico (ver soft-delete.middleware.ts — Pedido ya está en
  // MODELOS_CON_BORRADO_LOGICO). La validación de "se puede borrar este
  // pedido" (ver validar-eliminacion.ts) la hace el service ANTES de llamar
  // acá — este método no vuelve a chequear nada, confía en el llamador.
  eliminar(id: string): Promise<void>;
}

export const PEDIDOS_REPOSITORIO = Symbol("PEDIDOS_REPOSITORIO");
