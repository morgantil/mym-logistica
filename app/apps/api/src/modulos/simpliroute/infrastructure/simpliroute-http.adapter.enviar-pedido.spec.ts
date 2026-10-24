import { ConfigService } from "@nestjs/config";
import { PedidoParaEnviar } from "../domain/logistica-provider.port";
import { SimplirouteHttpAdapter } from "./simpliroute-http.adapter";

// Reunión 2026-10-23: campos nuevos en el envío a SimpliRoute (visit_type,
// notes con el N.º de pedido, reference condicional al remito, seller
// resuelto por nombre). Mismo patrón de mock de fetch que
// simpliroute-http.adapter.asignar-chofer.spec.ts.
function armarConfig() {
  const valores: Record<string, unknown> = {
    "simpliroute.apiUrl": "https://api.simpliroute.test",
    "simpliroute.apiKey": "token-de-prueba",
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

function pedidoBase(overrides: Partial<PedidoParaEnviar> = {}): PedidoParaEnviar {
  return {
    pedidoId: "p1",
    destinatarioIdExterno: "dest-1",
    destinatarioNombre: "Juan Pérez",
    destinatarioTelefono: null,
    direccion: "Calle 1, CABA",
    fechaProgramada: new Date("2026-10-25T00:00:00.000Z"),
    bultos: 1,
    observaciones: null,
    cargaPanal: true,
    cargaEspecial: false,
    numero: 42,
    tipoVisita: null,
    notaCliente: null,
    seller: null,
    referencia: null,
    ...overrides,
  };
}

describe("SimplirouteHttpAdapter.enviarPedido — campos nuevos (reunión 2026-10-23)", () => {
  it("manda notes con el N.º de pedido, aunque no haya nota de cliente ni observaciones", async () => {
    const llamadas = mockFetchSecuencial([{ status: 201, body: { id: 1 } }]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());
    await adapter.enviarPedido(pedidoBase());
    expect((llamadas[0].body as { notes: string }[])[0].notes).toBe("#42");
  });

  it("arma notes combinando N.º de pedido + nota del cliente + observaciones, en ese orden", async () => {
    const llamadas = mockFetchSecuencial([{ status: 201, body: { id: 1 } }]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());
    await adapter.enviarPedido(
      pedidoBase({ notaCliente: "Entrar por el fondo", observaciones: "Avisar antes de llegar" }),
    );
    expect((llamadas[0].body as { notes: string }[])[0].notes).toBe(
      "#42 · Entrar por el fondo · Avisar antes de llegar",
    );
  });

  it("manda visit_type solo cuando el cliente lo tiene configurado", async () => {
    const llamadas = mockFetchSecuencial([{ status: 201, body: { id: 1 } }]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());
    await adapter.enviarPedido(pedidoBase({ tipoVisita: "farmaet" }));
    expect((llamadas[0].body as { visit_type: string }[])[0].visit_type).toBe("farmaet");
  });

  it("reference usa el remito real cuando viene en `referencia`, si no cae al id propio del pedido", async () => {
    const llamadas1 = mockFetchSecuencial([{ status: 201, body: { id: 1 } }]);
    const adapter1 = new SimplirouteHttpAdapter(armarConfig());
    await adapter1.enviarPedido(pedidoBase({ referencia: "R-0001" }));
    expect((llamadas1[0].body as { reference: string }[])[0].reference).toBe("R-0001");

    const llamadas2 = mockFetchSecuencial([{ status: 201, body: { id: 1 } }]);
    const adapter2 = new SimplirouteHttpAdapter(armarConfig());
    await adapter2.enviarPedido(pedidoBase({ referencia: null }));
    expect((llamadas2[0].body as { reference: string }[])[0].reference).toBe("p1");
  });

  it("resuelve seller por nombre contra /v1/sellers/ y lo manda como UUID", async () => {
    const llamadas = mockFetchSecuencial([
      { status: 200, body: [{ id: "uuid-seller-1", name: "Farmaet", alias: "farmaet" }] },
      { status: 201, body: { id: 1 } },
    ]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());
    await adapter.enviarPedido(pedidoBase({ seller: "farmaet" }));

    expect(llamadas[0].url).toContain("/v1/sellers/");
    expect((llamadas[1].body as { seller: string }[])[0].seller).toBe("uuid-seller-1");
  });

  it("si no encuentra el seller, o la cuenta no tiene Sellers habilitado, igual envía el pedido sin ese campo", async () => {
    const llamadas = mockFetchSecuencial([
      { status: 403, body: { detail: "Sellers not enabled for this account" } },
      { status: 201, body: { id: 1 } },
    ]);
    const adapter = new SimplirouteHttpAdapter(armarConfig());
    const resultado = await adapter.enviarPedido(pedidoBase({ seller: "farmaet" }));

    expect(resultado.idExterno).toBe("1");
    expect((llamadas[1].body as Record<string, unknown>[])[0]).not.toHaveProperty("seller");
  });
});
