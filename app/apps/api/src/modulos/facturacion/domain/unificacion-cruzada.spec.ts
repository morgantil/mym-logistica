import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { PedidoParaFacturar, TarifasPorTipo, construirClaveTarifa } from "./motor-facturacion";
import { buscarUnificacionesEntreClientes, calcularUnificacionesEntreClientes } from "./unificacion-cruzada";

const ZONA_CABA = "zona-caba";

function pedido(overrides: Partial<PedidoParaFacturar> & { id: string; clienteId: string }): PedidoParaFacturar {
  return {
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
    cantidadPedidoOriginal: 1,
    fechaProgramada: "2026-09-01",
    direccionUsada: "Av. Siempre Viva 123",
    zonaTarifariaId: ZONA_CABA,
    ...overrides,
  };
}

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx §9: "Farmaet Medicamentos +
// Farmapal Pañales, misma fecha/domicilio → Unificado" / "distinto domicilio
// → No unificar".
describe("buscarUnificacionesEntreClientes", () => {
  it("empareja pedidos de dos clientes distintos en la misma fecha/domicilio", () => {
    const propios = [pedido({ id: "farmapal-1", clienteId: "farmapal" })];
    const socios = [
      pedido({ id: "farmaet-1", clienteId: "farmaet", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.unificaciones[0].socio.id).toBe("farmaet-1");
    expect(resultado.propiosRestantes).toHaveLength(0);
  });

  it("no unifica si el domicilio es distinto", () => {
    const propios = [pedido({ id: "farmapal-1", clienteId: "farmapal", direccionUsada: "Calle A 1" })];
    const socios = [
      pedido({
        id: "farmaet-1",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        direccionUsada: "Calle B 2",
      }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(0);
    expect(resultado.propiosRestantes).toHaveLength(1);
  });

  it("no consume el mismo socio dos veces", () => {
    const propios = [
      pedido({ id: "farmapal-1", clienteId: "farmapal" }),
      pedido({ id: "farmapal-2", clienteId: "farmapal" }),
    ];
    const socios = [pedido({ id: "farmaet-1", clienteId: "farmaet", tipoServicio: TipoServicio.MEDICAMENTO })];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.propiosRestantes).toHaveLength(1);
  });
});

describe("calcularUnificacionesEntreClientes", () => {
  it("factura solo la porción propia, con su propia tarifa/%, y deja trazabilidad del socio", () => {
    const tarifas: TarifasPorTipo = {
      [construirClaveTarifa({ zonaTarifariaId: ZONA_CABA, tipoServicio: TipoServicio.PANAL, tipoEnvase: null })]: 1000,
    };
    const propios = [pedido({ id: "farmapal-1", clienteId: "farmapal" })];
    const socios = [
      pedido({ id: "farmaet-1", clienteId: "farmaet", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
    ];

    const { viajes, propiosRestantes } = calcularUnificacionesEntreClientes(propios, socios, tarifas, 80);

    expect(propiosRestantes).toHaveLength(0);
    expect(viajes).toHaveLength(1);
    expect(viajes[0].clienteId).toBe("farmapal");
    expect(viajes[0].pedidoIds).toEqual(["farmapal-1"]);
    expect(viajes[0].importeCalculado).toBe(800); // 1000 * 80%
    expect(viajes[0].socioEntreClientes).toEqual({ pedidoId: "farmaet-1", clienteId: "farmaet" });
  });
});
