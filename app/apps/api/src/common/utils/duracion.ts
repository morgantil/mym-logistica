const UNIDADES_A_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

// Convierte duraciones estilo JWT ("15m", "7d", "1h") a milisegundos — se usa
// tanto para firmar tokens (@nestjs/jwt las acepta tal cual) como para el
// `maxAge` de la cookie del refresh token, que necesita un número.
export function parseDuracionAMs(duracion: string): number {
  const match = /^(\d+)([smhd])$/.exec(duracion.trim());
  if (!match) {
    throw new Error(`Formato de duración inválido: "${duracion}" (esperado ej. "15m", "7d").`);
  }
  const [, cantidad, unidad] = match;
  return Number(cantidad) * UNIDADES_A_MS[unidad];
}
