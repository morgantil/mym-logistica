// Total de horas trabajadas = hora de fin menos hora de inicio, mismo día
// (los recorridos no cruzan medianoche) — si falta alguna de las dos, o si
// fin es anterior/igual a inicio (dato mal cargado), no hay total: null.
export function calcularHorasJornada(horaInicio: string | null, horaFin: string | null): number | null {
  if (!horaInicio || !horaFin) return null;

  const minutos = (hora: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hora);
    if (!match) return null;
    const [, horas, mins] = match;
    return Number(horas) * 60 + Number(mins);
  };

  const inicio = minutos(horaInicio);
  const fin = minutos(horaFin);
  if (inicio === null || fin === null || fin <= inicio) return null;

  return Math.round(((fin - inicio) / 60) * 100) / 100;
}
