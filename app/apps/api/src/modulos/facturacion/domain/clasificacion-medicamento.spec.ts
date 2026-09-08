import { TipoEnvase } from "@mym/shared-types";
import { determinarClasificacionMedicamento } from "./clasificacion-medicamento";

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx, tabla del paso 2.
describe("determinarClasificacionMedicamento", () => {
  it("Solo Bolsa → Bolsa", () => {
    expect(determinarClasificacionMedicamento([TipoEnvase.BOLSA, TipoEnvase.BOLSA])).toBe(TipoEnvase.BOLSA);
  });

  it("Solo Bulto → Bulto", () => {
    expect(determinarClasificacionMedicamento([TipoEnvase.BULTO])).toBe(TipoEnvase.BULTO);
  });

  it("Bolsa + Bulto → Bulto", () => {
    expect(determinarClasificacionMedicamento([TipoEnvase.BOLSA, TipoEnvase.BULTO])).toBe(TipoEnvase.BULTO);
  });

  it("sin líneas clasificadas → null", () => {
    expect(determinarClasificacionMedicamento([null, null])).toBeNull();
  });

  it("lista vacía → null", () => {
    expect(determinarClasificacionMedicamento([])).toBeNull();
  });
});
