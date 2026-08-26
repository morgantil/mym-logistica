/*
  Revierte el diseño de Zona/Chofer/ZonaChofer configurados a mano (ver
  DOCUMENTO TECNICO.md historial 2026-08-17 y su reversión 2026-08-25/26).
  SimpliRoute pasa a ser la fuente de verdad: estas tres tablas se
  reemplazan por un cache de solo lectura sincronizado desde su API
  (zonas_simpliroute_cache / choferes_simpliroute_cache /
  vehiculos_simpliroute_cache).

  Verificado antes de escribir esta migración (2026-08-26): las tres tablas
  viejas nunca tuvieron datos reales en producción —
    SELECT count("zonaId"), count("choferId") FROM pedidos;  -> 0, 0 (de 207)
    SELECT count(*) FROM zonas;     -> 3 (datos de prueba: "CABA Norte", "Zona Norte GBA", "San Martin")
    SELECT count(*) FROM choferes;  -> 2 (datos de prueba: "Carlos Gómez", "Miguel Torres")
  Ningún pedido real las referenciaba, así que no hace falta backfillear
  ningún snapshot histórico — se dropean directo, sin pérdida de datos de
  negocio.
*/

-- Pedido: sacar las FK viejas (zonaId/choferId pasan a ser el ID numérico de
-- SimpliRoute como texto, sin relación declarada — el cache se puede
-- refrescar/reemplazar libremente) y agregar el snapshot de nombre que se
-- guarda al momento de resolver la zona/chofer de un pedido.
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_zonaId_fkey";
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_choferId_fkey";
ALTER TABLE "pedidos" ADD COLUMN "zonaNombre" TEXT;
ALTER TABLE "pedidos" ADD COLUMN "choferNombre" TEXT;

-- Tablas manuales viejas — sin datos reales, ver verificación arriba.
DROP TABLE "zonas_choferes";
DROP TABLE "choferes";
DROP TABLE "zonas";

-- Cache de solo lectura sincronizado desde SimpliRoute (ZonasChoferesService).
CREATE TABLE "zonas_simpliroute_cache" (
    "id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "habilitada" BOOLEAN NOT NULL,
    "dias" TEXT[],
    "poligono" JSONB NOT NULL,
    "vehiculosIds" INTEGER[],
    "sincronizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zonas_simpliroute_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "choferes_simpliroute_cache" (
    "id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL,
    "sincronizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "choferes_simpliroute_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehiculos_simpliroute_cache" (
    "id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "patente" TEXT,
    "choferPredeterminadoId" INTEGER,
    "estado" TEXT NOT NULL,
    "sincronizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_simpliroute_cache_pkey" PRIMARY KEY ("id")
);
