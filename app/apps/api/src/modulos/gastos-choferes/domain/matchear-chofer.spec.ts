import { matchearChofer } from "./matchear-chofer";

const CHOFERES = [
  { id: "1", nombre: "Marcos" },
  { id: "2", nombre: "Lucía" },
  { id: "3", nombre: "Gonzalo" },
];

const VEHICULOS = [{ patente: "AB123CD", choferPredeterminadoId: "2" }];

describe("matchearChofer", () => {
  it("matchea por nombre exacto", () => {
    expect(matchearChofer("Marcos", CHOFERES, VEHICULOS)).toEqual({ choferId: "1", choferNombre: "Marcos" });
  });

  it("matchea ignorando espacios de más y mayúsculas (dato real sucio del Excel)", () => {
    expect(matchearChofer("MARCOS ", CHOFERES, VEHICULOS)).toEqual({ choferId: "1", choferNombre: "Marcos" });
    expect(matchearChofer("  lucía", CHOFERES, VEHICULOS)).toEqual({ choferId: "2", choferNombre: "Lucía" });
  });

  it("matchea por patente del vehículo, resolviendo a su chofer predeterminado", () => {
    expect(matchearChofer("AB123CD", CHOFERES, VEHICULOS)).toEqual({ choferId: "2", choferNombre: "Lucía" });
  });

  it("matchea patente con espacios/minúsculas (formato real de patente en Excel)", () => {
    expect(matchearChofer("ab 123 cd", CHOFERES, VEHICULOS)).toEqual({ choferId: "2", choferNombre: "Lucía" });
  });

  it("no inventa un chofer para un par combinado tipo 'LUCIA-MATIAS' (caso real)", () => {
    expect(matchearChofer("LUCIA-MATIAS", CHOFERES, VEHICULOS)).toBeNull();
  });

  it("texto vacío no matchea nada", () => {
    expect(matchearChofer("   ", CHOFERES, VEHICULOS)).toBeNull();
  });

  it("patente con formato válido pero sin vehículo cargado no matchea (no inventa)", () => {
    expect(matchearChofer("ZZ999ZZ", CHOFERES, VEHICULOS)).toBeNull();
  });
});
