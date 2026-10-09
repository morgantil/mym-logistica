// Jornada de un chofer en un día puntual — ver comentario en schema.prisma
// (model JornadaChofer) para el porqué de la carga manual en vez de traerlo
// de SimpliRoute. horaInicio/horaFin: texto "HH:mm" o null si no se cargó.
export interface JornadaChofer {
  id: string;
  choferId: string;
  choferNombre: string;
  fecha: Date;
  horaInicio: string | null;
  horaFin: string | null;
  creadoEn: Date;
}
