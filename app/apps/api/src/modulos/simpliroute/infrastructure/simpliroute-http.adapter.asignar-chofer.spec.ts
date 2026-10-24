import { ConfigService } from "@nestjs/config";
import { SimplirouteHttpAdapter } from "./simpliroute-http.adapter";

// Bug real 2026-10-07 (reunión): PATCH directo de driver/vehicle sobre la
// Visit devuelve 200 pero los ignora en silencio — confirmado contra la
// cuenta real. El mecanismo real es Plan → Route → PATCH visit.route. Estos
// tests mockean fetch para verificar la secuencia exacta de llamadas, sin
// pegarle a la red.
function armarConfig() {
  const valores: Record<string, unknown> = {
    "simpliroute.apiUrl": "https://api.simpliroute.test",
    "simpliroute.apiKey": "token-de-prueba",
    "simpliroute.depositoDireccion": "CABA, Argentina",
    "simpliroute.depositoLatitud": -34.6037,
    "simpliroute.depositoLongitud": -58.3816,
  };
  return { get: (clave: string) => valores[clave] } as ConfigService;
}

function mockFetchSecuencial(respuestas: { status: number; body: unknown }[]) {
  const llamadas: { url: string; metodo: string; body: unknown }[] = [];
  let indice = 0;
  global.fetch = jest.fn().mockImplementation((url: string, init: RequestInit) => {
    llamadas.push({ url, metodo: init.method as string, body: init.body ? JSON.parse(init.body as string) : undefined });
    const respuesta = respuestas[indice++];
    return Promise.resolve({
      ok: respuesta.status < 300,
      status: respuesta.status,
      text: () => Promise.resolve(JSON.stringify(respuesta.body)),
    });
  }) as unknown as typeof fetch;
  return llamadas;
}

describe("SimplirouteHttpAdapter.asignarChoferVehiculo", () => {
  it("si el chofer ya tiene una Route ese día, la reusa (no crea Plan/Route de nuevo)", async () => {
    const llamadas = mockFetchSecuencial([
      { status: 200, body: [{ id: 678190, routes: [{ id: "ruta-existente", plan_id: "plan-1" }] }] },
      { status: 200, body: {} }, // PATCH visit.route
    ]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    await adapter.asignarChoferVehiculo("938760987", 514751, 678190, new Date("2026-10-09T00:00:00.000Z"));

    expect(llamadas).toHaveLength(2);
    expect(llamadas[0].metodo).toBe("GET");
    expect(llamadas[0].url).toContain("/v1/plans/2026-10-09/vehicles/");
    expect(llamadas[1].metodo).toBe("PATCH");
    expect(llamadas[1].url).toContain("/v1/routes/visits/938760987/");
    expect(llamadas[1].body).toEqual({ route: "ruta-existente" });
  });

  it("si no hay Route ese día, crea Plan y Route antes de vincular la Visit", async () => {
    const llamadas = mockFetchSecuencial([
      { status: 200, body: [] }, // GET vehicles-by-date: sin rutas todavía
      { status: 200, body: { id: "plan-nuevo" } }, // POST create-plan
      { status: 201, body: { id: "ruta-nueva" } }, // POST routes
      { status: 200, body: {} }, // PATCH visit.route
    ]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    await adapter.asignarChoferVehiculo("938760987", 514751, 678190, new Date("2026-10-09T00:00:00.000Z"));

    expect(llamadas).toHaveLength(4);
    expect(llamadas[1].url).toContain("/v1/plans/create-plan/");
    expect(llamadas[1].body).toMatchObject({ start_date: "2026-10-09", end_date: "2026-10-09" });
    expect(llamadas[2].url).toContain("/v1/routes/routes/");
    expect(llamadas[2].body).toMatchObject({
      vehicle: 678190,
      driver: 514751,
      planned_date: "2026-10-09",
      plan: "plan-nuevo",
      location_start_address: "CABA, Argentina",
    });
    expect(llamadas[3].body).toEqual({ route: "ruta-nueva" });
  });

  it("si OTRO vehículo ya tiene Plan ese día, reusa ese Plan en vez de crear uno nuevo", async () => {
    const llamadas = mockFetchSecuencial([
      // El vehículo pedido (678190) no tiene Route todavía, pero otro
      // vehículo (111) ya tiene una Route ese día, con su propio Plan.
      {
        status: 200,
        body: [
          { id: 111, routes: [{ id: "ruta-otro-chofer", plan_id: "plan-del-dia" }] },
          { id: 678190, routes: [] },
        ],
      },
      { status: 201, body: { id: "ruta-nueva" } }, // POST routes — sin POST create-plan antes
      { status: 200, body: {} }, // PATCH visit.route
    ]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    await adapter.asignarChoferVehiculo("938760987", 514751, 678190, new Date("2026-10-09T00:00:00.000Z"));

    expect(llamadas).toHaveLength(3);
    expect(llamadas[1].url).toContain("/v1/routes/routes/");
    expect(llamadas[1].body).toMatchObject({
      vehicle: 678190,
      driver: 514751,
      planned_date: "2026-10-09",
      plan: "plan-del-dia",
    });
    expect(llamadas[2].body).toEqual({ route: "ruta-nueva" });
  });
});
