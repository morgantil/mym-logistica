import { GastosChoferesService } from "./gastos-choferes.service";

// Pedido en reunión 2026-10-07: la descarga de Combustible y Peajes usa el
// mismo date picker Desde/Hasta que la grilla, con tope de 30 días (no 31,
// a diferencia de Transportistas — ver 4.3 en TEMAS_PENDIENTES.md).
function armarServicio() {
  const repositorio = { listar: jest.fn().mockResolvedValue([]) };
  // Mismo tope (30 días) que el valor sembrado por default para Combustible
  // — ver migración 20261010033630_limite_reporte.
  const limitesReporteService = { obtenerMaxDias: jest.fn().mockResolvedValue(30) };
  const servicio = new GastosChoferesService(
    repositorio as never,
    {} as never,
    {} as never,
    limitesReporteService as never,
  );
  return { servicio, repositorio };
}

describe("GastosChoferesService.generarReporteExcel — tope de 30 días", () => {
  it("sin rango, no valida nada (deja bajar todo)", async () => {
    const { servicio, repositorio } = armarServicio();
    await servicio.generarReporteExcel({});
    expect(repositorio.listar).toHaveBeenCalled();
  });

  it("un rango de exactamente 30 días se acepta", async () => {
    const { servicio, repositorio } = armarServicio();
    await servicio.generarReporteExcel({
      fechaDesde: new Date("2026-09-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-10-01T00:00:00.000Z"), // ya ajustada +1 día por el controller (30 días exactos)
    });
    expect(repositorio.listar).toHaveBeenCalled();
  });

  it("un rango de más de 30 días se rechaza", async () => {
    const { servicio } = armarServicio();
    await expect(
      servicio.generarReporteExcel({
        fechaDesde: new Date("2026-09-01T00:00:00.000Z"),
        fechaHasta: new Date("2026-10-02T00:00:00.000Z"), // 31 días
      }),
    ).rejects.toThrow("El rango no puede superar los 30 días.");
  });
});
