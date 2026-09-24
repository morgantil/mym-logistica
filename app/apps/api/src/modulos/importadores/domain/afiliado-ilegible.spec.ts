import { PrioridadPedido } from "@mym/shared-types";
import { LineaExcelImportada } from "../../pedidos/domain/pedido";
import { esAfiliadoIlegible, resolverAfiliadosIlegibles } from "./afiliado-ilegible";

function linea(destinatario: string, numeroAfiliado: string): LineaExcelImportada {
  return {
    clienteId: "c1",
    numeroAfiliado,
    destinatario,
    direccion: "Calle 1",
    localidad: "CABA",
    telefono: null,
    fechaEntrega: "2026-09-30",
    notaFecha: null,
    ticket: null,
    codigoProducto: null,
    descripcionProducto: "Medicamentos - Bolsa",
    cantidad: 1,
    tipoEnvase: null,
    receta: null,
    tipoPedido: null,
    retiroDeReceta: null,
    tiempoDeEntrega: null,
    horarioEntrega: null,
    entreCalles: null,
    afiliadoIlegible: esAfiliadoIlegible(numeroAfiliado),
    prioridad: PrioridadPedido.NORMAL,
  };
}

describe("esAfiliadoIlegible", () => {
  it("detecta notación científica", () => {
    expect(esAfiliadoIlegible("6.04E+14")).toBe(true);
    expect(esAfiliadoIlegible("6,04e+14")).toBe(true);
    expect(esAfiliadoIlegible("6E+13")).toBe(true);
  });

  it("no marca números ni códigos normales", () => {
    expect(esAfiliadoIlegible("60573892002")).toBe(false);
    expect(esAfiliadoIlegible("OSDE61084055903")).toBe(false);
    expect(esAfiliadoIlegible("12E45")).toBe(false);
  });
});

describe("resolverAfiliadosIlegibles", () => {
  it("recupera el afiliado completo si el mismo paciente lo trae en otra línea", () => {
    const resultado = resolverAfiliadosIlegibles([
      linea("BARTA SERGIO RODRIGO", "6.07E+14"),
      linea("Barta Sergio Rodrigo", "60718483205"),
    ]);
    expect(resultado.map((l) => l.numeroAfiliado)).toEqual(["60718483205", "60718483205"]);
    expect(resultado.every((l) => !l.afiliadoIlegible)).toBe(true);
  });

  it("sin afiliado completo en el archivo, usa un identificador estable por nombre", () => {
    const resultado = resolverAfiliadosIlegibles([
      linea("ACCIARI GRACIELA SUSANA", "6.04E+14"),
      linea("ALTIERI, CAMILA SOLEDAD", "6.04E+14"),
    ]);
    expect(resultado[0].numeroAfiliado).toBe("SIN-AFI-ACCIARI-GRACIELA-SUSANA");
    expect(resultado[1].numeroAfiliado).toBe("SIN-AFI-ALTIERI-CAMILA-SOLEDAD");
    expect(resultado.every((l) => l.afiliadoIlegible)).toBe(true);
  });

  it("no adivina si el mismo nombre tiene dos afiliados completos distintos", () => {
    const resultado = resolverAfiliadosIlegibles([
      linea("PEREZ JUAN", "6.04E+14"),
      linea("PEREZ JUAN", "60000000001"),
      linea("PEREZ JUAN", "60000000002"),
    ]);
    expect(resultado[0].numeroAfiliado).toBe("SIN-AFI-PEREZ-JUAN");
    expect(resultado[0].afiliadoIlegible).toBe(true);
  });

  it("no toca las líneas con afiliado normal", () => {
    const original = linea("LOPEZ ANA", "60573892002");
    expect(resolverAfiliadosIlegibles([original])).toEqual([original]);
  });
});
