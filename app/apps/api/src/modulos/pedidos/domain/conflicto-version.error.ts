// DOCUMENTO TECNICO.md sección 2, "Bloqueo optimista de edición": si dos
// usuarios editan el mismo pedido a la vez, el segundo que guarda recibe este
// error en vez de pisar el cambio del primero en silencio. La capa interface
// (controller) lo traduce a HTTP 409.
export class ConflictoVersionError extends Error {
  constructor(pedidoId: string) {
    super(
      `El pedido ${pedidoId} fue modificado por otra persona mientras lo tenías abierto. Refrescá y volvé a intentar.`,
    );
    this.name = "ConflictoVersionError";
  }
}
