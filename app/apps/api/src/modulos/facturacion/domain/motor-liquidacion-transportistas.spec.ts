import {
  PedidoParaLiquidarTransportista,
  calcularLiquidacionTransportistas,
} from "./motor-liquidacion-transportistas";

function pedido(id: string, choferId: string, choferNombre: string): PedidoParaLiquidarTransportista {
  return { id, choferId, choferNombre };
}

describe("calcularLiquidacionTransportistas", () => {
  it("devuelve vacío sin pedidos", () => {
    expect(calcularLiquidacionTransportistas([], 2500)).toEqual([]);
  });

  it("agrupa por chofer y multiplica cantidad de viajes por la tarifa", () => {
    const pedidos = [
      pedido("p1", "10", "Juan"),
      pedido("p2", "10", "Juan"),
      pedido("p3", "10", "Juan"),
      pedido("p4", "20", "Sebastián"),
    ];

    const resultado = calcularLiquidacionTransportistas(pedidos, 2500);

    expect(resultado).toEqual([
      { choferId: "10", choferNombre: "Juan", cantidadViajes: 3, tarifaPorViaje: 2500, totalAPagar: 7500 },
      { choferId: "20", choferNombre: "Sebastián", cantidadViajes: 1, tarifaPorViaje: 2500, totalAPagar: 2500 },
    ]);
  });

  it("ordena de mayor a menor total a pagar", () => {
    const pedidos = [pedido("p1", "20", "Sebastián"), pedido("p2", "10", "Juan"), pedido("p3", "10", "Juan")];

    const resultado = calcularLiquidacionTransportistas(pedidos, 1000);

    expect(resultado.map((r) => r.choferId)).toEqual(["10", "20"]);
  });

  it("no distingue 2x1 ni entrega unificada — cada pedido entregado es un viaje completo", () => {
    // A diferencia de motor-facturacion.ts, acá no hay agrupación por
    // cliente+fecha+dirección: 2 pedidos al mismo destino son 2 viajes.
    const pedidos = [pedido("p1", "10", "Juan"), pedido("p2", "10", "Juan")];

    const resultado = calcularLiquidacionTransportistas(pedidos, 2500);

    expect(resultado[0].cantidadViajes).toBe(2);
    expect(resultado[0].totalAPagar).toBe(5000);
  });
});
