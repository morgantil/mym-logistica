import { PrioridadPedido, TipoEnvase, TipoServicio } from "@mym/shared-types";
import {
  ConfigUnificacionInterna,
  PedidoParaFacturar,
  TarifasPorTipo,
  agruparPorClienteFechaDireccion,
  buscarUnificaciones,
  calcularFacturacionCliente,
  calcularViajesPorPeso,
  construirClaveTarifa,
  separarPorTipoServicio,
} from "./motor-facturacion";

// IDs genéricos — el motor no le da significado especial a ninguna zona,
// solo agrupa por id (ver comentario de TarifasPorTipo en motor-facturacion.ts).
const ZONA_CABA = "zona-caba";
const ZONA_PROVINCIA = "zona-provincia";

const TARIFAS: TarifasPorTipo = {
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
    prioridad: PrioridadPedido.NORMAL,
  })]: 1000,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_PROVINCIA,
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
    prioridad: PrioridadPedido.NORMAL,
  })]: 1500,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BOLSA,
    prioridad: PrioridadPedido.NORMAL,
  })]: 800,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BULTO,
    prioridad: PrioridadPedido.NORMAL,
  })]: 1200,
};

// Monto fijo del lado medicamento en una entrega unificada (decisión
// 2026-09-12, reemplaza al % que usaba antes) — 400 para Bolsa y 600 para
// Bulto, elegidos para no tener que recalcular a mano los importes de los
// casos de ejemplo de abajo (coinciden con lo que antes daba el 50%).
const MONTOS_UNIFICADO: TarifasPorTipo = {
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BOLSA,
    prioridad: PrioridadPedido.NORMAL,
  })]: 400,
  [construirClaveTarifa({
    zonaTarifariaId: ZONA_CABA,
    tipoServicio: TipoServicio.MEDICAMENTO,
    tipoEnvase: TipoEnvase.BULTO,
    prioridad: PrioridadPedido.NORMAL,
  })]: 600,
};

// Reproduce el caso "tal cual viene del documento Arbet": pañal 100% + un
// monto fijo de medicamento.
const CONFIG_UNIFICACION_ARBET: ConfigUnificacionInterna = {
  porcentajePanal: 100,
  montosUnificadoMedicamento: MONTOS_UNIFICADO,
};

function pedido(overrides: Partial<PedidoParaFacturar> & { id: string }): PedidoParaFacturar {
  return {
    clienteId: "cliente-1",
    tipoServicio: TipoServicio.PANAL,
    tipoEnvase: null,
    prioridad: PrioridadPedido.NORMAL,
    cantidadPedidoOriginal: 1,
    fechaProgramada: "2026-08-01",
    direccionUsada: "Av. Siempre Viva 123",
    zonaTarifariaId: ZONA_CABA,
    latitudEntrega: null,
    longitudEntrega: null,
    ...overrides,
  };
}

function pedidos(cantidad: number, overrides: Partial<PedidoParaFacturar> = {}): PedidoParaFacturar[] {
  return Array.from({ length: cantidad }, (_, i) => pedido({ id: `p${i}`, ...overrides }));
}

describe("motor-facturacion — casos de ejemplo del §28 funcional / Guia Arbet §9", () => {
  it("caso 1: 10 pedidos de pañales, mismo cliente/fecha/dirección → 1 fila, 5 viajes 2x1, sin unificación", () => {
    const viajes = calcularFacturacionCliente(pedidos(10), TARIFAS, CONFIG_UNIFICACION_ARBET);

    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("2x1");
    expect(viajes[0].cantidadViajes).toBe(5);
    expect(viajes[0].importeCalculado).toBe(5000); // 5 viajes × 1000
    expect(viajes[0].pedidoIds).toHaveLength(10);
  });

  it("caso 2: 3 pedidos de medicamentos (mismo Bolsa/Bulto) → 1 fila, 2 viajes (par + individual)", () => {
    const viajes = calcularFacturacionCliente(
      pedidos(3, { tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("2x1");
    expect(viajes[0].cantidadViajes).toBe(2);
    expect(viajes[0].importeCalculado).toBe(1600); // 2 viajes × 800
  });

  it("caso 3: 1 pañal + 1 medicamento → 1 entrega unificada (100% + porcentaje), documento Arbet", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "panal" }),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("UNIFICADA");
    expect(viajes[0].cantidadViajes).toBe(1);
    expect(viajes[0].pedidoIds).toEqual(expect.arrayContaining(["panal", "medicamento"]));
    expect(viajes[0].importeCalculado).toBe(1400); // 1000 (100% panal) + 400 (monto fijo bolsa)
    expect(viajes[0].detalleUnificacion).toEqual({
      tarifaPanal: 1000,
      porcentajePanal: 100,
      importePanal: 1000,
      montoFijoMedicamento: 400,
      importeMedicamento: 400,
    });
  });

  it("caso 4: 3 pañales + 1 medicamento → 1 unificada + 1 fila 2x1 con los 2 pañales restantes", () => {
    const viajes = calcularFacturacionCliente(
      [
        ...pedidos(3, { id: "panal" }).map((p, i) => ({ ...p, id: `panal-${i}` })),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(2);
    const unificada = viajes.find((v) => v.reglaAplicada === "UNIFICADA");
    const dosPorUno = viajes.find((v) => v.reglaAplicada === "2x1");
    expect(unificada?.importeCalculado).toBe(1400);
    expect(unificada?.pedidoIds).toContain("medicamento");
    expect(dosPorUno?.pedidoIds).toHaveLength(2);
    expect(dosPorUno?.cantidadViajes).toBe(1);
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
      CONFIG_UNIFICACION_ARBET,
    );

    const viajesA = viajes.filter((v) => v.clienteId === "farmacia-a");
    const viajesB = viajes.filter((v) => v.clienteId === "farmacia-b");
    expect(viajesA).toHaveLength(1);
    expect(viajesA[0].cantidadViajes).toBe(5);
    expect(viajesB).toHaveLength(1);
    expect(viajesB[0].cantidadViajes).toBe(2);
  });
});

describe("motor-facturacion — peso por pedidos originales (decisión 2026-09-11, caso real Farmapal)", () => {
  it("un solo Pedido que agrupa 4 pedidos originales (mismo afiliado/dirección/fecha, distinto ticket) se factura como 2 viajes, no como 1 individual", () => {
    // Caso real: 4 líneas del Excel con Nº de ticket distinto se agrupan en
    // UN solo Pedido por logística (mismo destinatario/dirección/fecha) —
    // pero son 4 pedidos originales de Farmapal, no 1.
    const viajes = calcularFacturacionCliente(
      [pedido({ id: "pedido-agrupado", cantidadPedidoOriginal: 4 })],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].reglaAplicada).toBe("2x1");
    expect(viajes[0].cantidadViajes).toBe(2);
    expect(viajes[0].importeCalculado).toBe(2000); // 2 viajes × 1000, no 1000
    expect(viajes[0].pedidoIds).toEqual(["pedido-agrupado"]);
  });

  it("peso impar (3 pedidos originales en 1 Pedido) redondea hacia arriba, igual que el 2x1 normal", () => {
    const viajes = calcularFacturacionCliente(
      [pedido({ id: "pedido-agrupado", cantidadPedidoOriginal: 3 })],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes[0].cantidadViajes).toBe(2); // ceil(3/2)
    expect(viajes[0].importeCalculado).toBe(2000);
  });

  it("peso 1 (default, sin tickets distintos) sigue facturando como INDIVIDUAL, sin romper el comportamiento de siempre", () => {
    const viajes = calcularFacturacionCliente(
      [pedido({ id: "solo", cantidadPedidoOriginal: 1 })],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes[0].reglaAplicada).toBe("INDIVIDUAL");
    expect(viajes[0].cantidadViajes).toBe(1);
    expect(viajes[0].importeCalculado).toBe(1000);
  });

  it("combina el peso de varios Pedidos reales en la misma dirección/fecha (no solo el de uno)", () => {
    // Un Pedido con 3 originales + otro Pedido normal (1 original) en la
    // misma dirección/fecha → peso total 4 → 2 viajes, repartidos entre los
    // dos ids reales (ninguno se puede partir entre dos facturaciones).
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "agrupado", cantidadPedidoOriginal: 3 }),
        pedido({ id: "suelto", cantidadPedidoOriginal: 1 }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].cantidadViajes).toBe(2);
    expect(viajes[0].importeCalculado).toBe(2000);
    expect(viajes[0].pedidoIds).toEqual(expect.arrayContaining(["agrupado", "suelto"]));
  });
});

describe("motor-facturacion — Bolsa/Bulto (Guia Arbet paso 2 y 5)", () => {
  // Decisión 2026-09-16 (Leonardo): el 2x1 se dispara con dos AFILIADOS
  // DISTINTOS en la misma dirección — acá modelados como dos Pedidos
  // distintos (mismo cliente/fecha/dirección, cada uno peso 1). Si entre
  // ellos mezclan Bolsa y Bulto, se facturan juntos en un solo 2x1, con la
  // MISMA regla "mezcla→Bulto" que ya se aplicaba dentro de un solo pedido
  // (determinarClasificacionMedicamento) — antes cada uno quedaba INDIVIDUAL
  // en su propia fila, por tener distinta clave de tarifa.
  it("dos pedidos distintos, uno Bolsa y otro Bulto, en la misma dirección/fecha: se unen en un 2x1 facturado a tarifa de Bulto", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "bolsa", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
        pedido({ id: "bulto", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BULTO }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].pedidoIds).toEqual(expect.arrayContaining(["bolsa", "bulto"]));
    expect(viajes[0].reglaAplicada).toBe("2x1");
    expect(viajes[0].cantidadViajes).toBe(1);
    expect(viajes[0].importeCalculado).toBe(1200);
  });

  it("si todos los pedidos del grupo son Bolsa (sin ningún Bulto), se sigue facturando a tarifa de Bolsa", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "bolsa-1", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
        pedido({ id: "bolsa-2", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].importeCalculado).toBe(800);
  });

  it("grupo de más de 2 pedidos mezclando Bolsa/Bulto: sigue la fórmula normal de viajes (cada 2 = 1), pero todo a tarifa de Bulto", () => {
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "bolsa-1", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
        pedido({ id: "bolsa-2", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
        pedido({ id: "bulto-1", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BULTO }),
        pedido({ id: "bulto-2", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BULTO }),
      ],
      TARIFAS,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].pedidoIds).toHaveLength(4);
    expect(viajes[0].cantidadViajes).toBe(2);
    expect(viajes[0].importeCalculado).toBe(2400);
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
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes[0].detalleUnificacion?.montoFijoMedicamento).toBe(600);
  });
});

describe("motor-facturacion — % de pañal configurable + monto fijo de medicamento (decisión 2026-09-12)", () => {
  it("aplica un % distinto de 100 al lado pañal, y el monto fijo de medicamento se suma tal cual está configurado", () => {
    const config: ConfigUnificacionInterna = { porcentajePanal: 80, montosUnificadoMedicamento: MONTOS_UNIFICADO };
    const viajes = calcularFacturacionCliente(
      [
        pedido({ id: "panal" }),
        pedido({ id: "medicamento", tipoServicio: TipoServicio.MEDICAMENTO, tipoEnvase: TipoEnvase.BOLSA }),
      ],
      TARIFAS,
      config,
    );

    // 1000 * 0.8 = 800 (panal) + 400 (monto fijo, no depende del %) = 1200
    expect(viajes[0].importeCalculado).toBe(1200);
    expect(viajes[0].detalleUnificacion?.porcentajePanal).toBe(80);
    expect(viajes[0].detalleUnificacion?.montoFijoMedicamento).toBe(400);
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

describe("calcularViajesPorPeso", () => {
  it("un pedido con peso 1 es INDIVIDUAL, 1 viaje", () => {
    const resultado = calcularViajesPorPeso(pedidos(1));
    expect(resultado.reglaAplicada).toBe("INDIVIDUAL");
    expect(resultado.cantidadViajes).toBe(1);
  });

  it("2 pedidos de peso 1 cada uno dan 1 viaje 2x1", () => {
    const resultado = calcularViajesPorPeso(pedidos(2));
    expect(resultado.reglaAplicada).toBe("2x1");
    expect(resultado.cantidadViajes).toBe(1);
  });

  it("un solo pedido con peso 4 da 2 viajes 2x1 (no 1 individual)", () => {
    const resultado = calcularViajesPorPeso([pedido({ id: "p1", cantidadPedidoOriginal: 4 })]);
    expect(resultado.reglaAplicada).toBe("2x1");
    expect(resultado.cantidadViajes).toBe(2);
    expect(resultado.pedidoIds).toEqual(["p1"]);
  });

  it("peso impar total redondea hacia arriba (5 → 3 viajes, ejemplo del documento Arbet)", () => {
    const resultado = calcularViajesPorPeso(pedidos(5));
    expect(resultado.cantidadViajes).toBe(3);
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
      CONFIG_UNIFICACION_ARBET,
    );

    const viajeCaba = viajes.find((v) => v.pedidoIds.includes("caba"));
    const viajeProvincia = viajes.find((v) => v.pedidoIds.includes("provincia"));
    expect(viajeCaba?.tarifaUtilizada).toBe(1000);
    expect(viajeProvincia?.tarifaUtilizada).toBe(1500);
  });
});

// Decisión 2026-10-04 (reunión con el cliente): la Prioridad (incluida Fin
// de semana) también puede cambiar la tarifa — ej. un envío Urgente más caro
// que uno Normal en la misma zona.
describe("motor-facturacion — Prioridad como variable de tarifa (decisión 2026-10-04)", () => {
  const TARIFAS_CON_PRIORIDAD: TarifasPorTipo = {
    ...TARIFAS,
    [construirClaveTarifa({
      zonaTarifariaId: ZONA_CABA,
      tipoServicio: TipoServicio.PANAL,
      tipoEnvase: null,
      prioridad: PrioridadPedido.URGENTE,
    })]: 2000,
  };

  it("un pedido Urgente usa la tarifa Urgente, distinta de la Normal de la misma zona", () => {
    const viajes = calcularFacturacionCliente(
      [pedido({ id: "p1", prioridad: PrioridadPedido.URGENTE })],
      TARIFAS_CON_PRIORIDAD,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes[0].tarifaUtilizada).toBe(2000);
  });

  it("sin tarifa cargada para esa prioridad puntual, no cae a la tarifa Normal — tira error", () => {
    expect(() =>
      calcularFacturacionCliente(
        [pedido({ id: "p1", prioridad: PrioridadPedido.CRITICA })],
        TARIFAS_CON_PRIORIDAD,
        CONFIG_UNIFICACION_ARBET,
      ),
    ).toThrow(/Falta tarifa vigente/);
  });

  it("medicamentos agrupados (2x1) con prioridad mixta facturan a la más alta del grupo", () => {
    const tarifasMedicamento: TarifasPorTipo = {
      ...TARIFAS,
      [construirClaveTarifa({
        zonaTarifariaId: ZONA_CABA,
        tipoServicio: TipoServicio.MEDICAMENTO,
        tipoEnvase: TipoEnvase.BOLSA,
        prioridad: PrioridadPedido.URGENTE,
      })]: 1500,
    };

    const viajes = calcularFacturacionCliente(
      [
        pedido({
          id: "m1",
          tipoServicio: TipoServicio.MEDICAMENTO,
          tipoEnvase: TipoEnvase.BOLSA,
          prioridad: PrioridadPedido.NORMAL,
        }),
        pedido({
          id: "m2",
          tipoServicio: TipoServicio.MEDICAMENTO,
          tipoEnvase: TipoEnvase.BOLSA,
          prioridad: PrioridadPedido.URGENTE,
        }),
      ],
      tarifasMedicamento,
      CONFIG_UNIFICACION_ARBET,
    );

    expect(viajes).toHaveLength(1);
    expect(viajes[0].tarifaUtilizada).toBe(1500); // la tarifa Urgente, no la Normal (800)
  });
});
