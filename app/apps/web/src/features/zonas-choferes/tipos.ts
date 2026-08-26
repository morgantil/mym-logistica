// Estos tipos ya no describen entidades propias — describen el cache de
// solo lectura que el backend sincroniza desde SimpliRoute (ver
// DOCUMENTO TECNICO.md historial 2026-08-25/26). Los `id` son los IDs
// numéricos reales de SimpliRoute.

export interface Zona {
  id: number;
  nombre: string;
  habilitada: boolean;
  dias: string[];
  vehiculosIds: number[];
  // Informativo: primer vehículo asignado a la zona en SimpliRoute → su
  // chofer predeterminado. No es editable desde acá.
  chofer: { id: number; nombre: string } | null;
}

export interface Chofer {
  id: number;
  nombre: string;
  username: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
}

export interface DatosChofer {
  nombre: string;
  username: string;
  telefono?: string;
  email?: string;
  password?: string; // requerido al crear
}

export interface Vehiculo {
  id: number;
  nombre: string;
  patente: string | null;
  choferPredeterminadoId: number | null;
  estado: string;
}

export interface DatosVehiculo {
  nombre: string;
  patente?: string;
  choferPredeterminadoId?: number;
}
