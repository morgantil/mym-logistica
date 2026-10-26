import { ConfigService } from "@nestjs/config";
import { SimplirouteHttpAdapter } from "./simpliroute-http.adapter";

// Caso real 2026-10-26 (Leonardo probando en el cliente): borrar una ruta en
// SimpliRoute no avisa a mym — sincronizarEstados le pegaba por el
// simplirouteId guardado y recibía un 404, que se trataba como error genérico
// y dejaba el pedido "coordinado" para siempre. Acá se confirma que
// consultarEstado distingue ese caso (null) de un error real (lo propaga).
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

  it("si la Visit existe, devuelve el estado mapeado normalmente", async () => {
    mockFetch(200, { status: "entered", checkout_time: null, driver: 7 });
    const adapter = new SimplirouteHttpAdapter(armarConfig());

    const resultado = await adapter.consultarEstado("999");

    expect(resultado).toEqual({ estado: "entered", fechaEntrega: null, choferIdExterno: 7 });
  });
});
