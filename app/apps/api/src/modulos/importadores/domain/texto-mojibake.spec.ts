import { repararMojibake } from "./texto-mojibake";

describe("repararMojibake", () => {
  it("repara los casos reales de Farmaet", () => {
    expect(repararMojibake("Hughes NÂ° 225 RUTA 9")).toBe("Hughes N° 225 RUTA 9");
    expect(repararMojibake("BelÃ©n de Escobar")).toBe("Belén de Escobar");
    expect(repararMojibake("FLIA AVEDAÃ‘O")).toBe("FLIA AVEDAÑO");
  });

  it("deja igual el texto que ya está bien", () => {
    expect(repararMojibake("Belén de Escobar")).toBe("Belén de Escobar");
    expect(repararMojibake("Calle 9 de Julio")).toBe("Calle 9 de Julio");
  });

  it("no toca un texto con Â/Ã que no es mojibake válido", () => {
    expect(repararMojibake("ÃÂ")).toBe("ÃÂ");
    expect(repararMojibake("Año Ã 2026 ✓")).toBe("Año Ã 2026 ✓");
  });
});
