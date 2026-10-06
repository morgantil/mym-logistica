// Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo): los teléfonos
// hay que mandarlos a SimpliRoute como +54 9 11 ######## — confirmado con un
// caso real ("01151402322" → "+5491151402322", visto en una Visit editada a
// mano en SimpliRoute). Acá se resuelve al importar (no al enviar) para que
// lo que se ve en Pedidos ya sea el valor final.
//
// Un Excel real puede traer más de un teléfono en la misma celda, separados
// por "/" o "//" ("1148053169 / 11555132005"), por un simple espacio cuando
// cada uno ya trae su propia anotación ("1138740052 (Madre) 1140387144
// (Padre)" — bug real encontrado en reunión 2026-10-06, antes esto se perdía
// entero sin normalizar porque el separador solo reconocía "/"), o solo una
// anotación sin otro número ("01151402322 (PADRE)") — nada de esto se
// descarta, se normaliza cada número por separado y se vuelve a unir,
// conservando su anotación.
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
// Un número puede venir con espacios/guiones internos como mero formato
// ("11 5006 9332"), así que no alcanza con cortar por cualquier espacio —
// eso rompería ese caso real en dos números inventados ("11" + "5006" +
// "9332"). El único punto donde SÍ hay que cortar dentro de una "parte" es
// justo después de un paréntesis: ahí un número ya terminó y, si sigue algo
// más, es el próximo número.
const NUMERO_CON_ANOTACION = /([^()]*)\(([^)]*)\)/g;

// Bug real 2026-10-06: con dos números y su propia anotación cada uno, sin
// "/" entre ellos ("1138740052 (Madre) 1140387144 (Padre)"), antes se
// perdía entero — la anotación al final "comía" todo el texto previo como
// si fuera un solo número, que no matcheaba ningún formato reconocido y
// quedaba sin normalizar. Ahora se separa en un número por cada paréntesis
// encontrado (conservando su propia anotación), y si queda texto suelto
// después del último paréntesis, se trata como un número más sin anotación.
function normalizarParte(parte: string): string {
  if (!parte.includes("(")) return normalizarUnNumero(parte);

  const resultado: string[] = [];
  let finDelUltimoMatch = 0;
  for (const match of parte.matchAll(NUMERO_CON_ANOTACION)) {
    const [textoCompleto, numero, anotacion] = match;
    resultado.push(`${normalizarUnNumero(numero)} (${anotacion})`);
    finDelUltimoMatch = (match.index ?? 0) + textoCompleto.length;
  }
  const restante = parte.slice(finDelUltimoMatch).trim();
  if (restante !== "") resultado.push(normalizarUnNumero(restante));
  return resultado.join(" / ");
}

export function normalizarTelefono(telefono: string | null): string | null {
  if (telefono === null) return null;
  const texto = telefono.trim();
  if (texto === "") return null;

  return texto
    .split(SEPARADOR_VARIOS_TELEFONOS)
    .map((parte) => parte.trim())
    .filter((parte) => parte !== "")
    .map(normalizarParte)
    .join(" / ");
}
