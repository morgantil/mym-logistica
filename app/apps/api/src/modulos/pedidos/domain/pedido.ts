import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoEnvase, TipoServicio } from "@mym/shared-types";

export interface Pedido {
  id: string;
  numero: number; // N.º de Pedido interno — §8.2 funcional v6, para etiquetas
  clienteId: string;
  destinatarioId: string;
  numeroAfiliado: string;
  direccionOriginal: string; // tal cual vino del Excel — ver resolverAlertaDireccion
  direccionUsada: string;
  localidad: string;
  zonaTarifariaId: string | null;
  fechaProgramada: Date;
  tipoServicio: TipoServicio;
  estado: EstadoPedido;
  estadoValidacion: EstadoValidacion;
  estadoSimpliroute: EstadoSimpliroute;
  zonaId: string | null;
  zonaNombre: string | null;
  choferId: string | null;
  choferNombre: string | null;
  // Snapshot de la zona/chofer pre-envío, solo si el recálculo con la
  // coordenada real de la entrega dio distinto y se corrigió zonaId/choferId
  // de arriba — ver PedidosService.enviarASimpliRoute.
  zonaPreEnvioId: string | null;
  zonaPreEnvioNombre: string | null;
  choferPreEnvioId: string | null;
  choferPreEnvioNombre: string | null;
  // Coordenada real de la entrega, geocodificada por SimpliRoute al enviar
  // (null hasta el envío, o si SimpliRoute no pudo geocodificar nada).
  latitudEntrega: number | null;
  longitudEntrega: number | null;
  geocodeAlert: string | null;
  bultos: number | null;
  observaciones: string | null;
  // Decisión 2026-09-16: bloquea el envío hasta que se resuelva — ver
  // validar-envio.ts y PedidosService.resolverAlertaDireccion.
  alertaDireccionPendiente: boolean;
  etiquetaImpresaEn: Date | null;
  // Cuántos pedidos del sistema de origen (Nº de ticket distintos) se
  // agruparon en este Pedido — ver comentario en schema.prisma. Default 1.
  cantidadPedidoOriginal: number;
  version: number;
  creadoEn: Date; // momento real de creación del registro — distinto de fechaProgramada (la de entrega, elegida a mano)
}

// Proyección de Pedido para la grilla principal (§14 funcional) y la revisión
// antes de enviar (§17): agrega los nombres que la grilla necesita mostrar
// (Cliente y Destinatario son IDs en el Pedido base; Zona/Chofer ya vienen
// con su nombre snapshoteado directo en el Pedido, ver comentario en schema.prisma)
// y el detalle de productos para "cantidad de productos"/"cantidad total de
// unidades". Solo lo devuelven PedidosRepositorio#listar y
// #listarPendientesDeEnvio — el resto de las operaciones (crear,
// actualizarBultos, etc.) siguen trabajando con el Pedido base, sin
// acoplarse a qué necesita mostrar la UI.
export interface PedidoListado extends Pedido {
  clienteNombre: string;
  destinatarioNombre: string;
  destinatarioTelefono: string | null;
  productos: { codigo: string | null; descripcion: string; cantidad: number; ticket: string | null }[];
}

// Proyección de Pedido para el motor de facturación (facturacion/domain/
// motor-facturacion.ts): necesita el tipoEnvase de cada línea para clasificar
// el pedido como Bolsa/Bulto (determinarClasificacionMedicamento) — a
// diferencia de PedidoListado (que trae más datos de exhibición, para la
// grilla), acá solo lo mínimo que ese cálculo necesita.
export interface PedidoFacturable extends Pedido {
  productos: { tipoEnvase: TipoEnvase | null }[];
}

// Decisión 2026-09-15: renombrada de "LineaExcelPanales" — ahora también la
// arma el importador de medicamentos (transformarFilaMedicamento), no solo
// el de pañales. La forma es la misma para los dos: una línea = un producto
// (real, para pañales; sintético, para medicamentos — ver
// TEMAS_PENDIENTES.md §13.19, no hay columna de descripción de producto en
// los Excel de Farmaet/Bella Vista).
export interface LineaExcelImportada {
  clienteId: string;
  numeroAfiliado: string;
  destinatario: string;
  direccion: string;
  localidad: string;
  telefono: string | null;
  fechaEntrega: string; // ISO date, ya parseada por el importador
  // Texto que venía pegado a la fecha en la misma celda del Excel (ej.
  // "UF03 PIDE QUE INGRESE") — algunos clientes reales meten instrucciones de
  // entrega ahí. No es basura: transformarFila lo separa de la fecha, y acá
  // viaja hasta el Pedido como observación (ver ImportarExcelService).
  notaFecha: string | null;
  // Número de ticket (Farmapal) o de remito (Farmaet/Bella Vista, mismo rol
  // — ver diccionario-sinonimos.ts) — se guarda como observación, no en su
  // propio campo (decisión 2026-09-01: así sale impreso en la etiqueta junto
  // con el resto de las observaciones sin tocar el generador).
  ticket: string | null;
  codigoProducto: string | null;
  descripcionProducto: string;
  cantidad: number;
  // Solo medicamentos (null para pañales) — Guia Arbet paso 2, ver
  // determinarClasificacionMedicamento.
  tipoEnvase: TipoEnvase | null;
  // --- Campos de PEDIDO (no de producto) específicos de medicamentos, null
  // para pañales — decisión 2026-09-13/15, ver TEMAS_PENDIENTES.md §13.14.
  // Viajan por línea porque LineaExcelImportada es "una línea del Excel",
  // pero son iguales para todas las líneas de un mismo pedido agrupado
  // (mismo criterio que destinatario/direccion más arriba).
  receta: string | null;
  tipoPedido: string | null;
  retiroDeReceta: boolean | null;
  tiempoDeEntrega: string | null;
  horarioEntrega: string | null;
}

export interface PedidoAgrupado {
  clienteId: string;
  numeroAfiliado: string;
  destinatario: string;
  direccion: string;
  localidad: string;
  telefono: string | null;
  fechaEntrega: string;
  notaFecha: string | null;
  productos: {
    codigo: string | null;
    descripcion: string;
    cantidad: number;
    ticket: string | null;
    tipoEnvase: TipoEnvase | null;
  }[];
  totalUnidades: number;
  receta: string | null;
  tipoPedido: string | null;
  retiroDeReceta: boolean | null;
  tiempoDeEntrega: string | null;
  horarioEntrega: string | null;
}

// DOCUMENTO FUNCIONAL.md §7: una línea del Excel = un producto, no un pedido.
// Se agrupan por MISMO cliente + MISMO afiliado + MISMA dirección + MISMA fecha.
// destinatario/localidad/telefono son los mismos dentro de un mismo grupo (misma
// persona, mismo envío) — se toman de la primera línea que arma el grupo.
//
// El ticket/número de orden del sistema de origen (ej. Farmanet) se guarda
// por PRODUCTO, no una sola vez por pedido — decisión 2026-09-07: si dos
// líneas del mismo afiliado+dirección+fecha vienen de órdenes de origen
// distintas (dos números de ticket distintos), agruparlas en un pedido
// sigue siendo correcto (es una sola entrega/viaje, así lo pide el
// documento funcional y así lo necesita la facturación), pero antes se
// perdía el ticket de todas las líneas menos la primera. Guardarlo por
// producto no pierde ningún dato de trazabilidad sin tocar cómo se arma
// el pedido ni cómo se factura.
export function agruparLineasEnPedidos(lineas: LineaExcelImportada[]): PedidoAgrupado[] {
  const grupos = new Map<string, PedidoAgrupado>();

  const normalizarDireccion = (direccion: string) => direccion.trim().toUpperCase().replace(/\s+/g, " ");

  for (const linea of lineas) {
    const clave = [
      linea.clienteId,
      linea.numeroAfiliado,
      normalizarDireccion(linea.direccion),
      linea.fechaEntrega,
    ].join("|");

    const grupoExistente = grupos.get(clave);
    const producto = {
      codigo: linea.codigoProducto,
      descripcion: linea.descripcionProducto,
      cantidad: linea.cantidad,
      ticket: linea.ticket,
      tipoEnvase: linea.tipoEnvase,
    };

    if (grupoExistente) {
      grupoExistente.productos.push(producto);
      grupoExistente.totalUnidades += linea.cantidad;
    } else {
      grupos.set(clave, {
        clienteId: linea.clienteId,
        numeroAfiliado: linea.numeroAfiliado,
        destinatario: linea.destinatario,
        direccion: linea.direccion,
        localidad: linea.localidad,
        telefono: linea.telefono,
        fechaEntrega: linea.fechaEntrega,
        notaFecha: linea.notaFecha,
        productos: [producto],
        totalUnidades: linea.cantidad,
        receta: linea.receta,
        tipoPedido: linea.tipoPedido,
        retiroDeReceta: linea.retiroDeReceta,
        tiempoDeEntrega: linea.tiempoDeEntrega,
        horarioEntrega: linea.horarioEntrega,
      });
    }
  }

  return Array.from(grupos.values());
}
