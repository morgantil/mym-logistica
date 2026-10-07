import { DestinatariosService } from "./destinatarios.service";

// Bug real 2026-10-07: a diferencia de la dirección, el teléfono de un
// destinatario ya existente nunca se refrescaba al reimportar — un pedido
// nuevo de un afiliado repetido se quedaba con el teléfono viejo guardado la
// primera vez (visto en vivo: un número sin normalizar que el fix de
// normalizar-telefono.ts del día anterior debería haber corregido).
function armarServicio(existente: { id: string; telefono: string | null; direccion: string }) {
  const actualizarTelefono = jest.fn().mockImplementation((id, telefono) => ({ ...existente, telefono }));
  const repositorio = {
    buscarPorClienteYAfiliado: jest.fn().mockResolvedValue(existente),
    actualizarTelefono,
    crear: jest.fn(),
  };
  const servicio = new DestinatariosService(repositorio as never, {} as never);
  return { servicio, actualizarTelefono };
}

describe("DestinatariosService.procesarDesdeImportacion — refresco de teléfono", () => {
  it("si el teléfono del Excel difiere del guardado, lo actualiza", async () => {
    const { servicio, actualizarTelefono } = armarServicio({
      id: "d1",
      telefono: "1138740052 (Madre) 1140387144 (Padre)",
      direccion: "Calle 1",
    });

    const resultado = await servicio.procesarDesdeImportacion({
      clienteId: "c1",
      numeroAfiliado: "123",
      nombre: "Juan",
      direccionExcel: "Calle 1",
      localidad: "CABA",
      telefono: "+5491138740052 (Madre) / +5491140387144 (Padre)",
    });

    expect(actualizarTelefono).toHaveBeenCalledWith("d1", "+5491138740052 (Madre) / +5491140387144 (Padre)");
    expect(resultado.destinatario.telefono).toBe("+5491138740052 (Madre) / +5491140387144 (Padre)");
  });

  it("si el Excel no trae teléfono (null), no pisa el que ya está guardado", async () => {
    const { servicio, actualizarTelefono } = armarServicio({ id: "d1", telefono: "+5491138740052", direccion: "Calle 1" });

    await servicio.procesarDesdeImportacion({
      clienteId: "c1",
      numeroAfiliado: "123",
      nombre: "Juan",
      direccionExcel: "Calle 1",
      localidad: "CABA",
      telefono: null,
    });

    expect(actualizarTelefono).not.toHaveBeenCalled();
  });

  it("si el teléfono ya coincide, no hace un update innecesario", async () => {
    const { servicio, actualizarTelefono } = armarServicio({ id: "d1", telefono: "+5491138740052", direccion: "Calle 1" });

    await servicio.procesarDesdeImportacion({
      clienteId: "c1",
      numeroAfiliado: "123",
      nombre: "Juan",
      direccionExcel: "Calle 1",
      localidad: "CABA",
      telefono: "+5491138740052",
    });

    expect(actualizarTelefono).not.toHaveBeenCalled();
  });
});
