import { TipoEnvase } from "@mym/shared-types";

// Convierte las dos formas reales en que Bolsa/Bulto llegan en un Excel de
// medicamentos (verificado contra los archivos reales de Farmaet y Bella
// Vista, 2026-09-13 — ver TEMAS_PENDIENTES.md §13.14) en `TipoEnvase[]` para
// alimentar la clasificación que ya existe (`determinarClasificacionMedicamento`,
// facturacion/domain/clasificacion-medicamento.ts) — ninguna de las dos
// funciones de acá decide "Bolsa+Bulto → Bulto" por su cuenta, eso ya está
// resuelto y testeado ahí; esto solo junta la materia prima.

// Farmaet: la columna "Empresa" trae el envase como texto libre (ej. "M&M
// BOLSA", "M&M BULTO") — el nombre de la empresa antes es ruido, lo único
// que importa es si el texto contiene "BOLSA" o "BULTO". Si contuviera los
// dos a la vez (no visto en los datos reales) o ninguno, no se puede
// clasificar sin inventar — null, igual criterio que el resto del sistema.
export function parseEnvaseDesdeTexto(texto: string | null): TipoEnvase | null {
  if (!texto) return null;
  const normalizado = texto.trim().toUpperCase();
  const tieneBolsa = normalizado.includes("BOLSA");
  const tieneBulto = normalizado.includes("BULTO");
  if (tieneBolsa && !tieneBulto) return TipoEnvase.BOLSA;
  if (tieneBulto && !tieneBolsa) return TipoEnvase.BULTO;
  return null;
}

// Bella Vista: dos columnas de CANTIDAD ("BULTO"/"BOLSA") en la misma fila —
// a diferencia de Farmapal/Farmaet (una línea por envase, agrupadas después),
// acá una sola fila puede representar los dos envases a la vez (ej. BULTO=4,
// BOLSA=1, verificado con 5 casos reales). Se devuelve un TipoEnvase por
// cada cantidad > 0 presente, para que el llamador junte esta lista con las
// de otras líneas del mismo pedido (si las hay) antes de clasificar.
export function envasesDesdeCantidades(
  cantidadBulto: number | null,
  cantidadBolsa: number | null,
): TipoEnvase[] {
  const envases: TipoEnvase[] = [];
  if (cantidadBulto && cantidadBulto > 0) envases.push(TipoEnvase.BULTO);
  if (cantidadBolsa && cantidadBolsa > 0) envases.push(TipoEnvase.BOLSA);
  return envases;
}
