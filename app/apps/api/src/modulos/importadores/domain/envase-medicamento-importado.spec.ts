import { TipoEnvase } from "@mym/shared-types";
import { envasesDesdeCantidades, parseEnvaseDesdeTexto } from "./envase-medicamento-importado";

describe("parseEnvaseDesdeTexto (Farmaet)", () => {
  it("reconoce Bolsa en el texto real de Farmaet", () => {
    expect(parseEnvaseDesdeTexto("M&M BOLSA")).toBe(TipoEnvase.BOLSA);
  });

  it("reconoce Bulto en el texto real de Farmaet", () => {
    expect(parseEnvaseDesdeTexto("M&M BULTO")).toBe(TipoEnvase.BULTO);
  });

  it("no le importa mayúsculas/minúsculas ni espacios", () => {
    expect(parseEnvaseDesdeTexto("  m&m bolsa  ")).toBe(TipoEnvase.BOLSA);
  });

  it("no inventa una clasificación si no reconoce ninguna palabra", () => {
    expect(parseEnvaseDesdeTexto("OTRA EMPRESA")).toBeNull();
  });

  it("no inventa una clasificación si el texto trae las dos palabras a la vez", () => {
    expect(parseEnvaseDesdeTexto("BOLSA Y BULTO")).toBeNull();
  });

  it("null si no hay texto", () => {
    expect(parseEnvaseDesdeTexto(null)).toBeNull();
  });
});

describe("envasesDesdeCantidades (Bella Vista)", () => {
  it("solo Bulto con cantidad > 0", () => {
    expect(envasesDesdeCantidades(1, 0)).toEqual([TipoEnvase.BULTO]);
  });

  it("solo Bolsa con cantidad > 0", () => {
    expect(envasesDesdeCantidades(0, 1)).toEqual([TipoEnvase.BOLSA]);
  });

  // Caso real verificado: CHIESA NORMA CATALINA, bulto=4 bolsa=1.
  it("los dos a la vez cuando ambas cantidades son > 0 (caso real verificado)", () => {
    expect(envasesDesdeCantidades(4, 1)).toEqual([TipoEnvase.BULTO, TipoEnvase.BOLSA]);
  });

  it("ninguno si las dos cantidades son 0 o null", () => {
    expect(envasesDesdeCantidades(0, 0)).toEqual([]);
    expect(envasesDesdeCantidades(null, null)).toEqual([]);
  });
});
