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

export interface LectorExcelPort {
  leer(buffer: Buffer): Promise<ExcelLeido>;
}

export const LECTOR_EXCEL = Symbol("LECTOR_EXCEL");
