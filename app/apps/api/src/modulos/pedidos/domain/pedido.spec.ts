import { agruparLineasEnPedidos, LineaExcelPanales } from "./pedido";

function linea(overrides: Partial<LineaExcelPanales> = {}): LineaExcelPanales {
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
});
