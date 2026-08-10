import { parseDuracionAMs } from "./duracion";

describe("parseDuracionAMs", () => {
  it("convierte minutos, horas y días correctamente", () => {
    expect(parseDuracionAMs("15m")).toBe(15 * 60_000);
    expect(parseDuracionAMs("1h")).toBe(3_600_000);
    expect(parseDuracionAMs("7d")).toBe(7 * 86_400_000);
  });

  it("rechaza formatos inválidos en vez de devolver algo silenciosamente mal", () => {
    expect(() => parseDuracionAMs("una semana")).toThrow();
    expect(() => parseDuracionAMs("7")).toThrow();
    expect(() => parseDuracionAMs("7w")).toThrow(); // unidad no soportada
  });
});
