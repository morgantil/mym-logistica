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
    importadoPorId: null,
    importadoPorNombre: null,
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
    productos: [{ codigo: null, descripcion: "Pañales", cantidad: 1, ticket: null, tipoEnvase: null }],
    ...overrides,
  };
}

// A diferencia de pedidos.service.generar-remito.spec.ts (un solo pedido
// mockeado), acá cada test necesita devolver un pedido DISTINTO según el id
// pedido — un mapa simula lo que haría la base real.
function armarServicio(pedidosPorId: Record<string, PedidoListado | undefined>) {
  const repositorio = {
    obtenerListadoPorId: jest.fn((id: string) => Promise.resolve(pedidosPorId[id] ?? null)),
    marcarEtiquetaImpresa: jest.fn().mockResolvedValue(undefined),
  };
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
  return servicio;
}

describe("PedidosService — impresión masiva (reunión 2026-10-21)", () => {
  describe("generarRemitoMasivo", () => {
    it("genera un PDF con todos los pedidos cuando son del mismo cliente", async () => {
      const servicio = armarServicio({
        p1: pedidoListado({ id: "p1", numero: 1 }),
        p2: pedidoListado({ id: "p2", numero: 2 }),
      });
      const pdf = await servicio.generarRemitoMasivo(["p1", "p2"]);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("rechaza si los pedidos son de clientes distintos", async () => {
      const servicio = armarServicio({
        p1: pedidoListado({ id: "p1", clienteId: "c1", clienteNombre: "Farmapal" }),
        p2: pedidoListado({ id: "p2", clienteId: "c2", clienteNombre: "Bella Vista" }),
      });
      await expect(servicio.generarRemitoMasivo(["p1", "p2"])).rejects.toThrow(BadRequestException);
    });

    it("rechaza si algún pedido no existe", async () => {
      const servicio = armarServicio({ p1: pedidoListado({ id: "p1" }) });
      await expect(servicio.generarRemitoMasivo(["p1", "noexiste"])).rejects.toThrow(NotFoundException);
    });

    it("rechaza si el cliente no tiene formato de remito configurado", async () => {
      const servicio = armarServicio({ p1: pedidoListado({ id: "p1", clienteFormatoRemito: null }) });
      await expect(servicio.generarRemitoMasivo(["p1"])).rejects.toThrow(BadRequestException);
    });
  });

  describe("generarEtiquetasMasivo", () => {
    it("genera un PDF con las etiquetas de todos los pedidos del mismo cliente", async () => {
      const servicio = armarServicio({
        p1: pedidoListado({ id: "p1", bultos: 2 }),
        p2: pedidoListado({ id: "p2", bultos: 1 }),
      });
      const pdf = await servicio.generarEtiquetasMasivo(["p1", "p2"]);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("rechaza si algún pedido no tiene bultos cargados", async () => {
      const servicio = armarServicio({
        p1: pedidoListado({ id: "p1", bultos: 2 }),
        p2: pedidoListado({ id: "p2", bultos: null }),
      });
      await expect(servicio.generarEtiquetasMasivo(["p1", "p2"])).rejects.toThrow(BadRequestException);
    });

    it("rechaza si los pedidos son de clientes distintos", async () => {
      const servicio = armarServicio({
        p1: pedidoListado({ id: "p1", clienteId: "c1" }),
        p2: pedidoListado({ id: "p2", clienteId: "c2" }),
      });
      await expect(servicio.generarEtiquetasMasivo(["p1", "p2"])).rejects.toThrow(BadRequestException);
    });
  });
});
