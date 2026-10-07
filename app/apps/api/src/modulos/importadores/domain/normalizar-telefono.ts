// Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo): los teléfonos
// hay que mandarlos a SimpliRoute como +54 9 11 ######## — confirmado con un
// caso real ("01151402322" → "+5491151402322", visto en una Visit editada a
// mano en SimpliRoute). Acá se resuelve al importar (no al enviar) para que
// lo que se ve en Pedidos ya sea el valor final.
//
// Decisión 2026-10-07 (Leonardo, en vivo, simplifica lo anterior): el
// resultado SIEMPRE tiene que ser solo dígitos (y el "+" del código de
// país) — nunca letras ni anotaciones entre paréntesis ("PADRE"/"Madre").
// Un Excel real puede traer más de un valor en la misma celda ("1148053169 /
// 11555132005", "1138740052 (Madre) 1140387144 (Padre)") pero el teléfono
// siempre viene primero — se toma solo el primer número que aparece y se
// descarta el resto, sin intentar separar ni conservar lo demás.
const AREA_CODIGO_CABA = "11";

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

// Primer número que aparece en el texto: un "+" opcional seguido de
// dígitos, tolerando espacios/guiones internos como mero formato (ej.
// "11 5006 9332"). Para en el primer carácter que no sea dígito/espacio/
// guion (una "(", una "/", una letra) — ahí termina el teléfono y empieza
// lo que sea que venga después, que se descarta.
const PRIMER_NUMERO = /\+?\d[\d -]*\d|\+?\d/;

// Si no se puede reconocer con confianza como un número argentino (8, 10 u
// 11 dígitos, con o sin 0/15/54/9 de más), se devuelven solo los dígitos tal
// cual vinieron — nunca letras, nunca se inventa un formato que no se puede
// confirmar.
function normalizarUnNumero(numero: string): string {
  let digitos = soloDigitos(numero);
  if (digitos.length === 0) return "";

  // Ya viene con código de país: +54 9 11 ######## (13) o +54 11 ######## (12,
  // sin el 9 de celular — se lo agrega).
  if (digitos.startsWith("54")) {
    const resto = digitos.slice(2);
    if (resto.length === 10 && !resto.startsWith("9")) return `+549${resto}`;
    if (resto.length === 11 && resto.startsWith("9")) return `+54${resto}`;
    return digitos; // No es ninguno de los dos formatos esperados — se dejan los dígitos tal cual.
  }

  // Formato local típico: 0 (código de salida) + 11 (área) + 8 dígitos = 11.
  if (digitos.length === 11 && digitos.startsWith("0")) {
    digitos = digitos.slice(1);
  }
  // A esta altura tendría que quedar área (2) + número (8) = 10 dígitos.
  if (digitos.length === 10) {
    return `+549${digitos}`;
  }
  // Sin código de área (solo 8 dígitos, caso real: números de CABA tipeados
  // sin el "011" ni el "0" adelante) — se asume CABA, el único código de área
  // que usa hoy el cliente (decisión 2026-10-04, Pablo Renzo).
  if (digitos.length === 8) {
    return `+549${AREA_CODIGO_CABA}${digitos}`;
  }

  return digitos; // Ni 8, 10 ni 11 dígitos — no se reconoce, quedan los dígitos tal cual.
}

export function normalizarTelefono(telefono: string | null): string | null {
  if (telefono === null) return null;
  const texto = telefono.trim();
  if (texto === "") return null;

  const match = texto.match(PRIMER_NUMERO);
  if (!match) return null; // Sin ningún dígito — no hay teléfono que normalizar.

  const normalizado = normalizarUnNumero(match[0]);
  return normalizado === "" ? null : normalizado;
}
