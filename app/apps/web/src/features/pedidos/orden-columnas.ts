// Reordena los ids de columna: primero las que el usuario fijó como
// importantes (en el orden en que las fue marcando), después el resto en su
// orden por defecto. Un id fijado que ya no existe en `idsDefault` (ej. si
// algún día se renombra una columna) se ignora en vez de romper — decisión
// 2026-09-01.
export function ordenarColumnas(idsDefault: string[], fijas: string[]): string[] {
  const fijasValidas = fijas.filter((id) => idsDefault.includes(id));
  const resto = idsDefault.filter((id) => !fijasValidas.includes(id));
  return [...fijasValidas, ...resto];
}
