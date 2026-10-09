const FORMATEADOR_MONTO = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatearMonto(monto: number): string {
  return FORMATEADOR_MONTO.format(monto);
}

// Espejo de calcularHorasJornada (backend) — mismo criterio: HH:mm, mismo
// día, null si falta algo o si fin es anterior/igual a inicio.
export function calcularHorasJornada(horaInicio: string | null, horaFin: string | null): number | null {
  const minutos = (hora: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hora);
    if (!match) return null;
    const [, horas, mins] = match;
    return Number(horas) * 60 + Number(mins);
  };
  if (!horaInicio || !horaFin) return null;
  const inicio = minutos(horaInicio);
  const fin = minutos(horaFin);
  if (inicio === null || fin === null || fin <= inicio) return null;
  return Math.round(((fin - inicio) / 60) * 100) / 100;
}

export const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
