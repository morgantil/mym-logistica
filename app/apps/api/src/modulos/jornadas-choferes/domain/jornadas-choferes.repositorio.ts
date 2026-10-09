import { JornadaChofer } from "./jornada-chofer";

export interface DatosJornadaChofer {
  choferId: string;
  choferNombre: string;
  fecha: Date;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface FiltroJornadasChofer {
  fechaDesde?: Date;
  fechaHasta?: Date;
  choferId?: string;
}

export interface JornadasChoferesRepositorio {
  // Carga manual, una por chofer+día (item 4.4 TEMAS_PENDIENTES.md) — si ya
  // existe una jornada para ese chofer en esa fecha, la reemplaza en vez de
  // duplicar (constraint única choferId+fecha en la base).
  guardar(datos: DatosJornadaChofer): Promise<JornadaChofer>;
  eliminar(id: string): Promise<void>;
  listar(filtro: FiltroJornadasChofer): Promise<JornadaChofer[]>;
}

export const JORNADAS_CHOFERES_REPOSITORIO = Symbol("JORNADAS_CHOFERES_REPOSITORIO");
