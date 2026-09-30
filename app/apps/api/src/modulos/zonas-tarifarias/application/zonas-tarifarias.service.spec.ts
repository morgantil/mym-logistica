import { CabaProvincia } from "@mym/shared-types";
import { ZonasTarifariasService } from "./zonas-tarifarias.service";

// Fake mínimo de PrismaService — este módulo no tiene domain/infra propio
// (es CRUD directo sobre Prisma, ver comentario del servicio), así que se
// mockea acá nomás en vez de armar un repositorio de mentira.
function armarServicio(datos: {
  partidos?: Record<string, string>; // partido -> zonaTarifariaId
  localidades?: Record<string, string>; // localidad normalizada -> zonaTarifariaId
  zonas?: Record<string, string>; // nombre -> id ("CABA", "Provincia")
}) {
  const prisma = {
    zonaTarifaria: {
      findUnique: jest.fn(({ where: { nombre } }: { where: { nombre: string } }) => {
        const id = datos.zonas?.[nombre];
        return Promise.resolve(id ? { id, nombre } : null);
      }),
    },
    partidoZonaTarifaria: {
      findUnique: jest.fn(({ where: { partido } }: { where: { partido: string } }) => {
        const zonaTarifariaId = datos.partidos?.[partido];
        return Promise.resolve(zonaTarifariaId ? { partido, zonaTarifariaId } : null);
      }),
    },
    localidadZonaTarifaria: {
      findUnique: jest.fn(({ where: { localidad } }: { where: { localidad: string } }) => {
        const zonaTarifariaId = datos.localidades?.[localidad];
        return Promise.resolve(zonaTarifariaId ? { localidad, zonaTarifariaId } : null);
      }),
    },
  };
  return new ZonasTarifariasService(prisma as never);
}

describe("ZonasTarifariasService.resolverParaPedido", () => {
  it("CABA siempre resuelve a la zona CABA, factura o no por Cordón", async () => {
    const servicio = armarServicio({ zonas: { CABA: "zona-caba" } });

    expect(await servicio.resolverParaPedido(CabaProvincia.CABA, "Once", null, false)).toBe("zona-caba");
    expect(await servicio.resolverParaPedido(CabaProvincia.CABA, "Once", null, true)).toBe("zona-caba");
  });

  // Decisión 2026-09-30: Cliente.facturaPorCordon = false (Biosíntesis,
  // Bella Vista PAÑALES) — cualquier pedido de Provincia va siempre a la
  // zona plana "Provincia", sin mirar a qué partido pertenece.
  it("cliente sin facturaPorCordon: Provincia va siempre a la zona plana, ignora el partido mapeado", async () => {
    const servicio = armarServicio({
      zonas: { Provincia: "zona-provincia" },
      partidos: { Morón: "zona-primer-cordon" },
    });

    const resultado = await servicio.resolverParaPedido(CabaProvincia.PROVINCIA, "El Palomar", "Morón", false);

    expect(resultado).toBe("zona-provincia");
  });

  it("cliente con facturaPorCordon: resuelve por partido cuando está mapeado", async () => {
    const servicio = armarServicio({ partidos: { Morón: "zona-primer-cordon" } });

    const resultado = await servicio.resolverParaPedido(CabaProvincia.PROVINCIA, "El Palomar", "Morón", true);

    expect(resultado).toBe("zona-primer-cordon");
  });

  it("cliente con facturaPorCordon: sin partido mapeado, cae al mapeo por localidad", async () => {
    const servicio = armarServicio({ localidades: { "EL PALOMAR": "zona-segundo-cordon" } });

    const resultado = await servicio.resolverParaPedido(CabaProvincia.PROVINCIA, "El Palomar", "Morón", true);

    expect(resultado).toBe("zona-segundo-cordon");
  });

  it("sin clasificación (no se pudo determinar CABA/Provincia), no resuelve nada", async () => {
    const servicio = armarServicio({ zonas: { Provincia: "zona-provincia" } });

    expect(await servicio.resolverParaPedido(null, "Localidad rara", null, false)).toBeNull();
    expect(await servicio.resolverParaPedido(null, "Localidad rara", null, true)).toBeNull();
  });

  it("sin la zona Provincia cargada, no inventa nada", async () => {
    const servicio = armarServicio({});

    expect(await servicio.resolverParaPedido(CabaProvincia.PROVINCIA, "El Palomar", "Morón", false)).toBeNull();
  });
});
