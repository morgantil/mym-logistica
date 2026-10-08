import { TipoGastoChofer } from "@mym/shared-types";

// Error real detectado 2026-10-07 (reunión con Leonardo): el archivo real de
// combustible ("HWCompra-modelo") trae un comprobante fiscal completo
// (factura), no solo fecha/monto/proveedor — se estaban perdiendo 19
// columnas reales al importar. Todos opcionales y solo tienen sentido para
// Combustible (siempre null en Peaje, esa hoja sigue siendo solo
// chofer+monto). Nombres y tipos tomados de las columnas reales del archivo
// ("HWCompra-modelo"), no inventados — ver parsear-combustible.ts.
export interface DatosFiscalesCombustible {
  fechaRecepcion: Date | null;
  comprobanteCodigo: string | null; // columna "Cpbte" (ej. "TF")
  comprobanteTipo: string | null; // columna "Tipo" (ej. "A")
  comprobanteSucursal: string | null; // columna "Suc." (ej. "00007")
  comprobanteNumero: string | null; // columna "Número"
  tipoDocumento: string | null;
  cuit: string | null;
  domicilio: string | null;
  codigoPostal: string | null;
  provincia: string | null; // columna "Pcia"
  condicionFiscal: string | null;
  codigoNeto: string | null;
  netoGravado: number | null;
  alicuota: number | null; // columna "Alíc." (porcentaje, ej. 21)
  ivaLiquidado: number | null;
  ivaCredito: number | null;
  codigoNgEx: string | null;
  conceptosNgEx: number | null;
  codigoPR: string | null;
  percepcionRetencion: number | null; // columna "Perc./Ret."
  provinciaPR: string | null;
}

// ABM de combustible y peajes por chofer — ver comentario en schema.prisma.
export interface GastoChofer extends DatosFiscalesCombustible {
  id: string;
  tipo: TipoGastoChofer;
  fecha: Date;
  monto: number;
  choferId: string | null;
  choferNombre: string | null;
  choferNombreOriginal: string;
  proveedor: string | null;
  comprobante: string | null;
  archivoOrigen: string;
  creadoEn: Date;
}

export interface ResumenImportacionGastos {
  tipo: TipoGastoChofer;
  totalFilas: number;
  matcheados: number;
  sinMatchear: number;
}
