import { FacturacionService } from "./facturacion.service";

// Decisión 2026-10-04: "% de ajuste" sobre tarifas y montos activos de un
// cliente. Repositorio falso mínimo — solo lo que toca este método.
function armarServicio(datos: {
  tarifas: { id: string; monto: number; activa: boolean }[];
  montos: { id: string; monto: number; activa: boolean }[];
}) {
  const actualizarTarifa = jest.fn();
  const actualizarMontoUnificadoMedicamento = jest.fn();
  const repositorio = {
    listarTarifas: jest.fn().mockResolvedValue(datos.tarifas),
    listarMontosUnificadoMedicamento: jest.fn().mockResolvedValue(datos.montos),
    actualizarTarifa,
    actualizarMontoUnificadoMedicamento,
  };
  const servicio = new FacturacionService(repositorio as never, {} as never, {} as never, {} as never, {} as never, {} as never);
  return { servicio, actualizarTarifa, actualizarMontoUnificadoMedicamento };
}

describe("FacturacionService.aplicarAjustePorcentual", () => {
  it("sube el monto de las tarifas y montos activos según el %", async () => {
    const { servicio, actualizarTarifa, actualizarMontoUnificadoMedicamento } = armarServicio({
      tarifas: [
        { id: "t1", monto: 1000, activa: true },
        { id: "t2", monto: 2000, activa: false },
      ],
      montos: [{ id: "m1", monto: 500, activa: true }],
    });

    const resultado = await servicio.aplicarAjustePorcentual("c1", 10);

    expect(actualizarTarifa).toHaveBeenCalledTimes(1);
    expect(actualizarTarifa).toHaveBeenCalledWith("t1", { monto: 1100 });
    expect(actualizarMontoUnificadoMedicamento).toHaveBeenCalledWith("m1", { monto: 550 });
    expect(resultado).toEqual({ tarifasActualizadas: 1, montosActualizados: 1 });
  });

  it("no toca las filas inactivas", async () => {
    const { actualizarTarifa, servicio } = armarServicio({
      tarifas: [{ id: "t1", monto: 1000, activa: false }],
      montos: [],
    });

    await servicio.aplicarAjustePorcentual("c1", 20);

    expect(actualizarTarifa).not.toHaveBeenCalled();
  });

  it("acepta un porcentaje negativo (rebaja) sin dejar un monto negativo", async () => {
    const { servicio, actualizarTarifa } = armarServicio({
      tarifas: [{ id: "t1", monto: 100, activa: true }],
      montos: [],
    });

    await servicio.aplicarAjustePorcentual("c1", -50);
    expect(actualizarTarifa).toHaveBeenCalledWith("t1", { monto: 50 });

    actualizarTarifa.mockClear();
    const { servicio: servicio2, actualizarTarifa: actualizarTarifa2 } = armarServicio({
      tarifas: [{ id: "t1", monto: 100, activa: true }],
      montos: [],
    });
    await servicio2.aplicarAjustePorcentual("c1", -150);
    expect(actualizarTarifa2).toHaveBeenCalledWith("t1", { monto: 0 });
  });

  it("redondea a 2 decimales", async () => {
    const { servicio, actualizarTarifa } = armarServicio({
      tarifas: [{ id: "t1", monto: 99.99, activa: true }],
      montos: [],
    });

    await servicio.aplicarAjustePorcentual("c1", 7);

    expect(actualizarTarifa).toHaveBeenCalledWith("t1", { monto: 106.99 });
  });
});
