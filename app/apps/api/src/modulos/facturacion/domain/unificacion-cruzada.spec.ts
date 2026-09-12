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
    latitudEntrega: null,
    longitudEntrega: null,
    ...overrides,
  };
}

// Obelisco (CABA) — punto de referencia real para los tests de coordenadas.
const LAT_OBELISCO = -34.6037;
const LON_OBELISCO = -58.3816;
// ~2km al sur, claramente otro domicilio.
const LAT_LEJOS = -34.62;
const LON_LEJOS = -58.3816;

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

  // Riesgo #1 charlado con Leonardo 2026-09-11: dos empresas tipeando la
  // misma dirección real casi nunca coinciden letra por letra — la
  // coordenada real de entrega (geocodificada por SimpliRoute) no depende de
  // eso.
  it("empareja por coordenada real aunque el texto de la dirección sea distinto", () => {
    const propios = [
      pedido({
        id: "farmapal-1",
        clienteId: "farmapal",
        direccionUsada: "Av. 9 de Julio 1000, 5º A",
        latitudEntrega: LAT_OBELISCO,
        longitudEntrega: LON_OBELISCO,
      }),
    ];
    const socios = [
      pedido({
        id: "farmaet-1",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        direccionUsada: "9 de julio 1000 - depto 5A",
        latitudEntrega: LAT_OBELISCO + 0.0001, // ~11m de diferencia, dentro del radio
        longitudEntrega: LON_OBELISCO,
      }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.unificaciones[0].socio.id).toBe("farmaet-1");
  });

  it("no empareja por coordenada si están a más de 100 metros, aunque el texto coincida", () => {
    const propios = [
      pedido({
        id: "farmapal-1",
        clienteId: "farmapal",
        latitudEntrega: LAT_OBELISCO,
        longitudEntrega: LON_OBELISCO,
      }),
    ];
    const socios = [
      pedido({
        id: "farmaet-1",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        latitudEntrega: LAT_LEJOS,
        longitudEntrega: LON_LEJOS,
      }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(0);
    expect(resultado.propiosRestantes).toHaveLength(1);
  });

  it("cae al texto exacto si a alguno de los dos le falta la coordenada todavía", () => {
    const propios = [
      pedido({
        id: "farmapal-1",
        clienteId: "farmapal",
        direccionUsada: "Calle Falsa 123",
        latitudEntrega: null, // todavía no se envió a SimpliRoute
        longitudEntrega: null,
      }),
    ];
    const socios = [
      pedido({
        id: "farmaet-1",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        direccionUsada: "Calle Falsa 123",
        latitudEntrega: LAT_OBELISCO,
        longitudEntrega: LON_OBELISCO,
      }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.unificaciones[0].socio.id).toBe("farmaet-1");
  });

  // Sin esto, un edificio grande con varias entregas el mismo día quedaba
  // sin cubrir: nunca se había probado qué pasa con más de un candidato
  // disponible a la vez.
  it("con varios candidatos el mismo día, cada propio se lleva el más cercano disponible", () => {
    const propios = [
      pedido({ id: "farmapal-lejano", clienteId: "farmapal", latitudEntrega: LAT_OBELISCO, longitudEntrega: LON_OBELISCO }),
      pedido({
        id: "farmapal-cercano",
        clienteId: "farmapal",
        latitudEntrega: LAT_OBELISCO + 0.0002, // ~22m
        longitudEntrega: LON_OBELISCO,
      }),
    ];
    const socios = [
      pedido({
        id: "farmaet-medio",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        latitudEntrega: LAT_OBELISCO + 0.0003, // ~33m del propio lejano, ~11m del cercano
        longitudEntrega: LON_OBELISCO,
      }),
      pedido({
        id: "farmaet-lejos-del-lote",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        latitudEntrega: LAT_LEJOS,
        longitudEntrega: LON_LEJOS,
      }),
    ];

    const resultado = buscarUnificacionesEntreClientes(propios, socios);
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.propiosRestantes).toHaveLength(1);
    // El único candidato dentro del radio ("farmaet-medio") se lo lleva quien
    // se procesa primero (orden de `propios`) — comportamiento voraz,
    // documentado como límite conocido (ver DOCUMENTO TECNICO.md historial).
    expect(resultado.unificaciones[0].propio.id).toBe("farmapal-lejano");
    expect(resultado.unificaciones[0].socio.id).toBe("farmaet-medio");
  });

  it("nunca empareja el mismo socio con dos propios distintos, aunque ambos estén cerca", () => {
    const propios = [
      pedido({ id: "farmapal-1", clienteId: "farmapal", latitudEntrega: LAT_OBELISCO, longitudEntrega: LON_OBELISCO }),
      pedido({
        id: "farmapal-2",
        clienteId: "farmapal",
        latitudEntrega: LAT_OBELISCO + 0.0001,
        longitudEntrega: LON_OBELISCO,
      }),
    ];
    const socios = [
      pedido({
        id: "farmaet-1",
        clienteId: "farmaet",
        tipoServicio: TipoServicio.MEDICAMENTO,
        latitudEntrega: LAT_OBELISCO,
        longitudEntrega: LON_OBELISCO,
      }),
    ];

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
