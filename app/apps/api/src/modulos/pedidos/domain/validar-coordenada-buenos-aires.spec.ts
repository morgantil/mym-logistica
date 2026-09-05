import { estaDentroDeBuenosAires } from "./validar-coordenada-buenos-aires";

describe("estaDentroDeBuenosAires", () => {
  it("acepta una coordenada real de CABA (Obelisco)", () => {
    expect(estaDentroDeBuenosAires(-34.6037, -58.3816)).toBe(true);
  });

  it("acepta una coordenada real de GBA (Belgrano/Nuñez)", () => {
    expect(estaDentroDeBuenosAires(-34.5631, -58.4559)).toBe(true);
  });

  it("acepta una coordenada real de La Plata (borde sur del conurbano)", () => {
    expect(estaDentroDeBuenosAires(-34.9214, -57.9544)).toBe(true);
  });

  it("rechaza la coordenada real del caso San Luis (caso 2026-09-04)", () => {
    expect(estaDentroDeBuenosAires(-33.68189, -65.4664)).toBe(false);
  });

  it("rechaza el centroide geográfico de Argentina", () => {
    expect(estaDentroDeBuenosAires(-38.416097, -63.616672)).toBe(false);
  });
});
