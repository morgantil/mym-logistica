// Puerto de lectura de Excel — el dominio no sabe (ni le importa) si atrás hay
// exceljs, otra librería, o un CSV disfrazado. Devuelve datos crudos, tal cual
// vienen en el archivo: encabezados sin tocar y filas como diccionario
// encabezado -> valor. Todo el trabajo de "entender" esos datos pasa por
// mapeo-columnas.ts, no por acá.
export interface FilaExcelCruda {
  [encabezado: string]: unknown;
}

export interface ExcelLeido {
  encabezados: string[];
  filas: FilaExcelCruda[];
}

export interface OpcionesLectura {
  nombreHoja?: string;
  sinEncabezado?: boolean;
}

export interface LectorExcelPort {
  // `nombreHoja` opcional: sin él se lee la primera hoja (decisión 2026-09-24:
  // Farmaet manda un libro con dos hojas y se importa la segunda).
  // `sinEncabezado`: el archivo no trae fila de títulos (Farmaet) — las
  // columnas se llaman "A", "B", "C"… y TODAS las filas son datos.
  leer(buffer: Buffer, opciones?: OpcionesLectura): Promise<ExcelLeido>;
}

export const LECTOR_EXCEL = Symbol("LECTOR_EXCEL");
