import { PedidosService } from "./pedidos.service";

// Decisión 2026-10-04: sincronizarEstados también debe detectar cuando el
// `driver` real de la Visit en SimpliRoute ya no coincide con el choferId
// guardado (reasignación manual en SimpliRoute) y actualizar zona/chofer —
// antes la única forma de reflejar eso en la grilla era borrar el pedido.
//
// Bug real 2026-10-06 (reunión con Pablo Renzo): eso no alcanzaba para el
// caso de renombrar un chofer (mismo ID, nombre editado en la pantalla Zonas
// y choferes) — el nombre guardado en el pedido quedaba viejo para siempre.
// Ahora resolverZonaPorChofer se llama siempre que hay chofer externo (lee
// de un cache local, barato) para poder comparar también el nombre.
function armarServicio(datos: {
  pendientes: { id: string; simplirouteId: string; choferId: string | null; choferNombre: string | null; version: number }[];
  choferIdExternoDevuelto: number | null;
  choferResuelto?: { zonaId: string | null; zonaNombre: string | null; choferId: string | null; choferNombre: string | null };
  estadoVisita?: { estado: string; fechaEntrega: Date | null; choferIdExterno: number | null } | null;
}) {
  const actualizarEstadoDesdeProveedor = jest.fn().mockResolvedValue({});
  const resetearEnvioSimpliroute = jest.fn().mockResolvedValue({});
  const repositorio = {
    listarPendientesDeSincronizar: jest.fn().mockResolvedValue(datos.pendientes),
    actualizarEstadoDesdeProveedor,
    resetearEnvioSimpliroute,
  };
  const logisticaProvider = {
    consultarEstado: jest.fn().mockResolvedValue(
      datos.estadoVisita !== undefined
        ? datos.estadoVisita
        : { estado: "entered", fechaEntrega: null, choferIdExterno: datos.choferIdExternoDevuelto },
    ),
  };
  const resolverZonaPorChofer = jest.fn().mockResolvedValue(
    datos.choferResuelto ?? {
      zonaId: "z-nueva",
      zonaNombre: "Zona nueva",
      choferId: "99",
      choferNombre: "Nuevo Chofer",
    },
  );
  const zonasChoferesService = { resolverZonaPorChofer };
  const servicio = new PedidosService(
    repositorio as never,
    logisticaProvider as never,
    {} as never,
    {} as never,
    zonasChoferesService as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { servicio, actualizarEstadoDesdeProveedor, resetearEnvioSimpliroute, resolverZonaPorChofer };
}

describe("PedidosService.sincronizarEstados — reasignación/renombre de chofer en SimpliRoute", () => {
  it("si ni el chofer ni su nombre cambiaron, no manda actualización (aunque sí consulta el cache)", async () => {
    const { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", choferNombre: "Lucia", version: 0 }],
      choferIdExternoDevuelto: 42,
      choferResuelto: { zonaId: "z1", zonaNombre: "Zona 1", choferId: "42", choferNombre: "Lucia" },
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).toHaveBeenCalledWith(42);
    expect(actualizarEstadoDesdeProveedor).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ actualizacionChofer: undefined }),
    );
  });

  it("si el chofer real cambió (reasignación), recalcula zona/chofer y los manda a actualizar", async () => {
    const { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", choferNombre: "Lucia", version: 0 }],
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

  it("si el chofer es el mismo pero le cambiaron el nombre, también actualiza el snapshot", async () => {
    const { servicio, actualizarEstadoDesdeProveedor, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", choferNombre: "Lucia", version: 0 }],
      choferIdExternoDevuelto: 42,
      choferResuelto: { zonaId: "z1", zonaNombre: "Zona 1", choferId: "42", choferNombre: "Lucía Gómez" },
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).toHaveBeenCalledWith(42);
    expect(actualizarEstadoDesdeProveedor).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        actualizacionChofer: { zonaId: "z1", zonaNombre: "Zona 1", choferId: "42", choferNombre: "Lucía Gómez" },
      }),
    );
  });

  it("sin chofer externo (Visit todavía sin asignar), no recalcula nada", async () => {
    const { servicio, resolverZonaPorChofer } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: null, choferNombre: null, version: 0 }],
      choferIdExternoDevuelto: null,
    });

    await servicio.sincronizarEstados();

    expect(resolverZonaPorChofer).not.toHaveBeenCalled();
  });
});

// Caso real 2026-10-26 (Leonardo probando en el cliente): borrar una ruta en
// SimpliRoute no avisa a mym — el pedido quedaba "coordinado" para siempre,
// sin forma de borrarlo ni reenviarlo. Ver SimplirouteHttpAdapter.consultarEstado
// (devuelve null en 404) y PedidosRepositorio.resetearEnvioSimpliroute.
describe("PedidosService.sincronizarEstados — Visit borrada en SimpliRoute", () => {
  it("si la Visit ya no existe (404 → null), revierte el pedido a NO_ENVIADO en vez de marcarlo como error", async () => {
    const { servicio, resetearEnvioSimpliroute, actualizarEstadoDesdeProveedor } = armarServicio({
      pendientes: [{ id: "p1", simplirouteId: "999", choferId: "42", choferNombre: "Lucia", version: 3 }],
      choferIdExternoDevuelto: null,
      estadoVisita: null,
    });

    const resultado = await servicio.sincronizarEstados();

    expect(resetearEnvioSimpliroute).toHaveBeenCalledWith("p1", 3);
    expect(actualizarEstadoDesdeProveedor).not.toHaveBeenCalled();
    expect(resultado).toEqual({ actualizados: 0, sinCambios: 0, revertidos: 1, errores: [] });
  });
});
