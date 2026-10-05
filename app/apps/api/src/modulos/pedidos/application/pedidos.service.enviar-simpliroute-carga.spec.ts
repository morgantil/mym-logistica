import {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  PrioridadPedido,
  TipoServicio,
} from "@mym/shared-types";
import { Pedido } from "../domain/pedido";
import { PedidosService } from "./pedidos.service";

// Decisión 2026-10-04 (reunión con el cliente): al enviar a SimpliRoute,
// "Carga 1" (load=1) marca pañales, "Carga 3" (load_3=1) solo clientes con
// Cliente.usaCarga3, y se asigna Conductor/Vehículo a la Visit ya creada
// (PATCH separado, recién se conoce la zona/chofer real con la coordenada
// geocodificada que devuelve la creación).
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
    fechaProgramada: new Date(),
    tipoServicio: TipoServicio.PANAL,
    estado: EstadoPedido.SIN_ASIGNAR,
    estadoValidacion: EstadoValidacion.VALIDO,
    estadoSimpliroute: EstadoSimpliroute.NO_ENVIADO,
    zonaId: "z1",
    zonaNombre: "Zona vieja",
    choferId: "ch1",
    choferNombre: "Chofer viejo",
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

function armarServicio(datos: { pedido: Pedido; usaCarga3: boolean }) {
  const enviarPedido = jest.fn().mockResolvedValue({
    idExterno: "visita-1",
    latitud: -34.6,
    longitud: -58.4,
    geocodeAlert: null,
  });
  const asignarChoferVehiculo = jest.fn().mockResolvedValue(undefined);
  const logisticaProvider = { enviarPedido, asignarChoferVehiculo };

  const repositorio = {
    obtenerPorId: jest.fn().mockResolvedValue(datos.pedido),
    marcarEnviado: jest.fn().mockResolvedValue(datos.pedido),
  };
  const destinatariosService = {
    buscarPorId: jest.fn().mockResolvedValue({ simplirouteId: "dest-1", nombre: "Juan", telefono: null }),
  };
  const normalizadorDirecciones = { clasificarCabaProvincia: jest.fn().mockResolvedValue("CABA") };
  const zonasChoferesService = {
    resolverZonaChofer: jest.fn().mockResolvedValue({
      zonaId: "z-nueva",
      zonaNombre: "Zona nueva",
      choferId: "99",
      choferNombre: "Chofer nuevo",
      vehiculoId: "55",
    }),
  };
  const clientesService = { buscarPorId: jest.fn().mockResolvedValue({ id: "c1", usaCarga3: datos.usaCarga3 }) };

  const servicio = new PedidosService(
    repositorio as never,
    logisticaProvider as never,
    {} as never,
    destinatariosService as never,
    zonasChoferesService as never,
    normalizadorDirecciones as never,
    clientesService as never,
  );

  return { servicio, enviarPedido, asignarChoferVehiculo };
}

describe("PedidosService.enviarASimpliRoute — Carga 1/3 y Conductor/Vehículo", () => {
  it("pañales: manda cargaPanal=true; cliente sin usaCarga3: cargaEspecial=false", async () => {
    const { servicio, enviarPedido } = armarServicio({
      pedido: pedidoBase({ tipoServicio: TipoServicio.PANAL }),
      usaCarga3: false,
    });

    await servicio.enviarASimpliRoute(["p1"]);

    expect(enviarPedido).toHaveBeenCalledWith(expect.objectContaining({ cargaPanal: true, cargaEspecial: false }));
  });

  it("medicamentos: cargaPanal=false", async () => {
    const { servicio, enviarPedido } = armarServicio({
      pedido: pedidoBase({ tipoServicio: TipoServicio.MEDICAMENTO }),
      usaCarga3: false,
    });

    await servicio.enviarASimpliRoute(["p1"]);

    expect(enviarPedido).toHaveBeenCalledWith(expect.objectContaining({ cargaPanal: false }));
  });

  it("cliente con usaCarga3: manda cargaEspecial=true", async () => {
    const { servicio, enviarPedido } = armarServicio({
      pedido: pedidoBase(),
      usaCarga3: true,
    });

    await servicio.enviarASimpliRoute(["p1"]);

    expect(enviarPedido).toHaveBeenCalledWith(expect.objectContaining({ cargaEspecial: true }));
  });

  it("asigna chofer/vehículo resuelto a la Visit recién creada", async () => {
    const { servicio, asignarChoferVehiculo } = armarServicio({
      pedido: pedidoBase(),
      usaCarga3: false,
    });

    await servicio.enviarASimpliRoute(["p1"]);

    expect(asignarChoferVehiculo).toHaveBeenCalledWith("visita-1", 99, 55);
  });
});
