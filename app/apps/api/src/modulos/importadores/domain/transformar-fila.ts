import { LineaExcelPanales } from "../../pedidos/domain/pedido";
import { CAMPOS_OBLIGATORIOS, MapeoColumnas } from "./campo-canonico";
import { FilaExcelCruda } from "./lector-excel.port";

export interface ResultadoTransformarFila {
  valida: boolean;
  linea: LineaExcelPanales | null;
  errores: string[];
}

function aTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

function aFechaIso(valor: unknown): string | null {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  const texto = aTexto(valor);
  if (!texto) return null;
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
}

function aCantidad(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number(aTexto(valor));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// Toma UNA fila cruda del Excel + el mapeo ya resuelto (automático o manual) y
// la convierte en una línea de pedido validada — DOCUMENTO FUNCIONAL.md §6.
// Una fila con errores no aborta todo el archivo: vuelve con `valida: false`
// y sus errores puntuales, para que el importador la marque y siga con el resto.
export function transformarFila(
  filaCruda: FilaExcelCruda,
  mapeo: MapeoColumnas,
  clienteId: string,
): ResultadoTransformarFila {
  const errores: string[] = [];

  const leer = (campo: keyof MapeoColumnas) => {
    const encabezado = mapeo[campo];
    return encabezado ? filaCruda[encabezado] : undefined;
  };

  const numeroAfiliado = aTexto(leer("numeroAfiliado"));
  const destinatario = aTexto(leer("destinatario"));
  const direccion = aTexto(leer("direccion"));
  const localidad = aTexto(leer("localidad"));
  const fechaEntrega = aFechaIso(leer("fechaEntrega"));
  const descripcionProducto = aTexto(leer("descripcionProducto"));
  const cantidad = aCantidad(leer("cantidad"));
  const codigoProducto = aTexto(leer("codigoProducto"));
  const telefono = aTexto(leer("telefono"));

  if (!numeroAfiliado) errores.push("Falta número de afiliado.");
  if (!destinatario) errores.push("Falta destinatario.");
  if (!direccion) errores.push("Falta dirección.");
  if (!localidad) errores.push("Falta localidad.");
  if (!fechaEntrega) errores.push("Falta o es inválida la fecha de entrega.");
  if (!descripcionProducto) errores.push("Falta producto.");
  if (!cantidad) errores.push("Falta o es inválida la cantidad.");

  if (errores.length > 0) {
    return { valida: false, linea: null, errores };
  }

  return {
    valida: true,
    errores: [],
    linea: {
      clienteId,
      numeroAfiliado: numeroAfiliado!,
      destinatario: destinatario!,
      direccion: direccion!,
      localidad: localidad!,
      telefono,
      fechaEntrega: fechaEntrega!,
      codigoProducto,
      descripcionProducto: descripcionProducto!,
      cantidad: cantidad!,
    },
  };
}

// Re-exportado por conveniencia: quién quiera saber "qué campos hacen falta
// como mínimo" no debería tener que ir a buscar campo-canonico.ts a mano.
export { CAMPOS_OBLIGATORIOS };
