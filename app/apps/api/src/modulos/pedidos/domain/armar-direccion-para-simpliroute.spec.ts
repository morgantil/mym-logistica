import { CabaProvincia } from "@mym/shared-types";
import { armarDireccionParaSimpliRoute } from "./armar-direccion-para-simpliroute";

describe("armarDireccionParaSimpliRoute", () => {
  it("agrega CABA, Argentina cuando clasifica como CABA", () => {
    expect(
      armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", {
        clasificacion: CabaProvincia.CABA,
        partido: null,
      }),
    ).toBe("Balcarce 594 -depto 1, Monserrat, CABA, Argentina");
  });

  it("agrega el partido cuando clasifica como Provincia y se conoce", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. San Martin 3000", "Caseros", {
        clasificacion: CabaProvincia.PROVINCIA,
        partido: "Tres de Febrero",
      }),
    ).toBe("Av. San Martin 3000, Caseros, Tres de Febrero, Provincia de Buenos Aires, Argentina");
  });

  it("no agrega partido si no se pudo determinar", () => {
    expect(
      armarDireccionParaSimpliRoute("Av. Mitre 100", "Avellaneda", {
        clasificacion: CabaProvincia.PROVINCIA,
        partido: null,
      }),
    ).toBe("Av. Mitre 100, Avellaneda, Provincia de Buenos Aires, Argentina");
  });

  it("cae a solo dirección + localidad si no se pudo clasificar", () => {
    expect(armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", null)).toBe(
      "Balcarce 594 -depto 1, Monserrat",
    );
  });
});
