import { PrioridadPedido } from "@mym/shared-types";
import { CampoCanonico } from "./campo-canonico";
import { aplicarReglasImportacion, coincideTexto, ReglaImportacion } from "./reglas-importacion";

function regla(parcial: Partial<ReglaImportacion>): ReglaImportacion {
  return {
    id: "r1",
    clienteId: "c1",
    campoOrigen: "ticket",
    tipoCoincidencia: "CONTIENE",
    valor: "R-0011",
    accion: "ASIGNAR_VALOR",
    campoDestino: "retiroDeReceta",
    valorDestino: "RR",
    orden: 0,
    activa: true,
    ...parcial,
  };
}

const leer = (valores: Partial<Record<CampoCanonico, string>>) => (campo: CampoCanonico) => valores[campo] ?? null;

describe("coincideTexto", () => {
  it("compara sin distinguir mayúsculas ni acentos", () => {
    expect(coincideTexto("Urgencia 24 hs", "EMPIEZA_CON", "URGENCIA")).toBe(true);
    expect(coincideTexto("Físico", "IGUAL", "fisico")).toBe(true);
  });

  it("IGUAL exige el texto completo, EMPIEZA_CON el comienzo y CONTIENE cualquier parte", () => {
    expect(coincideTexto("RR EV", "IGUAL", "RR")).toBe(false);
    expect(coincideTexto("RR EV", "EMPIEZA_CON", "RR")).toBe(true);
    expect(coincideTexto("R-46777 // R-0011-00004626", "CONTIENE", "R-0011")).toBe(true);
  });

  it("un valor vacío o un texto nulo nunca coinciden", () => {
    expect(coincideTexto(null, "CONTIENE", "X")).toBe(false);
    expect(coincideTexto("algo", "CONTIENE", "  ")).toBe(false);
  });
});

describe("aplicarReglasImportacion", () => {
  it("R-0011 en el remito asigna Retiro de receta = RR", () => {
    const resultado = aplicarReglasImportacion([regla({})], leer({ ticket: "R-0011-00004550" }));
    expect(resultado.retiroDeReceta).toBe("RR");
  });

  it("no asigna nada si la condición no se cumple", () => {
    const resultado = aplicarReglasImportacion([regla({})], leer({ ticket: "R-0004-00046770" }));
    expect(resultado).toEqual({});
  });

  it("URGENCIA en Tiempo de entrega asigna prioridad URGENTE", () => {
    const urgente = regla({
      campoOrigen: "tiempoDeEntrega",
      tipoCoincidencia: "EMPIEZA_CON",
      valor: "URGENCIA",
      campoDestino: "prioridad",
      valorDestino: "URGENTE",
    });
    expect(aplicarReglasImportacion([urgente], leer({ tiempoDeEntrega: "URGENCIA 48 HS" })).prioridad).toBe(
      PrioridadPedido.URGENTE,
    );
    expect(aplicarReglasImportacion([urgente], leer({ tiempoDeEntrega: "72 HS HABITUAL" })).prioridad).toBeUndefined();
  });

  it("con varias reglas de prioridad que aplican, gana la más alta", () => {
    const urgente = regla({ campoOrigen: "tiempoDeEntrega", valor: "URGENCIA", campoDestino: "prioridad", valorDestino: "URGENTE" });
    const critica = regla({ id: "r2", campoOrigen: "tiempoDeEntrega", valor: "24", campoDestino: "prioridad", valorDestino: "CRITICA" });
    expect(aplicarReglasImportacion([urgente, critica], leer({ tiempoDeEntrega: "URGENCIA 24 HS" })).prioridad).toBe(
      PrioridadPedido.CRITICA,
    );
  });

  it("ignora una prioridad de destino inválida", () => {
    const rota = regla({ campoOrigen: "tiempoDeEntrega", valor: "URGENCIA", campoDestino: "prioridad", valorDestino: "INVENTADA" });
    expect(aplicarReglasImportacion([rota], leer({ tiempoDeEntrega: "URGENCIA 24 HS" })).prioridad).toBeUndefined();
  });

  it("QUITAR_PREFIJO saca OSDE del comienzo del afiliado", () => {
    const osde = regla({
      campoOrigen: "numeroAfiliado",
      tipoCoincidencia: "EMPIEZA_CON",
      valor: "OSDE",
      accion: "QUITAR_PREFIJO",
      campoDestino: "numeroAfiliado",
    });
    expect(aplicarReglasImportacion([osde], leer({ numeroAfiliado: "OSDE61084055903" })).numeroAfiliado).toBe("61084055903");
    expect(aplicarReglasImportacion([osde], leer({ numeroAfiliado: "61084055903" })).numeroAfiliado).toBeUndefined();
  });

  it("ignora las reglas inactivas", () => {
    expect(aplicarReglasImportacion([regla({ activa: false })], leer({ ticket: "R-0011-1" }))).toEqual({});
  });
});
