import type { ZonaTarifaria } from "@mym/shared-types";

export type { ZonaTarifaria };

export interface LocalidadZonaTarifaria {
  id: string;
  localidad: string;
  zonaTarifariaId: string;
  zonaTarifaria: { nombre: string };
}

// Mapeo Zona de SimpliRoute → ZonaTarifaria (Cordón) — decisión 2026-08-26.
export interface ZonaSimpliRouteZonaTarifaria {
  zonaSimpliRouteId: number;
  zonaTarifariaId: string;
  zonaTarifaria: { nombre: string };
}
