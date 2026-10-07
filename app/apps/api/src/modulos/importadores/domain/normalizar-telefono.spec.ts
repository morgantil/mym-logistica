import { normalizarTelefono } from "./normalizar-telefono";

describe("normalizarTelefono", () => {
  it("caso real confirmado por Pablo Renzo: 0 + área + número → +54 9 + área + número", () => {
    expect(normalizarTelefono("01151402322")).toBe("+5491151402322");
  });

  it("decisión 2026-10-07: descarta la anotación de quién es el teléfono, deja solo el número", () => {
    expect(normalizarTelefono("01151402322 (PADRE)")).toBe("+5491151402322");
  });

  it("decisión 2026-10-07: si hay más de un valor en la celda, se queda solo con el primero (el teléfono siempre viene primero)", () => {
    // El segundo (11555132005) se descarta del todo, no se intenta normalizar ni conservar.
    expect(normalizarTelefono("1148053169 / 11555132005")).toBe("+5491148053169");
  });

  it("un solo número con espacios internos como mero formato no se corta a la mitad", () => {
    expect(normalizarTelefono("11 5006 9332 // 11 3811-1141")).toBe("+5491150069332");
  });

  it("bug real 2026-10-06: dos números con su propia anotación cada uno, sin '/' entre ellos — se queda con el primero", () => {
    expect(normalizarTelefono("1138740052 (Madre) 1140387144 (Padre)")).toBe("+5491138740052");
  });

  it("8 dígitos sin área: asume CABA (único código de área del cliente hoy)", () => {
    expect(normalizarTelefono("51402322")).toBe("+5491151402322");
  });

  it("ya viene en formato +54 9 11 ...: lo deja igual (idempotente)", () => {
    expect(normalizarTelefono("+5491151402322")).toBe("+5491151402322");
  });

  it("viene con 54 pero sin el 9 de celular: se lo agrega", () => {
    expect(normalizarTelefono("541151402322")).toBe("+5491151402322");
  });

  it("un número que no se reconoce (ni 8, 10 ni 11 dígitos) deja solo los dígitos, nunca letras", () => {
    expect(normalizarTelefono("123")).toBe("123");
  });

  it("decisión 2026-10-07: sin ningún dígito, nunca deja pasar letras — queda en null", () => {
    expect(normalizarTelefono("Sin teléfono")).toBeNull();
  });

  it("null y vacío quedan en null", () => {
    expect(normalizarTelefono(null)).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("   ")).toBeNull();
  });
});
