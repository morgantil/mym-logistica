import { BadRequestException, Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { ExcelLeido, FilaExcelCruda, LectorExcelPort } from "../domain/lector-excel.port";

// Toma la hoja indicada (o la PRIMERA si no se indica). La primera fila no vacía se toma como
// encabezados. No asume nada más sobre la estructura — eso es justamente
// lo que resuelve mapeo-columnas.ts después.
@Injectable()
export class LectorExcelExceljsAdapter implements LectorExcelPort {
  async leer(buffer: Buffer, nombreHoja?: string): Promise<ExcelLeido> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException("El archivo no es un Excel válido (.xlsx).");
    }

    const nombreBuscado = nombreHoja?.trim();
    const hoja = nombreBuscado
      ? workbook.worksheets.find((candidata) => candidata.name.trim().toLowerCase() === nombreBuscado.toLowerCase())
      : workbook.worksheets[0];
    if (!hoja) {
      throw new BadRequestException(
        nombreBuscado
          ? `El Excel no tiene una hoja llamada "${nombreBuscado}". Hojas disponibles: ${workbook.worksheets
              .map((candidata) => `"${candidata.name}"`)
              .join(", ")}.`
          : "El Excel no tiene ninguna hoja.",
      );
    }

    // `includeEmpty: true` es imprescindible acá — si la primera columna (A)
    // viene vacía y los encabezados reales arrancan en B (caso real: Farmaet
    // "LA QUE IMPORTO"), `includeEmpty: false` salta esa celda y el índice 0
    // del array queda como un "hueco" (sparse) en vez de asignarse. Ese hueco
    // sobrevive a `.map()` (que lo preserva) pero rompe `new Map(...)` más
    // adelante en mapeo-columnas.ts, que al iterarlo recibe `undefined` en
    // esa posición y explota con "Iterator value undefined is not an entry
    // object" — encontrado con el archivo real de Farmaet, no hipotético.
    const filaEncabezados = hoja.getRow(1);
    const encabezados: string[] = [];
    filaEncabezados.eachCell({ includeEmpty: true }, (celda, indice) => {
      encabezados[indice - 1] = String(celda.value ?? "").trim();
    });

    if (encabezados.every((encabezado) => encabezado === "")) {
      throw new BadRequestException("No se encontraron encabezados en la primera fila.");
    }

    const filas: FilaExcelCruda[] = [];
    hoja.eachRow({ includeEmpty: false }, (fila, numeroFila) => {
      if (numeroFila === 1) return; // ya usada como encabezados

      const filaCruda: FilaExcelCruda = {};
      let tieneAlgunValor = false;
      encabezados.forEach((encabezado, indice) => {
        const celda = fila.getCell(indice + 1);
        const valor = this.valorPlano(celda.value);
        filaCruda[encabezado] = valor;
        if (valor !== null && valor !== "") tieneAlgunValor = true;
      });

      if (tieneAlgunValor) filas.push(filaCruda);
    });

    return { encabezados, filas };
  }

  // ExcelJS devuelve fechas como Date, fórmulas como { result }, texto enriquecido
  // como { richText }, etc. Acá se aplana todo a string/number/Date planos para
  // que el resto del pipeline no tenga que conocer las particularidades de ExcelJS.
  private valorPlano(valor: ExcelJS.CellValue): string | number | Date | null {
    if (valor === null || valor === undefined) return null;
    if (valor instanceof Date) return valor;
    if (typeof valor === "object") {
      if ("result" in valor) return this.valorPlano(valor.result as ExcelJS.CellValue);
      if ("richText" in valor) {
        return valor.richText.map((parte) => parte.text).join("");
      }
      if ("text" in valor) return String((valor as { text: unknown }).text);
      return null;
    }
    return typeof valor === "boolean" ? String(valor) : valor;
  }
}
