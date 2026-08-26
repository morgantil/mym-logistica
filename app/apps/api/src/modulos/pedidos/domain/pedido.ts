import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";

export interface Pedido {
  id: string;
  numero: number; // N.º de Pedido interno — §8.2 funcional v6, para etiquetas
  clienteId: string;
  destinatarioId: string;
  numeroAfiliado: string;
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
  bultos: number | null;
  observaciones: string | null;
  etiquetaImpresaEn: Date | null;
  version: number;
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
  productos: { codigo: string | null; descripcion: string; cantidad: number }[];
}

export interface LineaExcelPanales {
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
  codigoProducto: string | null;
  descripcionProducto: string;
  cantidad: number;
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
  productos: { codigo: string | null; descripcion: string; cantidad: number }[];
  totalUnidades: number;
}

// DOCUMENTO FUNCIONAL.md §7: una línea del Excel = un producto, no un pedido.
// Se agrupan por MISMO cliente + MISMO afiliado + MISMA dirección + MISMA fecha.
// destinatario/localidad/telefono son los mismos dentro de un mismo grupo (misma
// persona, mismo envío) — se toman de la primera línea que arma el grupo.
export function agruparLineasEnPedidos(lineas: LineaExcelPanales[]): PedidoAgrupado[] {
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
      });
    }
  }

  return Array.from(grupos.values());
}
