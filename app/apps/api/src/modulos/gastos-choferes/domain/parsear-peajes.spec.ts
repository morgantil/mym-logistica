import { parsearPeajes } from "./parsear-peajes";

describe("parsearPeajes", () => {
  it("extrae las líneas reales, saltando el título y la fila en blanco (archivo septiembre 2026)", () => {
    const filas = [
      { A: "PEAJES ", B: "SEPTIRMBRE ", C: 2026 }, // fila 1: título de la hoja, no un chofer
      { A: " " }, // fila 2: en blanco
      { A: "MATIAS ", C: 32300 },
      { A: "MATIAS ", C: 4400 },
      { A: "SEBA", C: 277315 },
    ];

    expect(parsearPeajes(filas)).toEqual([
      { choferTexto: "MATIAS ", monto: 32300 },
      { choferTexto: "MATIAS ", monto: 4400 },
      { choferTexto: "SEBA", monto: 277315 },
    ]);
  });

  it("no confunde el título 'PEAJES' de la hoja con un chofer real", () => {
    expect(parsearPeajes([{ A: "PEAJES", C: 2026 }])).toEqual([]);
    expect(parsearPeajes([{ A: "peajes ", C: 2026 }])).toEqual([]);
  });

  it("ignora filas sin monto positivo en la columna C", () => {
    expect(parsearPeajes([{ A: "MATIAS", C: null }])).toEqual([]);
    expect(parsearPeajes([{ A: "MATIAS", C: 0 }])).toEqual([]);
  });
});
