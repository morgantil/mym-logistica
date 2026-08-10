import { CabaProvincia, EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";

export interface Pedido {
  id: string;
  clienteId: string;
  destinatarioId: string;
  numeroAfiliado: string;
  direccionUsada: string;
  localidad: string;
  cabaProvincia: CabaProvincia | null;
  fechaProgramada: Date;
  tipoServicio: TipoServicio;
  estado: EstadoPedido;
  estadoValidacion: EstadoValidacion;
  estadoSimpliroute: EstadoSimpliroute;
  zonaId: string | null;
  choferId: string | null;
  bultos: number | null;
  version: number;
}

export interface LineaExcelPanales {
  clienteId: string;
  numeroAfiliado: string;
  destinatario: string;
  direccion: string;
  localidad: string;
  telefono: string | null;
  fechaEntrega: string; // ISO date, ya parseada por el importador
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
        productos: [producto],
        totalUnidades: linea.cantidad,
      });
    }
  }

  return Array.from(grupos.values());
}
