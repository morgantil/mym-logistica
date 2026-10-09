import { BadRequestException } from "@nestjs/common";
import { FacturacionService } from "./facturacion.service";

// Decisión 2026-10-06 (reunión con Pablo Renzo): "Volver a calcular" sigue
// bloqueado para un mes CONFIRMADO — reabrir es una acción separada y
// deliberada, no el mismo botón.
function armarServicio(existeConfirmado: boolean) {
  const reabrir = jest.fn().mockResolvedValue(undefined);
  const repositorio = {
    existeGrupoConfirmado: jest.fn().mockResolvedValue(existeConfirmado),
    reabrir,
  };
  const servicio = new FacturacionService(repositorio as never, {} as never, {} as never, {} as never, {} as never);
  return { servicio, reabrir };
}

describe("FacturacionService.reabrir", () => {
  it("si hay un mes confirmado, lo vuelve a BORRADOR", async () => {
    const { servicio, reabrir } = armarServicio(true);

    await servicio.reabrir("c1", 10, 2026);

    expect(reabrir).toHaveBeenCalledWith("c1", 10, 2026);
  });

  it("si no hay nada confirmado, rechaza en vez de hacer un no-op silencioso", async () => {
    const { servicio, reabrir } = armarServicio(false);

    await expect(servicio.reabrir("c1", 10, 2026)).rejects.toThrow(BadRequestException);
    expect(reabrir).not.toHaveBeenCalled();
  });
});
