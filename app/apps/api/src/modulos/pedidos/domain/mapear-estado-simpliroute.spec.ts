import { EstadoPedido } from "@mym/shared-types";
import { mapearEstadoSimpliRoute } from "./mapear-estado-simpliroute";

describe("mapearEstadoSimpliRoute", () => {
  it("mapea pending a COORDINADO", () => {
    expect(mapearEstadoSimpliRoute("pending")).toBe(EstadoPedido.COORDINADO);
  });

  it("mapea entered a EN_TRANSITO", () => {
    expect(mapearEstadoSimpliRoute("entered")).toBe(EstadoPedido.EN_TRANSITO);
  });

  it("mapea completed a ENTREGADO", () => {
    expect(mapearEstadoSimpliRoute("completed")).toBe(EstadoPedido.ENTREGADO);
  });

  it("mapea failed a ENTREGA_FALLIDA", () => {
    expect(mapearEstadoSimpliRoute("failed")).toBe(EstadoPedido.ENTREGA_FALLIDA);
  });

  it("devuelve null para un status desconocido, en vez de asumir un default", () => {
    expect(mapearEstadoSimpliRoute("algo-nuevo-no-documentado")).toBeNull();
  });
});
