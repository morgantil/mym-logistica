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

// Fila real completa, con las 19 columnas del comprobante fiscal (error real
// corregido 2026-10-07 — antes se perdían al importar, ver gasto-chofer.ts).
function filaRealCompleta(overrides: Record<string, unknown> = {}) {
  return filaReal({
    "Fecha Recepción": new Date("2026-09-04"),
    Cpbte: "TF",
    "Tipo Doc.": 80,
    CUIT: "30-70901115-0",
    Domicilio: "AV MOSCONI 299",
    "C.P.": "1672",
    Pcia: "Buenos Aires",
    "Cond Fisc": "RI",
    "Cód. Neto": "GCL",
    "Neto Gravado": 9372.24,
    "Alíc.": 21,
    "IVA Liquidado": 1968.17,
    "IVA Crédito": 1968.17,
    "Cód. NG/EX": "CYL",
    "Conceptos NG/EX": 109.59,
    "Cód. P/R": "X",
    "Perc./Ret.": 5.5,
    "Pcia P/R": "CABA",
    ...overrides,
  });
}

describe("parsearCombustible", () => {
  it("extrae una línea de una fila real del archivo (hoja HWCompra-modelo)", () => {
    const lineas = parsearCombustible([filaReal()]);

    expect(lineas).toEqual([
      expect.objectContaining({
        fecha: new Date("2026-09-04"),
        monto: 11450.0,
        choferTexto: "MARCOS",
        proveedor: "10 DE SEPTIEMBRE SA",
        comprobante: "A 00007-9739",
      }),
    ]);
  });

  it("extrae las 19 columnas del comprobante fiscal completo", () => {
    const [linea] = parsearCombustible([filaRealCompleta()]);

    expect(linea).toMatchObject({
      fechaRecepcion: new Date("2026-09-04"),
      comprobanteCodigo: "TF",
      comprobanteTipo: "A",
      comprobanteSucursal: "00007",
      comprobanteNumero: "9739",
      tipoDocumento: "80",
      cuit: "30-70901115-0",
      domicilio: "AV MOSCONI 299",
      codigoPostal: "1672",
      provincia: "Buenos Aires",
      condicionFiscal: "RI",
      codigoNeto: "GCL",
      netoGravado: 9372.24,
      alicuota: 21,
      ivaLiquidado: 1968.17,
      ivaCredito: 1968.17,
      codigoNgEx: "CYL",
      conceptosNgEx: 109.59,
      codigoPR: "X",
      percepcionRetencion: 5.5,
      provinciaPR: "CABA",
    });
  });

  it("sin datos fiscales en la fila, los campos quedan null (nunca se inventan)", () => {
    const [linea] = parsearCombustible([filaReal()]);
    expect(linea.cuit).toBeNull();
    expect(linea.netoGravado).toBeNull();
    expect(linea.ivaLiquidado).toBeNull();
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
