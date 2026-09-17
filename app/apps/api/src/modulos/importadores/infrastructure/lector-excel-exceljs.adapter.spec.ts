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
});
