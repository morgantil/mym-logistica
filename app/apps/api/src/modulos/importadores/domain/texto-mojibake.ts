// Caracteres que Windows-1252 pone en los bytes 0x80-0x9F (donde Latin-1 tiene
// controles) — hacen falta para deshacer el mojibake de Ñ (bytes C3 91 →
// "Ã‘"), la comilla ‘ es el byte 0x91.
const CP1252_A_BYTE: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
  "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91,
  "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98,
  "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

// Repara texto UTF-8 que alguien leyó como Windows-1252/Latin-1 ("NÂ°" en vez
// de "N°", "BelÃ©n" en vez de "Belén") — caso real de Farmaet (2026-09-24),
// viene de una exportación CSV mal codificada. Solo toca textos que tienen esas
// marcas (Ã o Â) y solo si el resultado es UTF-8 válido y más corto; cualquier
// otro texto vuelve idéntico.
export function repararMojibake(texto: string): string {
  if (!/[ÃÂ]/.test(texto)) return texto;

  const bytes: number[] = [];
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0)!;
    if (codigo <= 0xff) bytes.push(codigo);
    else if (CP1252_A_BYTE[caracter] !== undefined) bytes.push(CP1252_A_BYTE[caracter]);
    else return texto; // no es este problema
  }

  const reparado = Buffer.from(bytes).toString("utf8");
  return reparado.includes("�") || reparado.length >= texto.length ? texto : reparado;
}
