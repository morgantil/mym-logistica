import { EstadoPedido, EstadoSimpliroute, EstadoValidacion, TipoServicio, PrioridadPedido } from "@mym/shared-types";
import { Pedido } from "./pedido";
import { validarPedidoParaEnvio } from "./validar-envio";

function pedidoListoParaEnviar(overrides: Partial<Pedido> = {}): Pedido {
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

  it("zona/chofer sin identificar NO bloquea el envío (decisión 2026-10-21) — se envía sin ruta asignada", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ zonaId: null, choferId: null }),
    );
    expect(errores).toEqual([]);
  });

  it("marca dirección distinta al padrón como bloqueante hasta que se resuelva", () => {
    const errores = validarPedidoParaEnvio(pedidoListoParaEnviar({ alertaDireccionPendiente: true }));
    expect(errores).toContain("Dirección distinta a la registrada en el padrón — resolver antes de enviar.");
  });

  it("bultos sin cargar no bloquea el envío (se puede cargar después, más cerca del despacho)", () => {
    expect(validarPedidoParaEnvio(pedidoListoParaEnviar({ bultos: null }))).toEqual([]);
    expect(validarPedidoParaEnvio(pedidoListoParaEnviar({ bultos: 0 }))).toEqual([]);
  });

  it("acumula todos los errores a la vez, no se corta en el primero", () => {
    const errores = validarPedidoParaEnvio(
      pedidoListoParaEnviar({ estadoSimpliroute: EstadoSimpliroute.NO_ENCONTRADO, alertaDireccionPendiente: true }),
    );
    expect(errores).toHaveLength(2);
  });
});
