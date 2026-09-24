import PDFDocument from "pdfkit";
import { TipoEnvase } from "@mym/shared-types";
import { textoEtiquetaEnvase, tiposEnvasePorEtiqueta } from "../domain/etiquetas-envase";
import { PedidoListado } from "../domain/pedido";

// §8.2 funcional v6: etiqueta de bulto, una por cada bulto del pedido,
// identificando cada unidad sobre el total (ej. "Bulto 2/4"). Sin código QR
// en esta etapa. Tamaño de etiqueta NO definido por el cliente todavía
// (el propio documento v6 lo deja como validación pendiente) — se usa acá
// un tamaño estándar de envío (10×15cm, común en impresoras térmicas) como
// default razonable, fácil de ajustar el día que se confirme el tamaño/
// impresora real: solo hay que cambiar ANCHO_MM/ALTO_MM.
const ANCHO_MM = 100;
const ALTO_MM = 150;
const MM_A_PT = 2.834645669;
const ANCHO_PT = ANCHO_MM * MM_A_PT;
const ALTO_PT = ALTO_MM * MM_A_PT;
const MARGEN_PT = 5 * MM_A_PT;

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}

function dibujarEtiqueta(
  doc: PDFKit.PDFDocument,
  pedido: PedidoListado,
  numeroBulto: number,
  totalBultos: number,
  tipoEnvase: TipoEnvase | null,
) {
  const anchoUtil = ANCHO_PT - MARGEN_PT * 2;

  doc.fontSize(10).font("Helvetica-Bold").text(`Pedido N.º ${pedido.numero}`, { width: anchoUtil });
  doc.moveDown(0.3);
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(`${textoEtiquetaEnvase(tipoEnvase)} ${numeroBulto}/${totalBultos}`, { width: anchoUtil });
  doc.moveDown(0.6);

  doc.fontSize(9).font("Helvetica").text(`Fecha de entrega: ${formatearFecha(pedido.fechaProgramada)}`, {
    width: anchoUtil,
  });
  doc.moveDown(0.3);
  doc.fontSize(9).text(`Cliente: ${pedido.clienteNombre}`, { width: anchoUtil });
  doc.moveDown(0.6);

  doc.fontSize(12).font("Helvetica-Bold").text(pedido.destinatarioNombre, { width: anchoUtil });
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica").text(pedido.direccionUsada, { width: anchoUtil });
  doc.fontSize(11).text(pedido.localidad, { width: anchoUtil });

  if (pedido.observaciones) {
    doc.moveDown(0.4);
    doc.fontSize(9).font("Helvetica-Oblique").text(pedido.observaciones, { width: anchoUtil });
  }
}

// Genera un PDF con una página por cada número de bulto pedido —
// `numerosBulto` permite tanto "todas las etiquetas de un pedido" (1..N)
// como "una etiqueta puntual" (§8.2: "reimprimir todas las etiquetas de un
// pedido o una etiqueta puntual").
export async function generarEtiquetasPdf(
  pedido: PedidoListado,
  numerosBulto: number[],
): Promise<Buffer> {
  const totalBultos = pedido.bultos ?? 0;
  // Medicamentos: cada etiqueta dice si es Bolsa o Bulto (null = genérica).
  const tipos = tiposEnvasePorEtiqueta(pedido.productos, totalBultos);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [ANCHO_PT, ALTO_PT], margin: MARGEN_PT });
    const partes: Buffer[] = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    numerosBulto.forEach((numeroBulto, indice) => {
      if (indice > 0) doc.addPage({ size: [ANCHO_PT, ALTO_PT], margin: MARGEN_PT });
      dibujarEtiqueta(doc, pedido, numeroBulto, totalBultos, tipos?.[numeroBulto - 1] ?? null);
    });

    doc.end();
  });
}
