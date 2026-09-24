import { TipoEnvase } from "@mym/shared-types";
import { textoEtiquetaEnvase, tiposEnvasePorEtiqueta } from "./etiquetas-envase";

describe("tiposEnvasePorEtiqueta", () => {
  it("Farmaet: 5 bolsas + 1 bulto = 6 etiquetas, bolsas primero", () => {
    const tipos = tiposEnvasePorEtiqueta(
      [
        ...Array.from({ length: 5 }, () => ({ cantidad: 1, tipoEnvase: TipoEnvase.BOLSA })),
        { cantidad: 1, tipoEnvase: TipoEnvase.BULTO },
      ],
      6,
    );
    expect(tipos).toEqual([
      TipoEnvase.BOLSA,
      TipoEnvase.BOLSA,
      TipoEnvase.BOLSA,
      TipoEnvase.BOLSA,
      TipoEnvase.BOLSA,
      TipoEnvase.BULTO,
    ]);
  });

  it("Bella Vista: 4 bultos y 1 bolsa = 5 etiquetas", () => {
    const tipos = tiposEnvasePorEtiqueta(
      [
        { cantidad: 4, tipoEnvase: TipoEnvase.BULTO },
        { cantidad: 1, tipoEnvase: TipoEnvase.BOLSA },
      ],
      5,
    );
    expect(tipos).toEqual([
      TipoEnvase.BOLSA,
      TipoEnvase.BULTO,
      TipoEnvase.BULTO,
      TipoEnvase.BULTO,
      TipoEnvase.BULTO,
    ]);
  });

  it("devuelve null si los bultos se corrigieron a mano y ya no coinciden", () => {
    expect(tiposEnvasePorEtiqueta([{ cantidad: 2, tipoEnvase: TipoEnvase.BOLSA }], 3)).toBeNull();
  });

  it("devuelve null para pañales (sin tipo de envase)", () => {
    expect(tiposEnvasePorEtiqueta([{ cantidad: 4, tipoEnvase: null }], 4)).toBeNull();
  });
});

describe("textoEtiquetaEnvase", () => {
  it("Bolsa para bolsa, Bulto para todo lo demás", () => {
    expect(textoEtiquetaEnvase(TipoEnvase.BOLSA)).toBe("Bolsa");
    expect(textoEtiquetaEnvase(TipoEnvase.BULTO)).toBe("Bulto");
    expect(textoEtiquetaEnvase(null)).toBe("Bulto");
  });
});
