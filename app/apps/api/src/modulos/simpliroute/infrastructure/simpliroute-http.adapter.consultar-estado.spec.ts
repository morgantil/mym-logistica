import { ConfigService } from "@nestjs/config";
import { SimplirouteHttpAdapter } from "./simpliroute-http.adapter";

// Borrar una Route en SimpliRoute no avisa a mym — sincronizarEstados le
// pegaba a la Visit por el simplirouteId guardado. Dos casos verificados acá:
// un 404 genérico (defensivo, no confirmado contra la cuenta real) y el caso
// REAL confirmado 2026-10-26 contra la cuenta real (3 Visits verificadas):
// la Visit sigue viva, 200, "pending", con `route: null` — nunca 404.
function armarConfig() {
  const valores: Record<string, unknown> = {
    "simpliroute.apiUrl": "https://api.simpliroute.test",
    "simpliroute.apiKey": "token-de-prueba",
  };
  return { get: (clave: string) => valores[clave] } as ConfigService;
}

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as typeof fetch;
}

describe("SimplirouteHttpAdapter.consultarEstado — Visit borrada en SimpliRoute", () => {
  it("devuelve null cuando SimpliRoute responde 404 (la Visit ya no existe)", async () => {
    mockFetch(404, { detail: "Not found." });
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    const resultado = await adapter.consultarEstado("999");

    expect(resultado).toBeNull();
  });

  it("sigue propagando cualquier otro error (no lo confunde con Visit borrada)", async () => {
    mockFetch(500, { detail: "Internal error" });
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    await expect(adapter.consultarEstado("999")).rejects.toThrow();
  });

  it("si la Visit existe y tiene ruta asignada, tieneRuta: true", async () => {
    mockFetch(200, { status: "entered", checkout_time: null, driver: 7, route: "da28fc2e-24ea-4d0e-8f20-b76e7517ee21" });
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    const resultado = await adapter.consultarEstado("999");

    expect(resultado).toEqual({ estado: "entered", fechaEntrega: null, choferIdExterno: 7, tieneRuta: true });
  });

  it('caso real confirmado: Route borrada → la Visit sigue viva (200, "pending") pero con route: null → tieneRuta: false', async () => {
    mockFetch(200, { status: "pending", checkout_time: null, driver: undefined, route: null });
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    const resultado = await adapter.consultarEstado("999");

    expect(resultado).toEqual({ estado: "pending", fechaEntrega: null, choferIdExterno: null, tieneRuta: false });
  });
});
