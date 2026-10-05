import { parsearCombustible } from "./parsear-combustible";

function filaReal(overrides: Record<string, unknown> = {}) {
  return {
    "Fecha Emisión": new Date("2026-09-04"),
    Tipo: "A",
    "Suc.": "00007",
    Número: 9739,
    "Razón Social/Denominación Proveedor": "10 DE SEPTIEMBRE SA",
    Total: 11450.0,
    CHOFER: "MARCOS ",
    ...overrides,
  };
}

describe("parsearCombustible", () => {
  it("extrae una línea de una fila real del archivo (hoja HWCompra-modelo)", () => {
    const lineas = parsearCombustible([filaReal()]);

    expect(lineas).toEqual([
      {
        fecha: new Date("2026-09-04"),
        monto: 11450.0,
        choferTexto: "MARCOS",
        proveedor: "10 DE SEPTIEMBRE SA",
        comprobante: "A 00007-9739",
      },
    ]);
  });

  it("ignora filas sin fecha real (ej. una fila de totales)", () => {
    expect(parsearCombustible([filaReal({ "Fecha Emisión": null })])).toEqual([]);
  });

  it("ignora filas sin Total positivo", () => {
    expect(parsearCombustible([filaReal({ Total: 0 })])).toEqual([]);
    expect(parsearCombustible([filaReal({ Total: null })])).toEqual([]);
  });

  it("fila sin chofer se importa igual, con un texto fijo para la cola de 'sin asignar'", () => {
    const [linea] = parsearCombustible([filaReal({ CHOFER: null })]);
    expect(linea.choferTexto).toBe("(sin chofer en el archivo)");
  });
});
