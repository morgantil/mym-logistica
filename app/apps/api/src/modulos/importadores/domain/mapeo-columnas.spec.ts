import { completarMapeoGuardado, intentarMapeoAutomatico, normalizarEncabezado } from "./mapeo-columnas";

describe("completarMapeoGuardado", () => {
  it("suma campos que el perfil no tenía y respeta los ya guardados", () => {
    const completo = completarMapeoGuardado(
      { direccion: "DOMICILIO" },
      { direccion: "OTRA COLUMNA", tiempoDeEntrega: "Tiempo de entrega" },
    );
    expect(completo).toEqual({ direccion: "DOMICILIO", tiempoDeEntrega: "Tiempo de entrega" });
  });
});

describe("normalizarEncabezado", () => {
  it("saca acentos, mayúsculas y espacios de más", () => {
    expect(normalizarEncabezado("  Dirección  ")).toBe("DIRECCION");
    expect(normalizarEncabezado("N° Afiliado")).toBe("N AFILIADO");
    expect(normalizarEncabezado("Teléfono   Contacto")).toBe("TELEFONO CONTACTO");
  });
});

describe("intentarMapeoAutomatico", () => {
  it("mapea un Excel con encabezados prolijos sin dejar nada pendiente", () => {
    const encabezados = [
      "Afiliado",
      "Destinatario",
      "Dirección",
      "Localidad",
      "Fecha de Entrega",
      "Código",
      "Producto",
      "Cantidad",
    ];

    const { mapeo, camposObligatoriosFaltantes } = intentarMapeoAutomatico(encabezados);

    expect(camposObligatoriosFaltantes).toEqual([]);
    expect(mapeo.numeroAfiliado).toBe("Afiliado");
    expect(mapeo.direccion).toBe("Dirección");
    expect(mapeo.fechaEntrega).toBe("Fecha de Entrega");
  });

  it("no importa el orden ni encabezados extra que no matchean nada", () => {
    const encabezados = ["Cantidad", "Columna Random Del Cliente", "Domicilio", "Nro Afiliado", "Nombre", "Barrio", "Fecha", "Descripcion"];

    const { camposObligatoriosFaltantes, mapeo } = intentarMapeoAutomatico(encabezados);

    expect(camposObligatoriosFaltantes).toEqual([]);
    expect(mapeo.direccion).toBe("Domicilio"); // sinónimo, no el nombre canónico
    expect(mapeo.localidad).toBe("Barrio");
  });

  it("informa qué campos obligatorios no pudo mapear, sin romper", () => {
    const encabezados = ["Afiliado", "Nombre", "Cantidad"]; // faltan dirección, localidad, fecha, producto

    const { camposObligatoriosFaltantes } = intentarMapeoAutomatico(encabezados);

    expect(camposObligatoriosFaltantes).toEqual(
      expect.arrayContaining(["direccion", "localidad", "descripcionProducto"]),
    );
  });

  it("no mapea campos opcionales que no están, pero eso no cuenta como faltante", () => {
    const encabezados = ["Afiliado", "Destinatario", "Direccion", "Localidad", "Fecha", "Producto", "Cantidad"];

    const { mapeo, camposObligatoriosFaltantes } = intentarMapeoAutomatico(encabezados);

    expect(mapeo.ticket).toBeUndefined();
    expect(camposObligatoriosFaltantes).toEqual([]);
  });
});
