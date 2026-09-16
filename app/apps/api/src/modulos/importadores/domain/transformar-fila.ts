import { LineaExcelImportada } from "../../pedidos/domain/pedido";
import { CAMPOS_OBLIGATORIOS, MapeoColumnas } from "./campo-canonico";
import { FilaExcelCruda } from "./lector-excel.port";

export interface ResultadoTransformarFila {
  valida: boolean;
  linea: LineaExcelImportada | null;
  errores: string[];
}

// Exportada — la reusa transformarFilaMedicamento (mismo criterio de
// "celda vacía = null", nada específico de pañales acá).
export function aTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

const FECHA_ISO_AL_INICIO = /^(\d{4}-\d{2}-\d{2})/;

// Biosíntesis/Bella Vista/Farmapal traen la fecha y una observación de
// entrega pegadas en la misma celda (ej. "2026-08-06 UF03 PIDE QUE
// INGRESE", "2026-08-06//FARMAPAL"). Documento funcional v6 §4.1: la fecha
// de entrega real es la que el usuario informa ANTES de subir el Excel
// (aplicada a todo el lote — ver `fechaEntregaLote` en transformarFila), no
// la del archivo. Esta función ya no decide la fecha del pedido: solo
// separa el texto de la celda para no perder la observación de entrega
// real que pueda venir pegada a una fecha — se guarda como nota (ver
// ImportarExcelService), el resto se descarta.
export function extraerNotaDeCeldaFecha(valor: unknown): string | null {
  if (valor instanceof Date) return null;

  const texto = aTexto(valor);
  if (!texto) return null;

  if (!Number.isNaN(new Date(texto).getTime())) return null;

  const matchInicio = texto.match(FECHA_ISO_AL_INICIO);
  if (!matchInicio) return null;

  const nota = texto
    .slice(matchInicio[0].length)
    .replace(/^[\s/:.-]+/, "")
    .trim();

  return nota || null;
}

function aCantidad(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number(aTexto(valor));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// Toma UNA fila cruda del Excel + el mapeo ya resuelto (automático o manual) y
// la convierte en una línea de pedido validada — DOCUMENTO FUNCIONAL.md §6.
// Una fila con errores no aborta todo el archivo: vuelve con `valida: false`
// y sus errores puntuales, para que el importador la marque y siga con el resto.
//
// `fechaEntregaLote` (ISO YYYY-MM-DD) es la fecha que el usuario informó al
// iniciar la importación — documento funcional v6 §4.1: "La fecha de entrega
// seleccionada en pantalla tendrá prioridad sobre cualquier fecha incluida
// dentro del Excel." Se aplica igual a todas las filas del lote; el contenido
// de la celda de fecha del Excel ya no decide `fechaEntrega`, solo puede
// aportar una nota de entrega pegada al texto (ver extraerNotaDeCeldaFecha).
export function transformarFila(
  filaCruda: FilaExcelCruda,
  mapeo: MapeoColumnas,
  clienteId: string,
  fechaEntregaLote: string,
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
  const notaFecha = extraerNotaDeCeldaFecha(leer("fechaEntrega"));
  const descripcionProducto = aTexto(leer("descripcionProducto"));
  const cantidad = aCantidad(leer("cantidad"));
  const codigoProducto = aTexto(leer("codigoProducto"));
  const telefono = aTexto(leer("telefono"));
  const ticket = aTexto(leer("ticket"));

  if (!numeroAfiliado) errores.push("Falta número de afiliado.");
  if (!destinatario) errores.push("Falta destinatario.");
  if (!direccion) errores.push("Falta dirección.");
  if (!localidad) errores.push("Falta localidad.");
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
      fechaEntrega: fechaEntregaLote,
      notaFecha,
      ticket,
      codigoProducto,
      descripcionProducto: descripcionProducto!,
      cantidad: cantidad!,
      // Campos de medicamentos — null para pañales, ver transformarFilaMedicamento.
      tipoEnvase: null,
      receta: null,
      tipoPedido: null,
      retiroDeReceta: null,
      tiempoDeEntrega: null,
      horarioEntrega: null,
    },
  };
}

// Re-exportado por conveniencia: quién quiera saber "qué campos hacen falta
// como mínimo" no debería tener que ir a buscar campo-canonico.ts a mano.
export { CAMPOS_OBLIGATORIOS };
