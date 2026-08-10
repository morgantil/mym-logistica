import { MapeoColumnas } from "./campo-canonico";
import { transformarFila } from "./transformar-fila";

const MAPEO: MapeoColumnas = {
  numeroAfiliado: "Afiliado",
  destinatario: "Nombre",
  direccion: "Domicilio",
  localidad: "Barrio",
  fechaEntrega: "Fecha",
  descripcionProducto: "Producto",
  cantidad: "Cantidad",
  codigoProducto: "Codigo",
};

describe("transformarFila", () => {
  it("transforma una fila completa en una línea válida", () => {
    const resultado = transformarFila(
      {
        Afiliado: 12345,
        Nombre: "Juan Pérez",
        Domicilio: "Rivadavia 100",
        Barrio: "Once",
        Fecha: new Date("2026-08-15"),
        Producto: "Pañal A",
        Cantidad: 4,
        Codigo: "EAN001",
      },
      MAPEO,
      "cliente-1",
    );

    expect(resultado.valida).toBe(true);
    expect(resultado.errores).toEqual([]);
    expect(resultado.linea).toMatchObject({
      clienteId: "cliente-1",
      numeroAfiliado: "12345",
      destinatario: "Juan Pérez",
      direccion: "Rivadavia 100",
      fechaEntrega: "2026-08-15",
      cantidad: 4,
      codigoProducto: "EAN001",
    });
  });

  it("una fila con datos faltantes queda marcada, no explota", () => {
    const resultado = transformarFila(
      { Afiliado: "12345", Nombre: "", Domicilio: "Rivadavia 100" },
      MAPEO,
      "cliente-1",
    );

    expect(resultado.valida).toBe(false);
    expect(resultado.linea).toBeNull();
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores).toContain("Falta destinatario.");
  });

  it("cantidad no numérica o cero se trata como faltante, no como NaN silencioso", () => {
    const resultado = transformarFila(
      {
        Afiliado: "1",
        Nombre: "Juan",
        Domicilio: "Calle 1",
        Barrio: "B",
        Fecha: "2026-01-01",
        Producto: "X",
        Cantidad: 0,
      },
      MAPEO,
      "cliente-1",
    );

    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toContain("Falta o es inválida la cantidad.");
  });

  it("separa la fecha de una observación pegada en la misma celda (Biosíntesis/Bella Vista/Farmapal reales)", () => {
    const resultado = transformarFila(
      {
        Afiliado: "12345",
        Nombre: "Juan Pérez",
        Domicilio: "Rivadavia 100",
        Barrio: "Once",
        Fecha: "2026-08-06 UF03 PIDE QUE INGRESE",
        Producto: "Pañal A",
        Cantidad: 4,
      },
      MAPEO,
      "cliente-1",
    );

    expect(resultado.valida).toBe(true);
    expect(resultado.linea).toMatchObject({
      fechaEntrega: "2026-08-06",
      notaFecha: "UF03 PIDE QUE INGRESE",
    });
  });

  it("una fecha sin ningún patrón reconocible al inicio sigue siendo inválida", () => {
    const resultado = transformarFila(
      {
        Afiliado: "12345",
        Nombre: "Juan Pérez",
        Domicilio: "Rivadavia 100",
        Barrio: "Once",
        Fecha: "sin fecha reconocible",
        Producto: "Pañal A",
        Cantidad: 4,
      },
      MAPEO,
      "cliente-1",
    );

    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toContain("Falta o es inválida la fecha de entrega.");
  });

  it("campo obligatorio sin mapeo (encabezado no confirmado) también cuenta como faltante", () => {
    const mapeoIncompleto: MapeoColumnas = { ...MAPEO };
    delete mapeoIncompleto.localidad;

    const resultado = transformarFila(
      { Afiliado: "1", Nombre: "Juan", Domicilio: "Calle 1", Fecha: "2026-01-01", Producto: "X", Cantidad: 2 },
      mapeoIncompleto,
      "cliente-1",
    );

    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toContain("Falta localidad.");
  });
});
