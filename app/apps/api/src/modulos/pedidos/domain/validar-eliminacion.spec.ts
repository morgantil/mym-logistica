import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";
import { Pedido } from "./pedido";
import { validarPedidoParaEliminar } from "./validar-eliminacion";

function pedido(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: "p1",
    numero: 1,
    clienteId: "c1",
    destinatarioId: "d1",
    numeroAfiliado: "123",
    direccionUsada: "Calle 1",
    localidad: "Once",
    zonaTarifariaId: null,
    fechaProgramada: new Date(),
    tipoServicio: TipoServicio.PANAL,
    estado: EstadoPedido.SIN_ASIGNAR,
    estadoValidacion: EstadoValidacion.VALIDO,
    estadoSimpliroute: EstadoSimpliroute.NO_ENVIADO,
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
    etiquetaImpresaEn: null,
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

  it("bloquea borrar un pedido no encontrado en SimpliRoute (también se intentó enviar)", () => {
    expect(validarPedidoParaEliminar(pedido({ estadoSimpliroute: EstadoSimpliroute.NO_ENCONTRADO }))).not.toBeNull();
  });
});
