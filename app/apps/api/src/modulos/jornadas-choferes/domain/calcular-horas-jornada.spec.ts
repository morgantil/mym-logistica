import { calcularHorasJornada } from "./calcular-horas-jornada";

describe("calcularHorasJornada", () => {
  it("calcula la diferencia en horas (10 a 19 = 9hs)", () => {
    expect(calcularHorasJornada("10:00", "19:00")).toBe(9);
  });

  it("redondea a 2 decimales con minutos sueltos", () => {
    expect(calcularHorasJornada("08:15", "17:45")).toBe(9.5);
  });

  it("devuelve null si falta inicio o fin", () => {
    expect(calcularHorasJornada(null, "19:00")).toBeNull();
    expect(calcularHorasJornada("10:00", null)).toBeNull();
    expect(calcularHorasJornada(null, null)).toBeNull();
  });

  it("devuelve null si fin es anterior o igual a inicio (dato mal cargado)", () => {
    expect(calcularHorasJornada("19:00", "10:00")).toBeNull();
    expect(calcularHorasJornada("10:00", "10:00")).toBeNull();
  });

  it("devuelve null con formato inválido", () => {
    expect(calcularHorasJornada("10h00", "19:00")).toBeNull();
  });
});
