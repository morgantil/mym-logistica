import PDFDocument from "pdfkit";
import { FormatoRemito } from "@mym/shared-types";
import { PedidoListado } from "../domain/pedido";

// Remito PREIMPRESO: el papel ya trae membrete, rótulos y líneas divisorias
// (ver Boceto_remitos_con_medidas.png) — acá solo imprimimos los datos
// variables, en las coordenadas exactas que confirmó Pablo Renzo (cliente)
// el 02/10/2026 (Medidas_remitos_Bella_Vista_Farmapal.xlsx). Todas las
// medidas están tomadas desde el borde superior izquierdo de la hoja, igual
// que pdfkit posiciona texto con x/y absolutos — no hace falta convertir.
//
// Una sola página por remito, aunque el papel sea "triplicado"/"duplicado":
// en Argentina esos términos describen el PAPEL físico (varias capas
// autocopiativas unidas, tipo carbónico), no que haya que imprimir varias
// veces — una sola pasada por la impresora ya transfiere a todas las copias.
const CM_A_PT = 28.3464567;
const cm = (valor: number) => valor * CM_A_PT;

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}

// Lista de Cantidad/Descripción: una fila por línea de producto, dentro del
// alto disponible de la caja. Si el pedido tiene más líneas de las que
// entran con el alto de fila normal, se achica la fila en vez de recortar
// filas — nunca se oculta un producto.
function dibujarProductos(
  doc: PDFKit.PDFDocument,
  pedido: PedidoListado,
  posicion: { xCantidad: number; xDescripcion: number; y: number; anchoDescripcion: number; altoCaja: number },
) {
  const productos = pedido.productos.length > 0 ? pedido.productos : [{ cantidad: 0, descripcion: "—" }];
  const altoFilaNormal = cm(0.5);
  const altoFila = Math.min(altoFilaNormal, cm(posicion.altoCaja) / productos.length);
  const fontSize = altoFila < cm(0.4) ? 7 : 9;

  doc.font("Helvetica").fontSize(fontSize);
  productos.forEach((producto, indice) => {
    const y = cm(posicion.y) + indice * altoFila;
    doc.text(String(producto.cantidad), cm(posicion.xCantidad), y, { lineBreak: false });
    doc.text(producto.descripcion, cm(posicion.xDescripcion), y, {
      width: cm(posicion.anchoDescripcion),
      height: altoFila,
      ellipsis: true,
    });
  });
}

// Bug real encontrado en reunión 2026-10-06 (Pablo Renzo): este renglón
// imprimía solo el rótulo fijo "Nº de pedido" — las Observaciones reales del
// pedido (ahí vive "entre calles", fusionado al importar, ver
// campo-canonico.ts) nunca salían en el papel. Ahora se imprimen las tres
// cosas, apiladas: Nº de pedido (fijo, para rastrear el pedido en el
// sistema), Observaciones (el dato real que pide el cliente) y Comentario
// (info operativa del día de reparto) si están cargados.
function dibujarObservaciones(
  doc: PDFKit.PDFDocument,
  pedido: PedidoListado,
  posicion: { x: number; y: number; ancho: number },
) {
  let y = cm(posicion.y);
  doc.font("Helvetica-Bold").fontSize(9).text(`N.º de pedido: ${pedido.numero}`, cm(posicion.x), y, {
    width: cm(posicion.ancho),
  });
  y += cm(0.45);

  if (pedido.observaciones) {
    doc.font("Helvetica").fontSize(8).text(pedido.observaciones, cm(posicion.x), y, {
      width: cm(posicion.ancho),
    });
    y += doc.heightOfString(pedido.observaciones, { width: cm(posicion.ancho) }) + cm(0.1);
  }

  if (pedido.comentario) {
    doc.font("Helvetica").fontSize(8).text(pedido.comentario, cm(posicion.x), y, {
      width: cm(posicion.ancho),
    });
  }
}

function dibujarRemitoBellaVista(doc: PDFKit.PDFDocument, pedido: PedidoListado) {
  doc.font("Helvetica").fontSize(10).text(formatearFecha(pedido.fechaProgramada), cm(14.3), cm(4), {
    lineBreak: false,
  });

  // "Nombre y apellido · Dirección · Localidad" es un único renglón en este
  // formato (así lo agrupa el propio papel).
  doc.fontSize(10).text(`${pedido.destinatarioNombre} - ${pedido.direccionUsada}, ${pedido.localidad}`, cm(1.2), cm(7), {
    width: cm(17),
  });

  // "Entre calles" no se captura como campo propio (se fusiona a
  // Observaciones al importar, ver campo-canonico.ts) — en ese renglón del
  // papel va el Nº de afiliado, el otro dato que muestra el boceto ahí.
  doc.fontSize(10).text(`N.º de afiliado: ${pedido.numeroAfiliado}`, cm(1.2), cm(8), { width: cm(17) });

  dibujarProductos(doc, pedido, {
    xCantidad: 1.2,
    xDescripcion: 3.2,
    y: 9.5,
    anchoDescripcion: 17.5,
    altoCaja: 10,
  });

  dibujarObservaciones(doc, pedido, { x: 3.5, y: 21, ancho: 17 });
}

// Prueba de impresión real en papel preimpreso 2026-10-09 (reunión): el
// problema real no eran estas coordenadas sino el tamaño de papel de la
// impresora (quedaba en A4/Carta en vez de 17×22cm) — una vez fijado eso del
// lado de la impresora, Nombre y Observaciones pedían bajar 0,3cm más de lo
// que decía el Excel original (quedaban muy pegados al renglón preimpreso de
// arriba). Fecha y Dirección no se tocaron, salieron bien.
function dibujarRemitoFarmapal(doc: PDFKit.PDFDocument, pedido: PedidoListado) {
  doc.font("Helvetica").fontSize(9).text(formatearFecha(pedido.fechaProgramada), cm(11), cm(3.2), {
    lineBreak: false,
  });

  doc.fontSize(9).text(`${pedido.destinatarioNombre}   Afiliado: ${pedido.numeroAfiliado}`, cm(1), cm(5.3), {
    width: cm(15),
  });

  // Igual que en Bella Vista: no hay un campo "entre calles" propio, va
  // dirección + localidad (el papel ya agrupa los tres en un renglón).
  doc.fontSize(9).text(`${pedido.direccionUsada}, ${pedido.localidad}`, cm(1), cm(6.5), { width: cm(15) });

  dibujarProductos(doc, pedido, {
    xCantidad: 1,
    xDescripcion: 3,
    y: 7.7,
    anchoDescripcion: 13,
    altoCaja: 9,
  });

  dibujarObservaciones(doc, pedido, { x: 1, y: 17.4, ancho: 4.5 });
}

const PAPEL: Record<FormatoRemito, { anchoCm: number; altoCm: number; dibujar: typeof dibujarRemitoBellaVista }> = {
  [FormatoRemito.BELLA_VISTA]: { anchoCm: 21, altoCm: 29.7, dibujar: dibujarRemitoBellaVista },
  [FormatoRemito.FARMAPAL]: { anchoCm: 17, altoCm: 22, dibujar: dibujarRemitoFarmapal },
};

export async function generarRemitoPdf(pedido: PedidoListado, formato: FormatoRemito): Promise<Buffer> {
  const papel = PAPEL[formato];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [cm(papel.anchoCm), cm(papel.altoCm)], margin: 0 });
    const partes: Buffer[] = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    papel.dibujar(doc, pedido);

    doc.end();
  });
}
