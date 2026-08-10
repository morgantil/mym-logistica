export interface Chofer {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Zona {
  id: string;
  nombre: string;
}

export interface ZonaConChofer extends Zona {
  chofer: Chofer | null;
}
