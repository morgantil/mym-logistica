import { PedidosService } from "./pedidos.service";

// Mejora de robustez 2026-10-10 (ver REPORTE_SEGURIDAD_Y_ROBUSTEZ.md): antes
// exportarParaUsuario era el único de los 3 reportes Excel sin tope de rango
// — sin fechas en el filtro, bajaba TODO el histórico de pedidos. Mismo
// criterio que Transportistas/Combustible: tope editable por Administración
// (acá mockeado en 32, el default pedido en reunión), rechazo si se supera,
// y ahora además un default acotado cuando falta alguna fecha (antes
// quedaba sin límite en vez de caer a "el mes completo" como los otros dos).
function armarServicio(maxDias = 32) {
  const listarTodosParaExportar = jest.fn().mockResolvedValue([]);
  const repositorio = { listarTodosParaExportar };
  const permisosCliente = { clientesPermitidosPara: jest.fn().mockResolvedValue(null) };
  const limitesReporteService = { obtenerMaxDias: jest.fn().mockResolvedValue(maxDias) };
  const servicio = new PedidosService(
    repositorio as never,
    {} as never,
    permisosCliente as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    limitesReporteService as never,
  );
  return { servicio, listarTodosParaExportar };
}

describe("PedidosService.exportarParaUsuario — tope de rango", () => {
  it("un rango de exactamente 32 días (el tope) se acepta", async () => {
    const { servicio, listarTodosParaExportar } = armarServicio();

    await servicio.exportarParaUsuario("u1", {
      fechaDesde: new Date("2026-09-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-10-02T00:00:00.000Z"), // inclusive ambos extremos = 32 días
    });

    expect(listarTodosParaExportar).toHaveBeenCalled();
  });

  it("un rango de más del tope se rechaza", async () => {
    const { servicio } = armarServicio();

    await expect(
      servicio.exportarParaUsuario("u1", {
        fechaDesde: new Date("2026-09-01T00:00:00.000Z"),
        fechaHasta: new Date("2026-10-03T00:00:00.000Z"), // 33 días
      }),
    ).rejects.toThrow("El rango no puede superar los 32 días.");
  });

  it("sin ninguna fecha, completa un default acotado en vez de quedar sin límite", async () => {
    const { servicio, listarTodosParaExportar } = armarServicio();

    await servicio.exportarParaUsuario("u1", {});

    expect(listarTodosParaExportar).toHaveBeenCalled();
    const [filtroUsado] = listarTodosParaExportar.mock.calls[0];
    expect(filtroUsado.fechaDesde).toBeInstanceOf(Date);
    expect(filtroUsado.fechaHasta).toBeInstanceOf(Date);
    const dias = Math.round(
      (filtroUsado.fechaHasta.getTime() - filtroUsado.fechaDesde.getTime()) / 86_400_000,
    );
    expect(dias).toBeLessThanOrEqual(32);
  });

  it("respeta un tope distinto si Administración lo cambió (ej. 100)", async () => {
    const { servicio, listarTodosParaExportar } = armarServicio(100);

    await servicio.exportarParaUsuario("u1", {
      fechaDesde: new Date("2026-01-01T00:00:00.000Z"),
      fechaHasta: new Date("2026-04-10T00:00:00.000Z"), // 100 días exactos
    });

    expect(listarTodosParaExportar).toHaveBeenCalled();
  });
});
