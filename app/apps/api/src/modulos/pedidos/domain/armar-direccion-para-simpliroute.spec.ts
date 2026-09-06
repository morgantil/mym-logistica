import { CabaProvincia } from "@mym/shared-types";
import { armarDireccionParaSimpliRoute } from "./armar-direccion-para-simpliroute";

describe("armarDireccionParaSimpliRoute", () => {
  it("agrega CABA, Argentina cuando clasifica como CABA", () => {
    expect(armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", CabaProvincia.CABA)).toBe(
      "Balcarce 594 -depto 1, Monserrat, CABA, Argentina",
    );
  });

  it("agrega Provincia de Buenos Aires, Argentina cuando clasifica como Provincia", () => {
    expect(armarDireccionParaSimpliRoute("Av. Mitre 100", "Avellaneda", CabaProvincia.PROVINCIA)).toBe(
      "Av. Mitre 100, Avellaneda, Provincia de Buenos Aires, Argentina",
    );
  });

  it("cae a solo dirección + localidad si no se pudo clasificar", () => {
    expect(armarDireccionParaSimpliRoute("Balcarce 594 -depto 1", "Monserrat", null)).toBe(
      "Balcarce 594 -depto 1, Monserrat",
    );
  });
});
