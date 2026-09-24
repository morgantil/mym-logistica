import { PrioridadPedido, TipoEnvase } from "@mym/shared-types";
import { MapeoColumnas } from "./campo-canonico";
import { ReglaImportacion } from "./reglas-importacion";
import { transformarFilaMedicamento } from "./transformar-fila-medicamento";

const FECHA_LOTE = "2026-08-05";

const MAPEO_FARMAET: MapeoColumnas = {
  numeroAfiliado: "Nro de afiliado CSV",
  destinatario: "PACIENTE",
  direccion: "DOMICILIO",
  localidad: "LOCALIDAD",
  ticket: "Remito",
  receta: "Recetas",
  tipoPedido: "Tipo de pedido",
  tiempoDeEntrega: "Tiempo de entrega",
  horarioEntrega: "Horario de entrega",
  envaseTexto: "Empresa",
};

const MAPEO_BELLA_VISTA: MapeoColumnas = {
  numeroAfiliado: "N° AFILIADO",
  destinatario: "NOMBRE",
  direccion: "DIRECCION",
  localidad: "LOCALIDAD",
  ticket: "REMITO",
  receta: "RECETA",
  retiroDeReceta: "RETIRO DE RECETA",
  telefono: "TELEFONO",
  horarioEntrega: "HORA",
  cantidadBulto: "BULTO",
  cantidadBolsa: "BOLSA",
};

describe("transformarFilaMedicamento — Farmaet (una línea = una unidad Bolsa o Bulto)", () => {
  // Caso real verificado 2026-09-15 (Leonardo): BARTA SERGIO RODRIGO, 6
  // remitos distintos, 5 líneas "M&M BOLSA" + 1 línea "M&M BULTO" → 6
  // etiquetas (una por línea), factura como 6 unidades de Bulto.
  it("una fila Bolsa da una línea con cantidad 1 y descripción genérica", () => {
    const fila = {
      PACIENTE: "BARTA SERGIO RODRIGO",
      Remito: "R000108563206",
      "Nro de afiliado CSV": "60718483206",
      DOMICILIO: "Hughes N° 225",
      LOCALIDAD: "ESCOBAR",
      Empresa: "M&M BOLSA",
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_FARMAET, "farmaet", FECHA_LOTE);

    expect(resultado.valida).toBe(true);
    expect(resultado.lineas).toHaveLength(1);
    expect(resultado.lineas[0].tipoEnvase).toBe(TipoEnvase.BOLSA);
    expect(resultado.lineas[0].cantidad).toBe(1);
    expect(resultado.lineas[0].descripcionProducto).toBe("Medicamentos - Bolsa");
    expect(resultado.lineas[0].ticket).toBe("R000108563206");
  });

  it("una fila Bulto da una línea con tipoEnvase Bulto", () => {
    const fila = {
      PACIENTE: "BARTA SERGIO RODRIGO",
      Remito: "R000108563205",
      "Nro de afiliado CSV": "60718483205",
      DOMICILIO: "Hughes N° 225",
      LOCALIDAD: "ESCOBAR",
      Empresa: "M&M BULTO",
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_FARMAET, "farmaet", FECHA_LOTE);

    expect(resultado.lineas[0].tipoEnvase).toBe(TipoEnvase.BULTO);
    expect(resultado.lineas[0].descripcionProducto).toBe("Medicamentos - Bulto");
  });

  it("rechaza la fila si no se puede determinar Bolsa/Bulto", () => {
    const fila = {
      PACIENTE: "Alguien",
      Remito: "R1",
      "Nro de afiliado CSV": "123",
      DOMICILIO: "Calle 1",
      LOCALIDAD: "CABA",
      Empresa: "OTRA EMPRESA SIN DATO",
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_FARMAET, "farmaet", FECHA_LOTE);

    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toContain("No se pudo determinar Bolsa o Bulto para esta línea.");
  });

  it("guarda tipo de pedido y tiempo de entrega tal cual vienen, sin transformar", () => {
    const fila = {
      PACIENTE: "Alguien",
      Remito: "R1",
      "Nro de afiliado CSV": "123",
      DOMICILIO: "Calle 1",
      LOCALIDAD: "CABA",
      Empresa: "M&M BOLSA",
      "Tipo de pedido": "PREP_HELADERA",
      "Tiempo de entrega": "URGENCIA 24 HS",
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_FARMAET, "farmaet", FECHA_LOTE);

    expect(resultado.lineas[0].tipoPedido).toBe("PREP_HELADERA");
    expect(resultado.lineas[0].tiempoDeEntrega).toBe("URGENCIA 24 HS");
  });
});

describe("transformarFilaMedicamento — Bella Vista (Bulto y Bolsa en la misma fila)", () => {
  // Caso real verificado 2026-09-15 (Leonardo): CHIESA NORMA CATALINA,
  // Bulto=4 Bolsa=1 → imprimir 4 etiquetas de Bulto + 1 de Bolsa, facturar
  // 5 unidades de Bulto (Bolsa+Bulto → Bulto).
  it("una fila con Bulto y Bolsa a la vez da dos líneas, una por cada una", () => {
    const fila = {
      NOMBRE: "CHIESA NORMA CATALINA",
      REMITO: "R-0004-00046770",
      "N° AFILIADO": "OSDE61614122901",
      DIRECCION: "BLANCO ENCALADA 5080",
      LOCALIDAD: "VILLA URQUIZA",
      RECETA: "Digital",
      "RETIRO DE RECETA": "NO",
      HORA: "10 A 20 HS",
      BULTO: 4,
      BOLSA: 1,
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE);

    expect(resultado.valida).toBe(true);
    expect(resultado.lineas).toHaveLength(2);
    const bulto = resultado.lineas.find((l) => l.tipoEnvase === TipoEnvase.BULTO);
    const bolsa = resultado.lineas.find((l) => l.tipoEnvase === TipoEnvase.BOLSA);
    expect(bulto?.cantidad).toBe(4);
    expect(bolsa?.cantidad).toBe(1);
    // Las dos líneas comparten remito: es la misma entrega real, un solo
    // número de origen (a diferencia de Farmaet, donde cada línea SÍ es un
    // remito distinto).
    expect(bulto?.ticket).toBe("R-0004-00046770");
    expect(bolsa?.ticket).toBe("R-0004-00046770");
  });

  it("retiroDeReceta se guarda como texto tal cual viene", () => {
    const fila = {
      NOMBRE: "Alguien",
      REMITO: "R1",
      "N° AFILIADO": "1",
      DIRECCION: "Calle 1",
      LOCALIDAD: "CABA",
      "RETIRO DE RECETA": "NO",
      BULTO: 1,
      BOLSA: 0,
    };

    expect(transformarFilaMedicamento(fila, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE).lineas[0].retiroDeReceta).toBe(
      "NO",
    );
  });

  describe("reglas de importación del cliente", () => {
    const filaBase = {
      NOMBRE: "Alguien",
      REMITO: "R-0011-00004550",
      "N° AFILIADO": "OSDE61084055903",
      DIRECCION: "Calle 1",
      LOCALIDAD: "CABA",
      "RETIRO DE RECETA": "NO",
      BULTO: 1,
      BOLSA: 0,
    };
    const reglaBase = {
      id: "r",
      clienteId: "bella-vista",
      orden: 0,
      activa: true,
    };
    const reglas: ReglaImportacion[] = [
      {
        ...reglaBase,
        campoOrigen: "ticket",
        tipoCoincidencia: "CONTIENE",
        valor: "R-0011",
        accion: "ASIGNAR_VALOR",
        campoDestino: "retiroDeReceta",
        valorDestino: "RR",
      },
      {
        ...reglaBase,
        id: "r2",
        campoOrigen: "numeroAfiliado",
        tipoCoincidencia: "EMPIEZA_CON",
        valor: "OSDE",
        accion: "QUITAR_PREFIJO",
        campoDestino: "numeroAfiliado",
        valorDestino: "",
      },
    ];

    it("R-0011 pasa Retiro de receta a RR y se le saca OSDE al afiliado", () => {
      const linea = transformarFilaMedicamento(filaBase, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE, reglas).lineas[0];
      expect(linea.retiroDeReceta).toBe("RR");
      expect(linea.numeroAfiliado).toBe("61084055903");
    });

    it("un remito R-0004 no cambia nada", () => {
      const linea = transformarFilaMedicamento(
        { ...filaBase, REMITO: "R-0004-00046770" },
        MAPEO_BELLA_VISTA,
        "bella-vista",
        FECHA_LOTE,
        reglas,
      ).lineas[0];
      expect(linea.retiroDeReceta).toBe("NO");
    });

    it("sin reglas la fila se importa tal cual", () => {
      const linea = transformarFilaMedicamento(filaBase, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE).lineas[0];
      expect(linea.retiroDeReceta).toBe("NO");
      expect(linea.numeroAfiliado).toBe("OSDE61084055903");
      expect(linea.prioridad).toBe(PrioridadPedido.NORMAL);
    });
  });

  it("solo Bulto (Bolsa en 0) da una sola línea", () => {
    const fila = {
      NOMBRE: "Alguien",
      REMITO: "R1",
      "N° AFILIADO": "1",
      DIRECCION: "Calle 1",
      LOCALIDAD: "CABA",
      BULTO: 2,
      BOLSA: 0,
    };

    const resultado = transformarFilaMedicamento(fila, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE);

    expect(resultado.lineas).toHaveLength(1);
    expect(resultado.lineas[0]).toMatchObject({ tipoEnvase: TipoEnvase.BULTO, cantidad: 2 });
  });

  it("rechaza si faltan campos obligatorios (dirección)", () => {
    const fila = { NOMBRE: "Alguien", REMITO: "R1", "N° AFILIADO": "1", LOCALIDAD: "CABA", BULTO: 1 };

    const resultado = transformarFilaMedicamento(fila, MAPEO_BELLA_VISTA, "bella-vista", FECHA_LOTE);

    expect(resultado.valida).toBe(false);
    expect(resultado.errores).toContain("Falta dirección.");
  });
});
