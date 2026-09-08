import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import {
  PedidoParaFacturar,
  TarifasPorTipo,
  agruparPorClienteFechaDireccion,
  aplicarDosPorUno,
  buscarUnificaciones,
  calcularFacturacionCliente,
  construirClaveTarifa,
  separarPorTipoServicio,
} from "./motor-facturacion";

// IDs genéricos — el motor no le da significado especial a ninguna zona,
// solo agrupa por id (ver comentario de TarifasPorTipo en motor-facturacion.ts).
const ZONA_CABA = "zona-caba";
const ZONA_PROVINCIA = "zona-provincia";

const TARIFAS: TarifasPorTipo = {
  [construirClaveTarifa({ zonaTarifariaId: ZONA_CABA, tipoServicio: TipoServicio.PANAL, tipoEnvase: null })]: 1000,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_PROVINCIA,
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
  })]: 1500,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BOLSA,
  })]: 800,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BULTO,
  })]: 1200,
};

// Reproduce el caso "tal cual viene del documento Arbet": pañal 100% + un %
// adicional de medicamento. Los tests que quieren el % configurable de ambos
// lados (regla real del negocio, ver DOCUMENTO TECNICO.md 2026-09-08) usan
// PORCENTAJES_CONFIGURABLES en su lugar.
const PORCENTAJES_DOCUMENTO_ARBET = { panal: 100, medicamento: 50 };

function pedido(overrides: Partial<PedidoParaFacturar> & { id: string }): PedidoParaFacturar {
  return {
    clienteId: "cliente-1",
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
    fechaProgramada: "2026-08-01",
    direccionUsada: "Av. Siempre Viva 123",
    zonaTarifariaId: ZONA_CABA,
    ...overrides,
  };
}

function pedidos(cantidad: number, overrides: Partial<PedidoParaFacturar> = {}): PedidoParaFacturar[] {
  return Array.from({ length: cantidad }, (_, i) => pedido({ id: `p${i}`, ...overrides }));
}

describe("motor-facturacion — casos de ejemplo del §28 funcional / Guia Arbet §9", () => {
  it("caso 1: 10 pedidos de pañales, mismo cliente/fecha/dirección → 5 viajes 2x1, sin unificación", () => {
    const viajes = calcularFacturacionCliente(pedidos(10), TARIFAS, PORCENTAJES_DOCUMENTO_ARBET);

    expect(viajes).toHaveLength(5);
    expect(viajes.every((v) => v.reglaAplicada === "2x1")).toBe(true);
    expect(viajes.every((v) => v.importeCalculado === 1000)).toBe(true);
    expect(viajes.reduce((total, v) => total + v.pedidoIds.length, 0)).toBe(10);
  });

  it("caso 2: 3 pedidos de medicamentos (mismo Bolsa/Bulto) → 2 viajes (1 par 2x1 + 1 individual)", () => {
    const viajes = calcularFacturacionCliente(
      pedidos(3, { tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    expect(viajes).toHaveLength(2);
    expect(viajes.filter((v) => v.reglaAplicada === "2x1")).toHaveLength(1);
    expect(viajes.filter((v) => v.reglaAplicada === "INDIVIDUAL")).toHaveLength(1);
    expect(viajes.every((v) => v.importeCalculado === 800)).toBe(true);
  });

  it("caso 3: 1 pañal + 1 medicamento → 1 entrega unificada (100% + porcentaje), documento Arbet", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "panal" }),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("UNIFICADA");
    expect(viajes[0].pedidoIds).toEqual(expect.arrayContaining(["panal", "medicamento"]));
    expect(viajes[0].importeCalculado).toBe(1400); // 1000 (100% panal) + 400 (50% de 800 bolsa)
    expect(viajes[0].detalleUnificacion).toEqual({
      tarifaPanal: 1000,
      porcentajePanal: 100,
      importePanal: 1000,
      tarifaMedicamento: 800,
      porcentajeMedicamento: 50,
      importeMedicamento: 400,
    });
  });

  it("caso 4: 3 pañales + 1 medicamento → 1 unificada + 1 viaje 2x1 con los 2 pañales restantes", () => {
    const viajes = calcularFacturacionCliente(
      [
        ...pedidos(3, { id: "panal" }).map((p, i) => ({ ...p, id: `panal-${i}` })),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    expect(viajes).toHaveLength(2);
    const unificada = viajes.find((v) => v.reglaAplicada === "UNIFICADA");
    const dosPorUno = viajes.find((v) => v.reglaAplicada === "2x1");
    expect(unificada?.importeCalculado).toBe(1400);
    expect(unificada?.pedidoIds).toContain("medicamento");
    expect(dosPorUno?.pedidoIds).toHaveLength(2);
    expect(dosPorUno?.importeCalculado).toBe(1000);

    const totalFacturado = viajes.reduce((total, v) => total + v.importeCalculado, 0);
    expect(totalFacturado).toBe(2400); // 1 unificada (1000 + 400) + 1 viaje 2x1 (1000)
  });

  it("caso 29: clientes diferentes en mismo domicilio/fecha nunca se cruzan", () => {
    const viajes = calcularFacturacionCliente(
      [
        ...pedidos(10, { clienteId: "farmacia-a" }),
        ...pedidos(4, { clienteId: "farmacia-b" }).map((p, i) => ({ ...p, id: `b${i}` })),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    const viajesA = viajes.filter((v) => v.clienteId === "farmacia-a");
    const viajesB = viajes.filter((v) => v.clienteId === "farmacia-b");
    expect(viajesA).toHaveLength(5);
    expect(viajesB).toHaveLength(2);
  });
});

describe("motor-facturacion — Bolsa/Bulto (Guia Arbet paso 2 y 5)", () => {
  it("cobra tarifa distinta a Bolsa y Bulto en la misma zona", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "bolsa", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
        pedido({ id: "bulto", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BULTO }),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    // Bolsa y Bulto en el mismo grupo fecha+dirección no pueden compartir
    // viaje 2x1 (tarifa distinta) — cada uno queda como INDIVIDUAL.
    expect(viajes).toHaveLength(2);
    const viajeBolsa = viajes.find((v) => v.pedidoIds.includes("bolsa"));
    const viajeBulto = viajes.find((v) => v.pedidoIds.includes("bulto"));
    expect(viajeBolsa?.importeCalculado).toBe(800);
    expect(viajeBulto?.importeCalculado).toBe(1200);
  });

  it("Bolsa + Bulto en un mismo pedido de medicamentos se unifica igual con pañales, usando la tarifa de Bulto", () => {
    // La clasificación Bolsa+Bulto→Bulto ocurre antes (determinarClasificacionMedicamento);
    // acá el pedido ya llega con tipoEnvase=BULTO.
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "panal" }),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BULTO }),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    expect(viajes[0].detalleUnificacion?.tarifaMedicamento).toBe(1200);
  });
});

describe("motor-facturacion — porcentaje configurable de ambos lados (decisión 2026-09-08)", () => {
  it("aplica un % distinto de 100 también al lado de pañales cuando así se configura", () => {
    const porcentajes = { panal: 80, medicamento: 30 };
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "panal" }),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      porcentajes,
    );

    // 1000 * 0.8 = 800 (panal) + 800 * 0.3 = 240 (medicamento) = 1040
    expect(viajes[0].importeCalculado).toBe(1040);
    expect(viajes[0].detalleUnificacion?.porcentajePanal).toBe(80);
    expect(viajes[0].detalleUnificacion?.porcentajeMedicamento).toBe(30);
  });
});

describe("agruparPorClienteFechaDireccion — §26 qué NO es una entrega unificada", () => {
  it("no agrupa fechas diferentes aunque el resto coincida", () => {
    const grupos = agruparPorClienteFechaDireccion([
      pedido({ id: "a", fechaProgramada: "2026-08-01" }),
      pedido({ id: "b", fechaProgramada: "2026-08-02" }),
    ]);
    expect(grupos).toHaveLength(2);
  });

  it("no agrupa domicilios diferentes aunque el resto coincida", () => {
    const grupos = agruparPorClienteFechaDireccion([
      pedido({ id: "a", direccionUsada: "Calle Falsa 123" }),
      pedido({ id: "b", direccionUsada: "Otra Calle 456" }),
    ]);
    expect(grupos).toHaveLength(2);
  });

  it("agrupa la misma dirección aunque cambien mayúsculas/espacios (normalización)", () => {
    const grupos = agruparPorClienteFechaDireccion([
      pedido({ id: "a", direccionUsada: "  av. siempre viva   123 " }),
      pedido({ id: "b", direccionUsada: "AV. SIEMPRE VIVA 123" }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].pedidos).toHaveLength(2);
  });
});

describe("separarPorTipoServicio", () => {
  it("separa pañales y medicamentos sin perder pedidos", () => {
    const lista = [
      pedido({ id: "a", tipoServicio: TipoServicio.PANAL }),
      pedido({ id: "b", tipoServicio: TipoServicio.MEDICAMENTO }),
    ];
    const { panales, medicamentos } = separarPorTipoServicio(lista);
    expect(panales.map((p) => p.id)).toEqual(["a"]);
    expect(medicamentos.map((p) => p.id)).toEqual(["b"]);
  });
});

describe("buscarUnificaciones", () => {
  it("no unifica cuando solo hay pañales (§26)", () => {
    const resultado = buscarUnificaciones(pedidos(3), []);
    expect(resultado.unificaciones).toHaveLength(0);
    expect(resultado.panalesRestantes).toHaveLength(3);
  });

  it("no unifica cuando solo hay medicamentos (§26)", () => {
    const resultado = buscarUnificaciones([], pedidos(3, { tipoServicio: TipoServicio.MEDICAMENTO }));
    expect(resultado.unificaciones).toHaveLength(0);
    expect(resultado.medicamentosRestantes).toHaveLength(3);
  });

  it("empareja hasta agotar el tipo con menos pedidos", () => {
    const resultado = buscarUnificaciones(
      pedidos(3),
      pedidos(1, { tipoServicio: TipoServicio.MEDICAMENTO }),
    );
    expect(resultado.unificaciones).toHaveLength(1);
    expect(resultado.panalesRestantes).toHaveLength(2);
    expect(resultado.medicamentosRestantes).toHaveLength(0);
  });
});

describe("aplicarDosPorUno", () => {
  it("devuelve [] para una lista vacía", () => {
    expect(aplicarDosPorUno([])).toEqual([]);
  });

  it("un solo pedido queda como viaje INDIVIDUAL", () => {
    const [viaje] = aplicarDosPorUno(pedidos(1));
    expect(viaje.reglaAplicada).toBe("INDIVIDUAL");
    expect(viaje.pedidoIds).toHaveLength(1);
  });

  it("2 pedidos forman 1 viaje 2x1", () => {
    const viajes = aplicarDosPorUno(pedidos(2));
    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("2x1");
  });
});

describe("calcularFacturacionCliente — tarifa por zona tarifaria", () => {
  it("usa la tarifa correspondiente según la zona tarifaria del grupo", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "caba", zonaTarifariaId: ZONA_CABA }),
        pedido({
          id: "provincia",
          direccionUsada: "Otra dirección 999",
          zonaTarifariaId: ZONA_PROVINCIA,
        }),
      ],
      TARIFAS,
      PORCENTAJES_DOCUMENTO_ARBET,
    );

    const viajeCaba = viajes.find((v) => v.pedidoIds.includes("caba"));
    const viajeProvincia = viajes.find((v) => v.pedidoIds.includes("provincia"));
    expect(viajeCaba?.tarifaUtilizada).toBe(1000);
    expect(viajeProvincia?.tarifaUtilizada).toBe(1500);
  });
});
