import { EstadoImportacion } from "@mym/shared-types";

export interface ImportacionExcelRepositorio {
  crear(datos: { clienteId: string; nombreArchivo: string; usuarioId: string }): Promise<{ id: string }>;
  actualizarEstado(
    id: string,
    datos: { estado: EstadoImportacion; totalFilas: number; filasConError: number },
  ): Promise<void>;
}

export const IMPORTACION_EXCEL_REPOSITORIO = Symbol("IMPORTACION_EXCEL_REPOSITORIO");
