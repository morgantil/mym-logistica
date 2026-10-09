import PDFDocument from "pdfkit";
import { TipoEnvase } from "@mym/shared-types";
import { textoEtiquetaEnvase, tiposEnvasePorEtiqueta } from "../domain/etiquetas-envase";
import { PedidoListado } from "../domain/pedido";

// §8.2 funcional v6: etiqueta de bulto, una por cada bulto del pedido,
// identificando cada unidad sobre el total (ej. "Bulto 2/4"). Sin código QR
// en esta etapa. Tamaño real confirmado 2026-10-09 contra la impresora
// térmica real (SATO CG408, rollo continuo) — reemplaza el default de
// 10×15cm que se usaba antes de tener el dato real (item 3.1). La PÁGINA se
// mantiene en el tamaño físico que tiene calibrado el driver de la SATO
// (Ancho 70mm × Altura 100mm) — no se invierte, porque el sensor de gap de
// la impresora espera ese tamaño exacto. Lo que se rota 90° es el
// CONTENIDO (ver `doc.rotate` en dibujarEtiqueta), para que el texto se
// escriba a lo largo de los 100mm en vez de los 70mm, sin tocar el tamaño
// de página que ya está calibrado.
const ANCHO_MM = 70;
const ALTO_MM = 100;
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
  // La página real es ANCHO_PT(70mm) × ALTO_PT(100mm) — el tamaño físico
  // calibrado en la SATO. Rotamos el contenido alrededor del centro de la
  // página para escribir en una caja "virtual" de ALTO_PT(100mm) de ancho ×
  // ANCHO_PT(70mm) de alto — una caja de ese tamaño, centrada en el mismo
  // punto, al rotarla 90° ocupa exactamente los límites de la página real.
  // El SENTIDO (-90 acá) es el que probamos y vimos que arma el texto bien
  // apilado sin cortar nada (2026-10-09) — falta confirmar con una
  // impresión real en la SATO si el texto queda del lado correcto una vez
  // que se orienta la etiqueta física para leerla (si sale al revés, es
  // cambiar este -90 por 90, nada más).
  const centroX = ANCHO_PT / 2;
  const centroY = ALTO_PT / 2;
  doc.rotate(-90, { origin: [centroX, centroY] });

  const anchoUtil = ALTO_PT - MARGEN_PT * 2;
  const xInicio = centroX - ALTO_PT / 2 + MARGEN_PT;
  const yInicio = centroY - ANCHO_PT / 2 + MARGEN_PT;

  doc.fontSize(10).font("Helvetica-Bold").text(`Pedido N.º ${pedido.numero}`, xInicio, yInicio, { width: anchoUtil });
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
