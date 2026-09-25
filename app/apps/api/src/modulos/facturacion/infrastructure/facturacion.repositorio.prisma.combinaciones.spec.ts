import { BadRequestException } from "@nestjs/common";
import { FacturacionRepositorioPrisma } from "./facturacion.repositorio.prisma";

// Prisma falso mínimo: solo lo que usa crearCombinacion.
function armarRepositorio(existente: { id: string; eliminadoEn: Date | null } | null) {
  const update = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      id: "c1",
      clienteMedicamentoId: "med",
      clientePanalId: "pan",
      nombre: data.nombre,
      activa: true,
      clienteMedicamento: { nombre: "Med" },
      clientePanal: { nombre: "Pan" },
    }),
  );
  const create = jest.fn().mockResolvedValue({
    id: "nueva",
    clienteMedicamentoId: "med",
    clientePanalId: "pan",
    nombre: null,
    activa: true,
    clienteMedicamento: { nombre: "Med" },
    clientePanal: { nombre: "Pan" },
  });
  const prisma = {
    combinacionUnificacionClientes: { findFirst: jest.fn().mockResolvedValue(existente), update, create },
  };
  return { repositorio: new FacturacionRepositorioPrisma(prisma as never), update, create };
}

describe("FacturacionRepositorioPrisma.crearCombinacion", () => {
  it("reactiva una combinación quitada en vez de decir que ya existe", async () => {
    const { repositorio, update, create } = armarRepositorio({ id: "c1", eliminadoEn: new Date() });

    const resultado = await repositorio.crearCombinacion({
      clienteMedicamentoId: "med",
      clientePanalId: "pan",
      nombre: "Uni Bella Vista",
    });

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { eliminadoEn: null, activa: true, nombre: "Uni Bella Vista" },
      }),
    );
    expect(resultado.nombre).toBe("Uni Bella Vista");
  });

  it("sigue rechazando una combinación que está activa", async () => {
    const { repositorio } = armarRepositorio({ id: "c1", eliminadoEn: null });

    await expect(
      repositorio.crearCombinacion({ clienteMedicamentoId: "med", clientePanalId: "pan" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("crea una nueva si no existe ninguna", async () => {
    const { repositorio, create } = armarRepositorio(null);

    await repositorio.crearCombinacion({ clienteMedicamentoId: "med", clientePanalId: "pan" });

    expect(create).toHaveBeenCalledTimes(1);
  });
});
