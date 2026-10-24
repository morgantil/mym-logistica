import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio, PrioridadPedido } from "@mym/shared-types";
import { Pedido } from "./pedido";
import { validarPedidoParaEliminar } from "./validar-eliminacion";

function pedido(overrides: Partial<Pedido> = {}): Pedido {
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
    simplirouteId: null,
    zonaId: null,
    zonaNombre: null,
    choferId: null,
    choferNombre: null,
    zonaPreEnvioId: null,
    zonaPreEnvioNombre: null,
    choferPreEnvioId: null,
    choferPreEnvioNombre: null,
    latitudEntrega: null,
    longitudEntrega: null,
    geocodeAlert: null,
    bultos: null,
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

describe("validarPedidoParaEliminar", () => {
  it("permite borrar un pedido que todavía no se mandó a SimpliRoute", () => {
    expect(validarPedidoParaEliminar(pedido({ estadoSimpliroute: EstadoSimpliroute.NO_ENVIADO }))).toBeNull();
  });

  it("bloquea borrar un pedido ya enviado", () => {
    expect(validarPedidoParaEliminar(pedido({ estadoSimpliroute: EstadoSimpliroute.ENVIADO }))).not.toBeNull();
  });

  it("bloquea borrar un pedido con error de geocodificación (también se envió)", () => {
    expect(validarPedidoParaEliminar(pedido({ estadoSimpliroute: EstadoSimpliroute.ERROR }))).not.toBeNull();
  });

  it("permite borrar un pedido no encontrado en SimpliRoute (nunca se creó ninguna visita)", () => {
    expect(validarPedidoParaEliminar(pedido({ estadoSimpliroute: EstadoSimpliroute.NO_ENCONTRADO }))).toBeNull();
  });
});
