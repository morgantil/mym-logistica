import { normalizarTelefono } from "./normalizar-telefono";

describe("normalizarTelefono", () => {
  it("caso real confirmado por Pablo Renzo: 0 + área + número → +54 9 + área + número", () => {
    expect(normalizarTelefono("01151402322")).toBe("+5491151402322");
  });

  it("conserva la anotación de quién es el teléfono", () => {
    expect(normalizarTelefono("01151402322 (PADRE)")).toBe("+5491151402322 (PADRE)");
  });

  it("normaliza cada teléfono por separado y los vuelve a unir con /", () => {
    // El segundo (11 dígitos, no empieza con 0) no es un formato reconocido
    // con confianza — queda tal cual, no se inventa nada.
    expect(normalizarTelefono("1148053169 / 11555132005")).toBe("+5491148053169 / 11555132005");
  });

  it("acepta // como separador (visto en un Excel real de Bella Vista)", () => {
    expect(normalizarTelefono("11 5006 9332 // 11 3811-1141")).toBe("+5491150069332 / +5491138111141");
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

  it("un número que no se reconoce (ni 8, 10 ni 11 dígitos) se deja tal cual, no se inventa nada", () => {
    expect(normalizarTelefono("123")).toBe("123");
    expect(normalizarTelefono("Sin teléfono")).toBe("Sin teléfono");
  });

  it("null y vacío quedan en null", () => {
    expect(normalizarTelefono(null)).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("   ")).toBeNull();
  });
});
