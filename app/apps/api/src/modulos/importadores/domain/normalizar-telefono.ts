// Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo): los teléfonos
// hay que mandarlos a SimpliRoute como +54 9 11 ######## — confirmado con un
// caso real ("01151402322" → "+5491151402322", visto en una Visit editada a
// mano en SimpliRoute). Acá se resuelve al importar (no al enviar) para que
// lo que se ve en Pedidos ya sea el valor final.
//
// Un Excel real puede traer más de un teléfono en la misma celda, separados
// por "/" o "//" ("1148053169 / 11555132005"), y una anotación de quién es
// ("01151402322 (PADRE)") — eso no se descarta, se normaliza cada número por
// separado y se vuelve a unir, conservando la anotación.
const AREA_CODIGO_CABA = "11";

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

// Un solo número (sin la anotación entre paréntesis todavía separada). Si no
// se puede reconocer con confianza como un numero argentino de 10 dígitos
// (con o sin 0/15/54/9 de más), se devuelve tal cual vino — nunca se inventa
// un número a partir de algo que no se entiende.
function normalizarUnNumero(numero: string): string {
  let digitos = soloDigitos(numero);
  if (digitos.length === 0) return numero.trim();

  // Ya viene con código de país: +54 9 11 ######## (13) o +54 11 ######## (12,
  // sin el 9 de celular — se lo agrega).
  if (digitos.startsWith("54")) {
    const resto = digitos.slice(2);
    if (resto.length === 10 && !resto.startsWith("9")) return `+549${resto}`;
    if (resto.length === 11 && resto.startsWith("9")) return `+54${resto}`;
    return numero.trim(); // No es ninguno de los dos formatos esperados — no se toca.
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

  return numero.trim(); // Ni 8, 10 ni 11 dígitos — no se reconoce, se deja como vino.
}

const SEPARADOR_VARIOS_TELEFONOS = /\s*\/{1,2}\s*/;
const ANOTACION_AL_FINAL = /^(.*?)(\s*\([^)]*\))\s*$/;

export function normalizarTelefono(telefono: string | null): string | null {
  if (telefono === null) return null;
  const texto = telefono.trim();
  if (texto === "") return null;

  return texto
    .split(SEPARADOR_VARIOS_TELEFONOS)
    .map((parte) => parte.trim())
    .filter((parte) => parte !== "")
    .map((parte) => {
      const conAnotacion = parte.match(ANOTACION_AL_FINAL);
      if (!conAnotacion) return normalizarUnNumero(parte);
      const [, numero, anotacion] = conAnotacion;
      return `${normalizarUnNumero(numero)}${anotacion}`;
    })
    .join(" / ");
}
