import type { TipoServicioCliente } from "@mym/shared-types";

export interface Cliente {
  id: string;
  nombre: string;
  patronesDeteccion: string[];
  activo: boolean;
  tipoServicio: TipoServicioCliente;
}
