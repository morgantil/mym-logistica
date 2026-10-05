import {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  PrioridadPedido,
  TipoEnvase,
  TipoServicio,
} from "@mym/shared-types";
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
  // true si la dirección del Excel difiere de la registrada en el padrón —
  // bloquea el envío hasta resolverse, ver validar-envio.ts (decisión 2026-09-16).
  alertaDireccionPendiente: boolean;
  // Ver Pedido.cantidadPedidoOriginal en schema.prisma.
  cantidadPedidoOriginal: number;
  productos: {
    codigo: string | null;
    descripcion: string;
    cantidad: number;
    ticket: string | null;
    tipoEnvase: TipoEnvase | null;
  }[];
  zonaId: string | null;
  zonaNombre: string | null;
  choferId: string | null;
  choferNombre: string | null;
  estadoSimpliroute: EstadoSimpliroute;
  estadoValidacion: EstadoValidacion;
  // Específicos de medicamentos — null para pañales, ver comentario en Pedido (schema.prisma).
  receta: string | null;
  recetaResuelta: string | null;
  tipoPedido: string | null;
  retiroDeReceta: string | null;
  tiempoDeEntrega: string | null;
  horarioEntrega: string | null;
  prioridad: PrioridadPedido;
  remito: string | null;
  // Cantidad de bultos/etiquetas ya calculada al importar (medicamentos) —
  // null = se carga a mano después, como siempre (pañales).
  bultos: number | null;
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
  // Filtros combinables agregados 2026-09-16 (pedido de Leonardo — "que sea
  // combinatorio por la mayoría de variables que podamos tener"), todos AND
  // entre sí y con el resto, mismo criterio que fecha/bultos de arriba.
  tipoServicio?: TipoServicio;
  zonaId?: string;
  choferId?: string;
  // Bolsa/Bulto vive en Producto, no en Pedido — filtra pedidos que tengan
  // AL MENOS una línea de ese envase (ver armarWhere en el adapter Prisma).
  tipoEnvase?: TipoEnvase;
  estadoSimpliroute?: EstadoSimpliroute;
  prioridad?: PrioridadPedido;
  localidad?: string;
  // true = solo pedidos con `etiquetaImpresaEn` null. No se ofrece el
  // inverso ("con etiqueta impresa") porque no se pidió — se puede sumar
  // después con el mismo campo (true/false) si hace falta.
  sinEtiquetaImpresa?: boolean;
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
  | "observaciones"
  | "remito"
  | "receta"
  | "tipoPedido"
  | "tiempoDeEntrega"
  | "retiroDeReceta"
  | "horarioEntrega"
  | "prioridad";

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
  choferId: string | null;
  version: number;
}

export interface PedidosRepositorio {
  listar(filtro: FiltroPedidos, pagina: number, porPagina: number, orden?: OrdenPedidos): Promise<PaginaPedidos>;
  // Decisión 2026-10-04: para "Exportar a Excel" — mismos filtros, sin paginar.
  listarTodosParaExportar(filtro: FiltroPedidos, orden?: OrdenPedidos): Promise<PedidoListado[]>;
  contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>>;
  crear(datos: DatosCrearPedido): Promise<Pedido>;
  obtenerPorId(id: string): Promise<Pedido | null>;
  // Con nombres de cliente/destinatario y productos — lo que necesita la
  // etiqueta de bulto (§8.2 funcional v6), a diferencia de obtenerPorId.
  obtenerListadoPorId(id: string): Promise<PedidoListado | null>;

  // §17 funcional: candidatos a "Revisión antes de enviar" — los que todavía
  // no se mandaron a SimpliRoute.
  listarPendientesDeEnvio(clienteIds?: string[]): Promise<PedidoListado[]>;

  // Valores reales de Localidad ya cargados (para el dropdown del filtro de
  // Pedidos, decisión 2026-09-16) — respeta los mismos permisos por cliente
  // que el resto de los listados, no una lista fija en código.
  listarLocalidades(clienteIds?: string[]): Promise<string[]>;

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
  // Decisión 2026-10-04: comentario libre, editable en cualquier momento
  // (ej. motivo de una entrega fallida) — mismo bloqueo optimista que bultos.
  actualizarComentario(id: string, comentario: string | null, version: number): Promise<Pedido>;
  // Decisión 2026-09-16: aplica la resolución elegida por el usuario para una
  // "dirección distinta al padrón" — actualiza `direccionUsada` (según lo que
  // haya decidido resolverDiferenciaDireccion) y apaga `alertaDireccionPendiente`,
  // destrabando el envío. Mismo bloqueo optimista que el resto.
  resolverAlertaDireccion(id: string, direccionUsada: string, version: number): Promise<Pedido>;
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
  // Con bloqueo optimista, igual que arriba. `actualizacionChofer` solo viaja
  // cuando el chofer real de la Visit (campo `driver`) ya no coincide con el
  // choferId guardado — ej. un despachante reasignó la Visit a mano en
  // SimpliRoute después de enviada. Decisión 2026-10-04: así la grilla se
  // actualiza sola en el próximo sincronizar-estados, sin tener que borrar el
  // pedido para forzarlo (ver PedidosService.sincronizarEstados).
  actualizarEstadoDesdeProveedor(
    id: string,
    datos: {
      estado: EstadoPedido;
      fechaEntregaEfectiva: Date | null;
      version: number;
      actualizacionChofer?: {
        zonaId: string | null;
        zonaNombre: string | null;
        choferId: string | null;
        choferNombre: string | null;
      };
    },
  ): Promise<Pedido>;

  // Sin bloqueo optimista a propósito: es solo informativo ("¿ya se imprimió
  // alguna etiqueta?"), no hay dato de negocio en juego que se pueda pisar.
  marcarEtiquetaImpresa(id: string): Promise<void>;

  // Borrado lógico (ver soft-delete.middleware.ts — Pedido ya está en
  // MODELOS_CON_BORRADO_LOGICO). La validación de "se puede borrar este
  // pedido" (ver validar-eliminacion.ts) la hace el service ANTES de llamar
  // acá — este método no vuelve a chequear nada, confía en el llamador.
  eliminar(id: string): Promise<void>;
  // Decisión 2026-09-24: cambia la prioridad de varios pedidos de una vez
  // (o de uno solo). Devuelve cuántos actualizó.
  actualizarPrioridad(pedidoIds: string[], prioridad: PrioridadPedido, usuarioId: string): Promise<number>;
}

export const PEDIDOS_REPOSITORIO = Symbol("PEDIDOS_REPOSITORIO");
