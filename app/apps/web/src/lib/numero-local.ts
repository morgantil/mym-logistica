// Bug real 2026-10-08 (reunión, "no nos funciona" al guardar un monto como
// "9372,24"): `<input type="number">` no acepta coma como separador decimal
// — en el teclado numérico en español de un celular (que muestra "," en vez
// de "."), el valor tipeado queda inválido para el input nativo sin ningún
// aviso visible. La solución es no usar `type="number"` para montos: un
// `<Input type="text" inputMode="decimal">` sigue mostrando teclado
// numérico en el celular, y esta función acepta los dos separadores.
export function aNumeroLocal(texto: string): number {
  return Number(texto.replace(",", "."));
}
