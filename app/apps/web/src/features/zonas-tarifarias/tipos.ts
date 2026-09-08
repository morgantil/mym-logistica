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

// Mapeo Partido/Municipio → ZonaTarifaria (Cordón) — decisión 2026-09-08,
// más preciso que el de zonas de SimpliRoute (esas cruzan varios partidos
// reales cada una). El backend ya devuelve la lista completa de partidos
// conocidos (geografía fija), con zonaTarifariaId null para los que
// todavía no se asignaron — no hace falta cruzarlo con otra lista acá.
export interface PartidoZonaTarifaria {
  partido: string;
  zonaTarifariaId: string | null;
  zonaTarifaria: { nombre: string } | null;
}
