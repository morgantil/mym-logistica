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

interface FechaConNota {
  fechaIso: string;
  // Biosíntesis/Bella Vista/Farmapal traen la fecha y una observación de
  // entrega pegadas en la misma celda (ej. "2026-08-06 UF03 PIDE QUE
  // INGRESE", "2026-08-06//FARMAPAL"). Se extrae la fecha del inicio del
  // texto; lo que sobra son instrucciones de entrega reales, no basura — se
  // guarda como nota en vez de descartarse (ver ImportarExcelService).
  nota: string | null;
}

const FECHA_ISO_AL_INICIO = /^(\d{4}-\d{2}-\d{2})/;

function aFechaConNota(valor: unknown): FechaConNota | null {
  if (valor instanceof Date) return { fechaIso: valor.toISOString().slice(0, 10), nota: null };

  const texto = aTexto(valor);
  if (!texto) return null;

  const fechaCompleta = new Date(texto);
  if (!Number.isNaN(fechaCompleta.getTime())) {
    return { fechaIso: fechaCompleta.toISOString().slice(0, 10), nota: null };
  }

  const matchInicio = texto.match(FECHA_ISO_AL_INICIO);
  if (!matchInicio) return null;

  const fecha = new Date(matchInicio[1]);
  if (Number.isNaN(fecha.getTime())) return null;

  const nota = texto
    .slice(matchInicio[0].length)
    .replace(/^[\s/:.-]+/, "")
    .trim();

  return { fechaIso: fecha.toISOString().slice(0, 10), nota: nota || null };
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
  const fecha = aFechaConNota(leer("fechaEntrega"));
  const descripcionProducto = aTexto(leer("descripcionProducto"));
  const cantidad = aCantidad(leer("cantidad"));
  const codigoProducto = aTexto(leer("codigoProducto"));
  const telefono = aTexto(leer("telefono"));

  if (!numeroAfiliado) errores.push("Falta número de afiliado.");
  if (!destinatario) errores.push("Falta destinatario.");
  if (!direccion) errores.push("Falta dirección.");
  if (!localidad) errores.push("Falta localidad.");
  if (!fecha) errores.push("Falta o es inválida la fecha de entrega.");
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
      fechaEntrega: fecha!.fechaIso,
      notaFecha: fecha!.nota,
      codigoProducto,
      descripcionProducto: descripcionProducto!,
      cantidad: cantidad!,
    },
  };
}

// Re-exportado por conveniencia: quién quiera saber "qué campos hacen falta
// como mínimo" no debería tener que ir a buscar campo-canonico.ts a mano.
export { CAMPOS_OBLIGATORIOS };
