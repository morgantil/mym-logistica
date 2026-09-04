import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio } from "@mym/shared-types";
import { Pedido } from "./pedido";
import { validarPedidoParaEnvio } from "./validar-envio";

function pedidoListoParaEnviar(overrides: Partial<Pedido> = {}): Pedido {
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
    zonaId: "z1",
    zonaNombre: "Zona de prueba",
    choferId: "ch1",
    choferNombre: "Chofer de prueba",
    zonaPreEnvioId: null,
    zonaPreEnvioNombre: null,
    choferPreEnvioId: null,
    choferPreEnvioNombre: null,
    latitudEntrega: null,
    longitudEntrega: null,
    geocodeAlert: null,
    bultos: 2,
    observaciones: null,
    etiquetaImpresaEn: null,
    version: 0,
    creadoEn: new Date(),
    ...overrides,
  };
}

describe("validarPedidoParaEnvio", () => {
  it("un pedido completo no tiene errores bloqueantes", () => {
    expect(validarPedidoParaEnvio(pedidoListoParaEnviar())).toEqual([]);
  });

  it("marca datos obligatorios faltantes si estadoValidacion no es VALIDO", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ estadoValidacion: EstadoValidacion.CON_ERRORES }),
    );
    expect(errores).toContain("Datos obligatorios faltantes.");
  });

  it("marca afiliado no encontrado en SimpliRoute", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ estadoSimpliroute: EstadoSimpliroute.NO_ENCONTRADO }),
    );
    expect(errores).toContain("Afiliado no encontrado en SimpliRoute.");
  });

  it("marca zona sin identificar y chofer sin asignar por separado", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ zonaId: null, choferId: null }),
    );
    expect(errores).toContain("Zona sin identificar.");
    expect(errores).toContain("Chofer sin asignar.");
  });

  it("bultos sin cargar no bloquea el envío (se puede cargar después, más cerca del despacho)", () => {
    expect(validarPedidoParaEnvio(pedidoListoParaEnviar({ bultos: null }))).toEqual([]);
    expect(validarPedidoParaEnvio(pedidoListoParaEnviar({ bultos: 0 }))).toEqual([]);
  });

  it("acumula todos los errores a la vez, no se corta en el primero", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ zonaId: null, choferId: null }),
    );
    expect(errores).toHaveLength(2);
  });
});
