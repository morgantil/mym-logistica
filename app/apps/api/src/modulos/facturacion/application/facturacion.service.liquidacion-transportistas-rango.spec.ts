import { CabaProvincia } from "@mym/shared-types";
import { FacturacionService } from "./facturacion.service";

// Decisión 2026-10-04: liquidacionTransportistas acepta un rango de fechas
// elegido libremente (datepicker) que reemplaza el mes completo — sin
// invariante de "cierre" que proteger acá, se recalcula en vivo cada vez.
function armarServicio() {
  const listarEntregadosPorChoferEnPeriodo = jest.fn().mockResolvedValue([]);
  const repositorio = {
    listarEntregadosPorChoferEnPeriodo,
    tarifaTransportistaActiva: jest.fn().mockResolvedValue({ monto: 100, zona: CabaProvincia.CABA }),
  };
  const pedidosService = { sincronizarEstados: jest.fn().mockResolvedValue(undefined) };
  const servicio = new FacturacionService(repositorio as never, pedidosService as never, {} as never, {} as never);
  return { servicio, listarEntregadosPorChoferEnPeriodo };
}

describe("FacturacionService.liquidacionTransportistas — rango de fechas", () => {
  it("sin rango, usa el mes completo", async () => {
    const { servicio, listarEntregadosPorChoferEnPeriodo } = armarServicio();

    await servicio.liquidacionTransportistas(10, 2026);

    expect(listarEntregadosPorChoferEnPeriodo).toHaveBeenCalledWith(
      new Date("2026-10-01T00:00:00.000Z"),
      new Date("2026-11-01T00:00:00.000Z"),
    );
  });

  it("con rango, lo usa en vez del mes (fechaHasta inclusive)", async () => {
    const { servicio, listarEntregadosPorChoferEnPeriodo } = armarServicio();

    await servicio.liquidacionTransportistas(10, 2026, "2026-10-05", "2026-10-10");

    expect(listarEntregadosPorChoferEnPeriodo).toHaveBeenCalledWith(
      new Date("2026-10-05T00:00:00.000Z"),
      new Date("2026-10-11T00:00:00.000Z"),
    );
  });

  // Decisión 2026-10-06 (reunión con Pablo Renzo): tope de 31 días cuando el
  // rango viene explícito — único lugar sin un selector de mes que lo acote.
  it("un rango de exactamente 31 días se acepta", async () => {
    const { servicio, listarEntregadosPorChoferEnPeriodo } = armarServicio();

    await servicio.liquidacionTransportistas(10, 2026, "2026-09-01", "2026-10-01");

    expect(listarEntregadosPorChoferEnPeriodo).toHaveBeenCalledWith(
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-10-02T00:00:00.000Z"),
    );
  });

  it("un rango de más de 31 días se rechaza", async () => {
    const { servicio } = armarServicio();

    await expect(servicio.liquidacionTransportistas(10, 2026, "2026-09-01", "2026-10-02")).rejects.toThrow(
      "El rango no puede superar los 31 días.",
    );
  });
});
