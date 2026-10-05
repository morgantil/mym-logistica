// La columna CHOFER del Excel real viene sucia (espacios de más, mayúsculas
// inconsistentes: "MARCOS " vs "MARCOS", "LUCIA " vs "LUCIA") — se normaliza
// solo para COMPARAR contra el nombre real de SimpliRoute, nunca se guarda
// el resultado como si fuera el nombre real (eso lo da el chofer matcheado).
export function normalizarNombreChofer(texto: string): string {
  return texto.trim().toUpperCase().replace(/\s+/g, " ");
}
