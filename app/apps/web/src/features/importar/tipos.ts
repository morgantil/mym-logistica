// Espejo de apps/api/src/modulos/importadores/domain/campo-canonico.ts — campos
// que el sistema necesita de CUALQUIER Excel de pañales, sin importar cómo el
// cliente llame a sus columnas (§6 funcional).
export type CampoCanonico =
  | "numeroAfiliado"
  | "destinatario"
  | "direccion"
  | "localidad"
  | "fechaEntrega"
  | "codigoProducto"
  | "descripcionProducto"
  | "cantidad"
  | "ticket"
  | "telefono";

export type MapeoColumnas = Partial<Record<CampoCanonico, string>>;

export interface ResultadoImportacionCompleta {
  estado: "completada";
  importacionId: string;
  clienteId: string;
  pedidosCreados: number;
  filasConError: { fila: number; errores: string[] }[];
  alertasDireccion: number;
}

export interface ResultadoRequiereMapeoManual {
  estado: "requiereMapeoManual";
  clienteId: string;
  encabezadosDisponibles: string[];
  camposObligatoriosFaltantes: CampoCanonico[];
  mapeoAutomaticoParcial: MapeoColumnas;
}

export interface ResultadoRequiereSeleccionCliente {
  estado: "requiereSeleccionCliente";
  nombreArchivo: string;
}

export type ResultadoImportacion =
  | ResultadoImportacionCompleta
  | ResultadoRequiereMapeoManual
  | ResultadoRequiereSeleccionCliente;
