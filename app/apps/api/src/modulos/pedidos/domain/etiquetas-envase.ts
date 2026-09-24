import { TipoEnvase } from "@mym/shared-types";

// Decisión 2026-09-24 (Leonardo + cliente): en medicamentos se imprime UNA
// etiqueta por cada Bolsa y cada Bulto que dice el archivo (5 bolsas + 1
// bulto = 6 etiquetas), y cada etiqueta dice de cuál es ("Bolsa 3/6",
// "Bulto 6/6"). Devuelve el tipo de envase de cada etiqueta, en orden:
// primero las bolsas y después los bultos. Si la cantidad de bultos del
// pedido se corrigió a mano y ya no coincide con las líneas, no se puede
// saber qué etiqueta es de qué — devuelve null y la etiqueta queda genérica.
export function tiposEnvasePorEtiqueta(
  productos: { cantidad: number; tipoEnvase: TipoEnvase | null }[],
  totalBultos: number,
): TipoEnvase[] | null {
  if (productos.length === 0 || productos.some((producto) => producto.tipoEnvase === null)) return null;

  const expandido: TipoEnvase[] = [];
  for (const tipo of [TipoEnvase.BOLSA, TipoEnvase.BULTO]) {
    for (const producto of productos) {
      if (producto.tipoEnvase === tipo) {
        for (let i = 0; i < producto.cantidad; i++) expandido.push(tipo);
      }
    }
  }
  return expandido.length === totalBultos ? expandido : null;
}

export function textoEtiquetaEnvase(tipo: TipoEnvase | null): string {
  return tipo === TipoEnvase.BOLSA ? "Bolsa" : "Bulto";
}
