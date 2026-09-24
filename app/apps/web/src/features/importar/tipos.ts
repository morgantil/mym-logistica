// Espejo de apps/api/src/modulos/importadores/domain/campo-canonico.ts — campos
// que el sistema necesita de CUALQUIER Excel de pañales o medicamentos, sin
// importar cómo el cliente llame a sus columnas (§6 funcional).
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
  | "telefono"
  // --- Específicos de medicamentos (ver campo-canonico.ts en el backend) ---
  | "receta"
  | "tipoPedido"
  | "retiroDeReceta"
  | "tiempoDeEntrega"
  | "horarioEntrega"
  | "entreCalles"
  | "envaseTexto"
  | "cantidadBulto"
  | "cantidadBolsa";

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

export type ResultadoImportacion = ResultadoImportacionCompleta | ResultadoRequiereMapeoManual;

// --- Reglas de importación y sinónimos de receta (decisión 2026-09-24) ---
// Espejo de apps/api/src/modulos/importadores/domain/reglas-importacion.ts.
export type TipoCoincidencia = "IGUAL" | "EMPIEZA_CON" | "CONTIENE";
export type AccionRegla = "ASIGNAR_VALOR" | "QUITAR_PREFIJO";
export type CampoDestinoRegla = "retiroDeReceta" | "prioridad" | "numeroAfiliado";

export interface ReglaImportacion {
  id: string;
  clienteId: string;
  tipoServicio: "PANAL" | "MEDICAMENTO";
  campoOrigen: CampoCanonico;
  tipoCoincidencia: TipoCoincidencia;
  valor: string;
  accion: AccionRegla;
  campoDestino: CampoDestinoRegla;
  valorDestino: string;
  orden: number;
  activa: boolean;
}

export type DatosReglaImportacion = Omit<ReglaImportacion, "id">;

export interface SinonimoReceta {
  id: string;
  valorOrigen: string;
  valorCanonico: string;
  tipoCoincidencia: TipoCoincidencia;
  orden: number;
}
