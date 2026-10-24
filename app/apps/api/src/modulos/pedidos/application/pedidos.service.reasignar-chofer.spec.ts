import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  PrioridadPedido,
  TipoServicio,
} from "@mym/shared-types";
import { Pedido } from "../domain/pedido";
import { PedidosService } from "./pedidos.service";

// Reunión 2026-10-21 (Pablo Renzo): el usuario reasigna el chofer a mano
// (chofer enfermo, vehículo roto) — ver comentario en PedidosService.reasignarChofer.
function pedidoBase(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: "p1",
    numero: 1,
    clienteId: "c1",
    destinatarioId: "d1",
    numeroAfiliado: "123",
    direccionOriginal: "Calle 1",
    direccionUsada: "Calle 1",
    localidad: "Once",
    zonaTarifariaId: null,
    fechaProgramada: new Date("2026-10-25T00:00:00Z"),
    tipoServicio: TipoServicio.PANAL,
    estado: EstadoPedido.SIN_ASIGNAR,
    estadoValidacion: EstadoValidacion.VALIDO,
    estadoSimpliroute: EstadoSimpliroute.NO_ENVIADO,
    simplirouteId: null,
    zonaId: "z-vieja",
    zonaNombre: "Zona vieja",
    choferId: "ch-viejo",
    choferNombre: "Chofer Viejo",
    zonaPreEnvioId: null,
    zonaPreEnvioNombre: null,
    choferPreEnvioId: null,
    choferPreEnvioNombre: null,
    latitudEntrega: null,
    longitudEntrega: null,
    geocodeAlert: null,
    bultos: 2,
    observaciones: null,
    comentario: null,
    ruta: null,
    alertaDireccionPendiente: false,
    etiquetaImpresaEn: null,
    cantidadPedidoOriginal: 1,
    prioridad: PrioridadPedido.NORMAL,
    remito: null,
    receta: null,
    recetaResuelta: null,
    tipoPedido: null,
    retiroDeReceta: null,
    tiempoDeEntrega: null,
    horarioEntrega: null,
    version: 0,
    creadoEn: new Date(),
    ...overrides,
  };
}

function armarServicio(pedido: Pedido, resuelto: Record<string, unknown> | null) {
  const asignarChoferVehiculo = jest.fn().mockResolvedValue(undefined);
  const logisticaProvider = { asignarChoferVehiculo };
  const repositorio = {
    obtenerPorId: jest.fn().mockResolvedValue(pedido),
    reasignarChofer: jest.fn().mockResolvedValue({ ...pedido, version: pedido.version + 1 }),
  };
  const zonasChoferesService = {
    resolverZonaPorChofer: jest.fn().mockResolvedValue(
      resuelto ?? { zonaId: null, zonaNombre: null, choferId: "99", choferNombre: null, vehiculoId: null },
    ),
  };

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

  return { servicio, repositorio, asignarChoferVehiculo };
}

describe("PedidosService.reasignarChofer", () => {
  it("pedido NO enviado todavía: solo actualiza choferId/zonaId, no toca SimpliRoute", async () => {
    const { servicio, repositorio, asignarChoferVehiculo } = armarServicio(pedidoBase(), {
      zonaId: "z-nueva",
      zonaNombre: "Zona nueva",
      choferId: "99",
      choferNombre: "Chofer Nuevo",
      vehiculoId: "55",
    });

    await servicio.reasignarChofer("p1", 99, 0);

    expect(asignarChoferVehiculo).not.toHaveBeenCalled();
    expect(repositorio.reasignarChofer).toHaveBeenCalledWith(
      "p1",
      { zonaId: "z-nueva", zonaNombre: "Zona nueva", choferId: "99", choferNombre: "Chofer Nuevo" },
      0,
    );
  });

  it("pedido YA enviado a SimpliRoute: también empuja el cambio allá", async () => {
    const { servicio, asignarChoferVehiculo } = armarServicio(
      pedidoBase({ simplirouteId: "visita-1", estadoSimpliroute: EstadoSimpliroute.ENVIADO }),
      { zonaId: "z-nueva", zonaNombre: "Zona nueva", choferId: "99", choferNombre: "Chofer Nuevo", vehiculoId: "55" },
    );

    await servicio.reasignarChofer("p1", 99, 0);

    expect(asignarChoferVehiculo).toHaveBeenCalledWith("visita-1", 99, 55, pedidoBase().fechaProgramada);
  });

  it("rechaza si el chofer no existe en el cache", async () => {
    const { servicio } = armarServicio(pedidoBase(), null);
    await expect(servicio.reasignarChofer("p1", 999, 0)).rejects.toThrow(BadRequestException);
  });

  it("rechaza si el pedido ya enviado y el chofer nuevo no tiene vehículo asociado", async () => {
    const { servicio, asignarChoferVehiculo } = armarServicio(
      pedidoBase({ simplirouteId: "visita-1", estadoSimpliroute: EstadoSimpliroute.ENVIADO }),
      { zonaId: null, zonaNombre: null, choferId: "99", choferNombre: "Chofer Sin Vehiculo", vehiculoId: null },
    );
    await expect(servicio.reasignarChofer("p1", 99, 0)).rejects.toThrow(BadRequestException);
    expect(asignarChoferVehiculo).not.toHaveBeenCalled();
  });

  it("rechaza si el pedido no existe", async () => {
    const repositorio = { obtenerPorId: jest.fn().mockResolvedValue(null) };
    const servicio = new PedidosService(
      repositorio as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(servicio.reasignarChofer("inexistente", 99, 0)).rejects.toThrow(NotFoundException);
  });
});
