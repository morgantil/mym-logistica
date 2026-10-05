import { PedidosService } from "./pedidos.service";

// Decisión 2026-10-04: sincronizarEstados también debe detectar cuando el
// `driver` real de la Visit en SimpliRoute ya no coincide con el choferId
// guardado (reasignación manual en SimpliRoute) y actualizar zona/chofer —
// antes la única forma de reflejar eso en la grilla era borrar el pedido.
function armarServicio(datos: {
  pendientes: { id: string; simplirouteId: string; choferId: string | null; version: number }[];
  choferIdExternoDevuelto: number | null;
}) {
  const actualizarEstadoDesdeProveedor = jest.fn().mockResolvedValue({});
  const repositorio = {
    listarPendientesDeSincronizar: jest.fn().mockResolvedValue(datos.pendientes),
    actualizarEstadoDesdeProveedor,
  };
  const logisticaProvider = {
    consultarEstado: jest.fn().mockResolvedValue({
      estado: "entered",
      fechaEntrega: null,
      choferIdExterno: datos.choferIdExternoDevuelto,
    }),
  };
  const resolverZonaPorChofer = jest.fn().mockResolvedValue({
    zonaId: "z-nueva",
    zonaNombre: "Zona nueva",
    choferId: "99",
    choferNombre: "Nuevo Chofer",
  });
  const zonasChoferesService = { resolverZonaPorChofer };
  const servicio = new PedidosService(
    repositorio as never,
    logisticaProvider as never,
    {} as never,
    {} as never,
    zonasChoferesService as never,
    {} as never,
    {} as never,
  );
  return { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer };
}

describe("PedidosService.sincronizarEstados — reasignación de chofer en SimpliRoute", () => {
  it("si el chofer real no cambió, no recalcula zona/chofer", async () => {
    const { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", version: 0 }],
      choferIdExternoDevuelto: 42,
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).not.toHaveBeenCalled();
    expect(actualizarEstadoDesdeProveedor).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ actualizacionChofer: undefined }),
    );
  });

  it("si el chofer real cambió, recalcula zona/chofer y los manda a actualizar", async () => {
    const { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", version: 0 }],
      choferIdExternoDevuelto: 99,
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).toHaveBeenCalledWith(99);
    expect(actualizarEstadoDesdeProveedor).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        actualizacionChofer: {
          zonaId: "z-nueva",
          zonaNombre: "Zona nueva",
          choferId: "99",
          choferNombre: "Nuevo Chofer",
        },
      }),
    );
  });

  it("sin chofer externo (Visit todavía sin asignar), no recalcula nada", async () => {
    const { servicio, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: null, version: 0 }],
      choferIdExternoDevuelto: null,
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).not.toHaveBeenCalled();
  });
});
