import type { TipoGastoChofer } from "@mym/shared-types";

export interface GastoChofer {
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
