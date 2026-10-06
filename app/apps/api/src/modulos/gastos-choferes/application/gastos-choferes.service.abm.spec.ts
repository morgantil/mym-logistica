import { NotFoundException } from "@nestjs/common";
import { TipoGastoChofer } from "@mym/shared-types";
import { GastosChoferesService } from "./gastos-choferes.service";

// ABM manual (item 14.1 TEMAS_PENDIENTES.md, reunión 2026-10-06) — a
// diferencia del import en bloque, acá el chofer siempre viene de un
// desplegable (choferId real), nunca texto libre.
function armarServicio() {
  const crear = jest.fn().mockImplementation((datos) => Promise.resolve({ id: "g1", ...datos }));
  const actualizar = jest.fn().mockImplementation((id, datos) => Promise.resolve({ id, ...datos }));
  const eliminar = jest.fn().mockResolvedValue(undefined);
  const repositorio = { crear, actualizar, eliminar };
  const zonasChoferesService = {
    listarChoferes: jest.fn().mockResolvedValue([{ id: 42, nombre: "Lucía" }]),
  };
  const servicio = new GastosChoferesService(repositorio as never, {} as never, zonasChoferesService as never);
  return { servicio, crear, actualizar, eliminar };
}

describe("GastosChoferesService — ABM manual", () => {
  it("crea un gasto resolviendo el chofer elegido en el desplegable", async () => {
    const { servicio, crear } = armarServicio();

    await servicio.crear({
      tipo: TipoGastoChofer.COMBUSTIBLE,
      fecha: new Date("2026-10-06T00:00:00.000Z"),
      monto: 1000,
      choferId: "42",
      proveedor: "YPF",
      comprobante: "A-1",
    });

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        choferId: "42",
        choferNombre: "Lucía",
        choferNombreOriginal: "Lucía",
        archivoOrigen: "Carga manual",
      }),
    );
  });

  it("crear rechaza si el choferId no existe", async () => {
    const { servicio } = armarServicio();

    await expect(
      servicio.crear({
        tipo: TipoGastoChofer.PEAJE,
        fecha: new Date(),
        monto: 100,
        choferId: "999",
        proveedor: null,
        comprobante: null,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("actualizar solo resuelve el chofer si choferId viene en los cambios", async () => {
    const { servicio, actualizar } = armarServicio();

    await servicio.actualizar("g1", { monto: 1500 });

    expect(actualizar).toHaveBeenCalledWith("g1", expect.objectContaining({ monto: 1500 }));
    expect(actualizar.mock.calls[0][1]).not.toHaveProperty("choferId");
  });

  it("eliminar delega directo al repositorio (borrado lógico)", async () => {
    const { servicio, eliminar } = armarServicio();

    await servicio.eliminar("g1");

    expect(eliminar).toHaveBeenCalledWith("g1");
  });
});
