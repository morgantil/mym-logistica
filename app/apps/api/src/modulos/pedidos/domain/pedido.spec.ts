import { PrioridadPedido } from "@mym/shared-types";
import { agruparLineasEnPedidos, LineaExcelImportada } from "./pedido";

function linea(overrides: Partial<LineaExcelImportada> = {}): LineaExcelImportada {
  return {
    clienteId: "cliente-1",
    numeroAfiliado: "12345",
    destinatario: "Juan Pérez",
    direccion: "Rivadavia 100",
    localidad: "Once",
    telefono: null,
    fechaEntrega: "2026-08-15",
    notaFecha: null,
    ticket: null,
    codigoProducto: "EAN001",
    descripcionProducto: "Pañal A",
    cantidad: 4,
    tipoEnvase: null,
    receta: null,
    tipoPedido: null,
    retiroDeReceta: null,
    tiempoDeEntrega: null,
    horarioEntrega: null,
    prioridad: PrioridadPedido.NORMAL,
    ...overrides,
  };
}

describe("agruparLineasEnPedidos", () => {
  // Caso exacto del ejemplo del §7 del documento funcional.
  it("agrupa líneas del mismo afiliado+dirección+fecha en un solo pedido con varios productos", () => {
    const lineas = [
      linea({ descripcionProducto: "Pañal A", codigoProducto: "EAN001", cantidad: 4 }),
      linea({ descripcionProducto: "Pañal B", codigoProducto: "EAN002", cantidad: 5 }),
      linea({ descripcionProducto: "Pañal C", codigoProducto: "EAN003", cantidad: 2 }),
    ];

    const pedidos = agruparLineasEnPedidos(lineas);

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].productos).toHaveLength(3);
    expect(pedidos[0].totalUnidades).toBe(11);
  });

  it("separa en pedidos distintos cuando el mismo afiliado tiene otra dirección", () => {
    const lineas = [
      linea({ direccion: "Rivadavia 100" }),
      linea({ direccion: "Av. Corrientes 200" }),
    ];

    const pedidos = agruparLineasEnPedidos(lineas);

    expect(pedidos).toHaveLength(2);
  });

  it("no cruza afiliados de clientes distintos aunque coincida todo lo demás", () => {
    const lineas = [linea({ clienteId: "cliente-1" }), linea({ clienteId: "cliente-2" })];

    const pedidos = agruparLineasEnPedidos(lineas);

    expect(pedidos).toHaveLength(2);
  });

  it("la comparación de dirección ignora mayúsculas/espacios pero no el contenido", () => {
    const lineas = [linea({ direccion: "rivadavia 100" }), linea({ direccion: "RIVADAVIA   100" })];

    const pedidos = agruparLineasEnPedidos(lineas);

    expect(pedidos).toHaveLength(1);
  });

  // Caso real 2026-09-07: dos líneas del mismo afiliado+dirección+fecha
  // pueden venir de órdenes de origen distintas (ej. Farmanet) — se
  // agrupan igual en un solo pedido (así lo pide el §7 funcional), pero
  // el ticket de cada línea tiene que sobrevivir por producto, no perderse
  // el de todas menos la primera.
  it("preserva el ticket de cada línea por separado aunque se agrupen en un solo pedido", () => {
    const lineas = [
      linea({ descripcionProducto: "Pañal A", ticket: "ORDEN-123" }),
      linea({ descripcionProducto: "Pañal B", ticket: "ORDEN-456" }),
    ];

    const pedidos = agruparLineasEnPedidos(lineas);

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].productos.map((p) => p.ticket)).toEqual(["ORDEN-123", "ORDEN-456"]);
  });

  it("une valores distintos de receta/tipo de pedido sin repetirlos y se queda con la prioridad más alta", () => {
    const pedidos = agruparLineasEnPedidos([
      linea({ receta: "ENV", tipoPedido: "DT ESP", prioridad: PrioridadPedido.NORMAL }),
      linea({ receta: "EV", tipoPedido: "DT ESP", prioridad: PrioridadPedido.URGENTE }),
      linea({ receta: "ENV", tipoPedido: null, prioridad: PrioridadPedido.NORMAL }),
    ]);

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].receta).toBe("ENV / EV");
    expect(pedidos[0].tipoPedido).toBe("DT ESP");
    expect(pedidos[0].prioridad).toBe(PrioridadPedido.URGENTE);
  });
});
