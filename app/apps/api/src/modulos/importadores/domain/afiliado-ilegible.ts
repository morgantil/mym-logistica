import { LineaExcelImportada } from "../../pedidos/domain/pedido";

// Notación científica que Excel/CSV deja en lugar del número real
// ("6.04E+14"): los dígitos se perdieron en el archivo de origen y NO se
// pueden recuperar. Caso real de Farmaet (2026-09-24): 160 de 186 filas, de 77
// pacientes que compartían solo 34 valores — como el afiliado identifica a la
// persona en el padrón, se mezclarían pacientes distintos.
const NOTACION_CIENTIFICA = /^\d+([.,]\d+)?e\+\d+$/i;

export function esAfiliadoIlegible(afiliado: string): boolean {
  return NOTACION_CIENTIFICA.test(afiliado.trim());
}

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

// Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo — Farmaet): el
// proceso manual de ellos, hoy, es cargar el número de afiliado roto como
// "Apellido Nombre" (sin la coma), porque así es como matchea contra el
// registro que ya existe en SimpliRoute. Antes usábamos un identificador
// propio ("SIN-AFI-...") — se cambia al texto tal cual lo necesita
// SimpliRoute, sin inventar un formato nuestro para este caso puntual.
function quitarComasYEspaciosDeMas(texto: string): string {
  return texto.replace(/,/g, " ").replace(/\s+/g, " ").trim();
}

// Arma un identificador estable a partir del nombre para los afiliados
// ilegibles: mismo paciente = mismo identificador en cada importación, y dos
// pacientes distintos nunca se mezclan por compartir un "6.04E+14".
//
// Antes se intenta recuperar el número real: si el mismo paciente (mismo
// nombre) aparece en OTRA línea del mismo archivo con el afiliado completo, se
// usa ese (el bulto de un paciente suele traerlo completo aunque sus bolsas no).
// Si ese nombre tiene más de un afiliado completo distinto no se elige ninguno
// (sería adivinar) y cae al nombre completo sin comas.
export function resolverAfiliadosIlegibles(lineas: LineaExcelImportada[]): LineaExcelImportada[] {
  const completosPorNombre = new Map<string, Set<string>>();
  for (const linea of lineas) {
    if (esAfiliadoIlegible(linea.numeroAfiliado)) continue;
    const nombre = normalizarNombre(linea.destinatario);
    const conjunto = completosPorNombre.get(nombre) ?? new Set<string>();
    conjunto.add(linea.numeroAfiliado.trim());
    completosPorNombre.set(nombre, conjunto);
  }

  return lineas.map((linea) => {
    if (!esAfiliadoIlegible(linea.numeroAfiliado)) return linea;
    const nombre = normalizarNombre(linea.destinatario);
    const completos = completosPorNombre.get(nombre);
    if (completos && completos.size === 1) {
      return { ...linea, numeroAfiliado: [...completos][0], afiliadoIlegible: false };
    }
    return {
      ...linea,
      numeroAfiliado: quitarComasYEspaciosDeMas(linea.destinatario),
      afiliadoIlegible: true,
    };
  });
}
