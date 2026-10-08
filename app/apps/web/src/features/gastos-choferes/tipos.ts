import type { TipoGastoChofer } from "@mym/shared-types";

// Comprobante fiscal completo de Combustible (error real corregido
// 2026-10-07 — antes se perdían 19 columnas reales al importar, ver
// DatosFiscalesCombustible en el backend). Todos opcionales, solo tienen
// sentido para Combustible (siempre null en Peaje).
export interface DatosFiscalesCombustible {
  fechaRecepcion: string | null;
  comprobanteCodigo: string | null;
  comprobanteTipo: string | null;
  comprobanteSucursal: string | null;
  comprobanteNumero: string | null;
  tipoDocumento: string | null;
  cuit: string | null;
  domicilio: string | null;
  codigoPostal: string | null;
  provincia: string | null;
  condicionFiscal: string | null;
  codigoNeto: string | null;
  netoGravado: number | null;
  alicuota: number | null;
  ivaLiquidado: number | null;
  ivaCredito: number | null;
  codigoNgEx: string | null;
  conceptosNgEx: number | null;
  codigoPR: string | null;
  percepcionRetencion: number | null;
  provinciaPR: string | null;
}

export interface GastoChofer extends DatosFiscalesCombustible {
  id: string;
  tipo: TipoGastoChofer;
  fecha: string;
  monto: number;
  choferId: string | null;
  choferNombre: string | null;
  // Tal cual vino en la columna CHOFER del archivo — útil para resolver a
  // mano un gasto que no matcheó ningún chofer.
  choferNombreOriginal: string;
  proveedor: string | null;
  comprobante: string | null;
  archivoOrigen: string;
  creadoEn: string;
}

export interface ResumenImportacionGastos {
  tipo: TipoGastoChofer;
  totalFilas: number;
  matcheados: number;
  sinMatchear: number;
}
