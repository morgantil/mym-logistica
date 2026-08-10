import { BadRequestException, Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { ExcelLeido, FilaExcelCruda, LectorExcelPort } from "../domain/lector-excel.port";

// Toma la PRIMERA hoja del archivo. La primera fila no vacía se toma como
// encabezados. No asume nada más sobre la estructura — eso es justamente
// lo que resuelve mapeo-columnas.ts después.
@Injectable()
export class LectorExcelExceljsAdapter implements LectorExcelPort {
  async leer(buffer: Buffer): Promise<ExcelLeido> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException("El archivo no es un Excel válido (.xlsx).");
    }

    const hoja = workbook.worksheets[0];
    if (!hoja) {
      throw new BadRequestException("El Excel no tiene ninguna hoja.");
    }

    const filaEncabezados = hoja.getRow(1);
    const encabezados: string[] = [];
    filaEncabezados.eachCell({ includeEmpty: false }, (celda, indice) => {
      encabezados[indice - 1] = String(celda.value ?? "").trim();
    });

    if (encabezados.length === 0) {
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
