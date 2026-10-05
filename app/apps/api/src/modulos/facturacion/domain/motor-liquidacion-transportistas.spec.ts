import { CabaProvincia } from "@mym/shared-types";
import {
  PedidoParaLiquidarTransportista,
  calcularLiquidacionTransportistas,
} from "./motor-liquidacion-transportistas";

function pedido(
  id: string,
  choferId: string,
  choferNombre: string,
  zona: CabaProvincia = CabaProvincia.CABA,
): PedidoParaLiquidarTransportista {
  return { id, choferId, choferNombre, zona };
}

const TARIFAS = { [CabaProvincia.CABA]: 2500, [CabaProvincia.PROVINCIA]: 4000 };

describe("calcularLiquidacionTransportistas", () => {
  it("devuelve vacío sin pedidos", () => {
    expect(calcularLiquidacionTransportistas([], TARIFAS)).toEqual([]);
  });

  it("agrupa por chofer y multiplica cantidad de viajes de CABA por su tarifa", () => {
    const pedidos = [
      pedido("p1", "10", "Juan"),
      pedido("p2", "10", "Juan"),
      pedido("p3", "10", "Juan"),
      pedido("p4", "20", "Sebastián"),
    ];

    const resultado = calcularLiquidacionTransportistas(pedidos, TARIFAS);

    expect(resultado).toEqual([
      { choferId: "10", choferNombre: "Juan", viajesCaba: 3, viajesProvincia: 0, totalAPagar: 7500 },
      { choferId: "20", choferNombre: "Sebastián", viajesCaba: 1, viajesProvincia: 0, totalAPagar: 2500 },
    ]);
  });

  it("un mismo chofer puede tener viajes de CABA y de Provincia en el mismo mes, a tarifas distintas", () => {
    const pedidos = [
      pedido("p1", "10", "Juan", CabaProvincia.CABA),
      pedido("p2", "10", "Juan", CabaProvincia.PROVINCIA),
      pedido("p3", "10", "Juan", CabaProvincia.PROVINCIA),
    ];

    const resultado = calcularLiquidacionTransportistas(pedidos, TARIFAS);

    expect(resultado).toEqual([
      { choferId: "10", choferNombre: "Juan", viajesCaba: 1, viajesProvincia: 2, totalAPagar: 2500 + 4000 * 2 },
    ]);
  });

  it("ordena de mayor a menor total a pagar", () => {
    const pedidos = [pedido("p1", "20", "Sebastián"), pedido("p2", "10", "Juan"), pedido("p3", "10", "Juan")];

    const resultado = calcularLiquidacionTransportistas(pedidos, TARIFAS);

    expect(resultado.map((r) => r.choferId)).toEqual(["10", "20"]);
  });

  it("no distingue 2x1 ni entrega unificada — cada pedido entregado es un viaje completo", () => {
    // A diferencia de motor-facturacion.ts, acá no hay agrupación por
    // cliente+fecha+dirección: 2 pedidos al mismo destino son 2 viajes.
    const pedidos = [pedido("p1", "10", "Juan"), pedido("p2", "10", "Juan")];

    const resultado = calcularLiquidacionTransportistas(pedidos, TARIFAS);

    expect(resultado[0].viajesCaba).toBe(2);
    expect(resultado[0].totalAPagar).toBe(5000);
  });
});
