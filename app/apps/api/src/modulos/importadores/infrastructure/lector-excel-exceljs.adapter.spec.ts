import * as ExcelJS from "exceljs";
import { LectorExcelExceljsAdapter } from "./lector-excel-exceljs.adapter";

async function bufferDeWorkbook(construir: (hoja: ExcelJS.Worksheet) => void): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Hoja1");
  construir(hoja);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe("LectorExcelExceljsAdapter", () => {
  const adapter = new LectorExcelExceljsAdapter();

  it("lee un Excel normal, con encabezados en todas las columnas", async () => {
    const buffer = await bufferDeWorkbook((hoja) => {
      hoja.addRow(["PACIENTE", "DOMICILIO"]);
      hoja.addRow(["Juan Pérez", "Calle Falsa 123"]);
    });

    const { encabezados, filas } = await adapter.leer(buffer);

    expect(encabezados).toEqual(["PACIENTE", "DOMICILIO"]);
    expect(filas).toEqual([{ PACIENTE: "Juan Pérez", DOMICILIO: "Calle Falsa 123" }]);
  });

  // Caso real (Farmaet "LA QUE IMPORTO", encontrado por Leonardo probando en
  // vivo, 2026-09-16): la columna A viene vacía y los encabezados reales
  // arrancan en B — con `includeEmpty: false` esto dejaba un hueco (sparse)
  // en el índice 0 de `encabezados`, que más tarde hacía explotar
  // `intentarMapeoAutomatico` con "Iterator value undefined is not an entry
  // object" al construir un Map a partir de ese array.
  it("no explota cuando la primera columna del encabezado viene vacía", async () => {
    const buffer = await bufferDeWorkbook((hoja) => {
      hoja.getRow(1).getCell(2).value = "PACIENTE";
      hoja.getRow(1).getCell(3).value = "DOMICILIO";
      hoja.getRow(2).getCell(2).value = "Juan Pérez";
      hoja.getRow(2).getCell(3).value = "Calle Falsa 123";
    });

    const { encabezados, filas } = await adapter.leer(buffer);

    expect(encabezados).toEqual(["", "PACIENTE", "DOMICILIO"]);
    expect(filas).toEqual([{ "": null, PACIENTE: "Juan Pérez", DOMICILIO: "Calle Falsa 123" }]);
  });

  it("rechaza un Excel sin ningún encabezado", async () => {
    const buffer = await bufferDeWorkbook(() => {});

    await expect(adapter.leer(buffer)).rejects.toThrow("No se encontraron encabezados en la primera fila.");
  });

  it("con un encabezado repetido, una columna vacía no pisa a la que tiene valor", async () => {
    const buffer = await bufferDeWorkbook((hoja) => {
      hoja.addRow(["PACIENTE", "DOMICILIO", "DOMICILIO"]);
      hoja.addRow(["Juan Pérez", "Calle Falsa 123", null]);
      hoja.addRow(["Ana Gómez", null, "Otra 45"]);
    });

    const { filas } = await adapter.leer(buffer);

    expect(filas.map((fila) => fila.DOMICILIO)).toEqual(["Calle Falsa 123", "Otra 45"]);
  });

  it("repara texto con codificación rota (NÂ° → N°)", async () => {
    const buffer = await bufferDeWorkbook((hoja) => {
      hoja.addRow(["PACIENTE", "DOMICILIO"]);
      hoja.addRow(["Juan Pérez", "Hughes NÂ° 225"]);
    });

    const { filas } = await adapter.leer(buffer);

    expect(filas[0].DOMICILIO).toBe("Hughes N° 225");
  });

  it("sin encabezado: las columnas se llaman A, B, C… y la fila 1 es un dato", async () => {
    const buffer = await bufferDeWorkbook((hoja) => {
      hoja.addRow([83275, "PILAR", "ACCIARI GRACIELA"]);
      hoja.addRow([83302, "ESCOBAR", "ALDAX LIDIA"]);
    });

    const { encabezados, filas } = await adapter.leer(buffer, { sinEncabezado: true });

    expect(encabezados).toEqual(["A", "B", "C"]);
    expect(filas).toEqual([
      { A: 83275, B: "PILAR", C: "ACCIARI GRACIELA" },
      { A: 83302, B: "ESCOBAR", C: "ALDAX LIDIA" },
    ]);
  });

  it("elige la hoja por nombre", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Primera").addRow(["X"]);
    const segunda = workbook.addWorksheet("Hoja1");
    segunda.addRow(["PACIENTE"]);
    segunda.addRow(["Juan"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const { filas } = await adapter.leer(buffer, { nombreHoja: "hoja1" });

    expect(filas).toEqual([{ PACIENTE: "Juan" }]);
  });
});
