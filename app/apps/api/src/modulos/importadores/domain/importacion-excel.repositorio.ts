import { EstadoImportacion } from "@mym/shared-types";

export interface ImportacionExcelRepositorio {
  crear(datos: { clienteId: string; nombreArchivo: string; usuarioId: string }): Promise<{ id: string }>;
  actualizarEstado(
    id: string,
    datos: { estado: EstadoImportacion; totalFilas: number; filasConError: number },
  ): Promise<void>;
  // Pedido en reunión 2026-10-09: filtro "Importado por" en Pedidos — solo
  // usuarios que de verdad importaron algo (no la lista completa de
  // usuarios del sistema), para el desplegable del filtro.
  listarUsuariosImportadores(): Promise<{ id: string; nombre: string }[]>;
}

export const IMPORTACION_EXCEL_REPOSITORIO = Symbol("IMPORTACION_EXCEL_REPOSITORIO");
