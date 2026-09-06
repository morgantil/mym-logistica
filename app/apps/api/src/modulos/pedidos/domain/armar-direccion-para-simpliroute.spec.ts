import { CabaProvincia } from "@mym/shared-types";
import { armarDireccionParaSimpliRoute } from "./armar-direccion-para-simpliroute";

describe("armarDireccionParaSimpliRoute", () => {
  it("agrega el barrio oficial + CABA, Argentina cuando clasifica como CABA", () => {
    expect(
      armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", {
        clasificacion: CabaProvincia.CABA,
        localidadOficial: "Monserrat",
        partido: null,
      }),
    ).toBe("Balcarce 594 -depto 1, Monserrat, CABA, Argentina");
  });

  it("usa el nombre oficial con acento, no la variante cruda del Excel", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. San Martin 3000", "Villa Pueyrredon", {
        clasificacion: CabaProvincia.CABA,
        localidadOficial: "Villa Pueyrredón",
        partido: null,
      }),
    ).toBe("Av. San Martin 3000, Villa Pueyrredón, CABA, Argentina");
  });

  it("no repite CABA cuando el sinónimo directo (ej. 'Capital Federal') ya resolvió a CABA", () => {
    expect(
      armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Capital Federal", {
        clasificacion: CabaProvincia.CABA,
        localidadOficial: "CABA",
        partido: null,
      }),
    ).toBe("Balcarce 594 -depto 1, CABA, Argentina");
  });

  it("agrega el partido y el nombre oficial cuando clasifica como Provincia", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. San Martin 3000", "Caseros", {
        clasificacion: CabaProvincia.PROVINCIA,
        localidadOficial: "Caseros",
        partido: "Tres de Febrero",
      }),
    ).toBe("Av. San Martin 3000, Caseros, Tres de Febrero, Provincia de Buenos Aires, Argentina");
  });

  it("no repite el partido si es igual a la localidad", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. Maipu 2000", "Vicente Lopez", {
        clasificacion: CabaProvincia.PROVINCIA,
        localidadOficial: "Vicente López",
        partido: "Vicente López",
      }),
    ).toBe("Av. Maipu 2000, Vicente López, Provincia de Buenos Aires, Argentina");
  });

  it("no agrega partido si no se pudo determinar", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. Mitre 100", "Avellaneda", {
        clasificacion: CabaProvincia.PROVINCIA,
        localidadOficial: "Avellaneda",
        partido: null,
      }),
    ).toBe("Av. Mitre 100, Avellaneda, Provincia de Buenos Aires, Argentina");
  });

  it("cae a solo dirección + localidad cruda si no se pudo clasificar", () => {
    expect(armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", null)).toBe(
      "Balcarce 594 -depto 1, Monserrat",
    );
  });
});
