import type { ZonaTarifaria } from "@mym/shared-types";

export type { ZonaTarifaria };

export interface LocalidadZonaTarifaria {
  id: string;
  localidad: string;
  zonaTarifariaId: string;
  zonaTarifaria: { nombre: string };
}
