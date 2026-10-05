import { TipoGastoChofer } from "@mym/shared-types";

// ABM de combustible y peajes por chofer — ver comentario en schema.prisma.
export interface GastoChofer {
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
