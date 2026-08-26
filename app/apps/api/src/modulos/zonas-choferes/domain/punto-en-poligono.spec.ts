import { encontrarZona, puntoEnPoligono } from "./punto-en-poligono";

// Cuadrado simple: lat 0..10, lng 0..10 — fácil de razonar a mano.
const cuadrado = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 10 },
  { lat: 10, lng: 10 },
  { lat: 10, lng: 0 },
];

describe("puntoEnPoligono", () => {
  it("un punto claramente adentro del polígono da true", () => {
    expect(puntoEnPoligono({ lat: 5, lng: 5 }, cuadrado)).toBe(true);
  });

  it("un punto claramente afuera del polígono da false", () => {
    expect(puntoEnPoligono({ lat: 20, lng: 20 }, cuadrado)).toBe(false);
  });

  it("un punto afuera pero cerca de un lado da false", () => {
    expect(puntoEnPoligono({ lat: 5, lng: 10.5 }, cuadrado)).toBe(false);
  });

  it("un polígono vacío nunca contiene nada", () => {
    expect(puntoEnPoligono({ lat: 5, lng: 5 }, [])).toBe(false);
  });

  it("funciona con un polígono no convexo (forma de L)", () => {
    // L = rectángulo ancho abajo (lng 0-10, lat 0-5) + franja angosta arriba
    // (lng 0-5, lat 5-10). El "hueco" de la L es lng 5-10, lat 5-10.
    const formaL = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 5, lng: 10 },
      { lat: 5, lng: 5 },
      { lat: 10, lng: 5 },
      { lat: 10, lng: 0 },
    ];
    // Adentro del rectángulo ancho de abajo
    expect(puntoEnPoligono({ lat: 2, lng: 7 }, formaL)).toBe(true);
    // Adentro de la franja angosta de arriba
    expect(puntoEnPoligono({ lat: 7, lng: 2 }, formaL)).toBe(true);
    // En el hueco de la L (afuera de la forma, aunque esté "dentro" del bounding box)
    expect(puntoEnPoligono({ lat: 7, lng: 7 }, formaL)).toBe(false);
  });
});

describe("encontrarZona", () => {
  const zonaA = { id: "A", poligono: cuadrado };
  const zonaB = {
    id: "B",
    poligono: [
      { lat: 20, lng: 20 },
      { lat: 20, lng: 30 },
      { lat: 30, lng: 30 },
      { lat: 30, lng: 20 },
    ],
  };

  it("devuelve la zona cuyo polígono contiene el punto", () => {
    expect(encontrarZona({ lat: 25, lng: 25 }, [zonaA, zonaB])).toBe(zonaB);
  });

  it("devuelve null si ninguna zona contiene el punto", () => {
    expect(encontrarZona({ lat: 100, lng: 100 }, [zonaA, zonaB])).toBeNull();
  });

  it("devuelve null con lista de zonas vacía", () => {
    expect(encontrarZona({ lat: 5, lng: 5 }, [])).toBeNull();
  });
});
