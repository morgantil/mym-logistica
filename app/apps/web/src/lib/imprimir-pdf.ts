// Pedido real 2026-10-09 (reunión): en vez de descargar el PDF (el usuario
// tenía que ir a buscarlo y abrirlo con lo que tuviera por default — ahí
// es donde cada visor decide su propio ajuste de escala, causa más probable
// del desfasaje visto al imprimir remitos en papel preimpreso), abrir
// directo el diálogo nativo de impresión del navegador (elegir impresora +
// opciones), sin que el archivo quede guardado en Descargas.
//
// Se carga el PDF en un iframe oculto y se llama a `print()` sobre esa
// ventana apenas termina de cargar — el iframe (no la pestaña principal)
// es lo que se imprime. El iframe se saca del DOM recién después de un
// rato: no hay forma confiable entre navegadores de saber cuándo el
// usuario cerró el diálogo de impresión.
export function imprimirPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  iframe.onload = () => {
    // Pequeño delay: algunos navegadores necesitan que el iframe tenga foco
    // antes de que `print()` dispare el diálogo de verdad.
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 100);
  };

  document.body.appendChild(iframe);

  setTimeout(() => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 60_000);
}
