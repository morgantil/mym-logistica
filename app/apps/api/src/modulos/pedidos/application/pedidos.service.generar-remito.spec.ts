import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  FormatoRemito,
  PrioridadPedido,
  TipoServicio,
} from "@mym/shared-types";
import { PedidoListado } from "../domain/pedido";
import { PedidosService } from "./pedidos.service";

function pedidoListado(overrides: Partial<PedidoListado> = {}): PedidoListado {
  return {
    id: "p1",
    numero: 26,
    clienteId: "c1",
    clienteNombre: "Bella Vista PAÑALES",
    clienteFormatoRemito: FormatoRemito.BELLA_VISTA,
    destinatarioId: "d1",
    destinatarioNombre: "Juan Pérez",
    destinatarioTelefono: null,
    numeroAfiliado: "123",
    direccionOriginal: "Calle 1",
    direccionUsada: "Calle 1",
    localidad: "Once",
    zonaTarifariaId: null,
    fechaProgramada: new Date("2026-10-04T00:00:00Z"),
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
    comentario: null,
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
    productos: [{ codigo: null, descripcion: "Pañales", cantidad: 1, ticket: null, tipoEnvase: null }],
    ...overrides,
  };
}

function armarServicio(pedido: PedidoListado | null) {
  const repositorio = { obtenerListadoPorId: jest.fn().mockResolvedValue(pedido) };
  const servicio = new PedidosService(
    repositorio as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return servicio;
}

describe("PedidosService.generarRemito", () => {
  it("genera un PDF cuando el cliente tiene formato de remito configurado", async () => {
    const servicio = armarServicio(pedidoListado());
    const pdf = await servicio.generarRemito("p1");
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("rechaza si el pedido no existe", async () => {
    const servicio = armarServicio(null);
    await expect(servicio.generarRemito("p1")).rejects.toThrow(NotFoundException);
  });

  it("rechaza si el cliente no tiene formato de remito configurado", async () => {
    const servicio = armarServicio(pedidoListado({ clienteFormatoRemito: null }));
    await expect(servicio.generarRemito("p1")).rejects.toThrow(BadRequestException);
  });
});
