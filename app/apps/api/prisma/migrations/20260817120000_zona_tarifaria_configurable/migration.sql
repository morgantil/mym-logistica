/*
  Reemplaza el enum fijo "CabaProvincia" como unidad de facturación por un
  modelo configurable (ZonaTarifaria + LocalidadZonaTarifaria) — documento
  funcional v6 §10: "la relación Localidad → Cordón deberá ser configurable
  y no quedar fija en código". Ver DOCUMENTO TECNICO.md historial 2026-08-17.

  Se semillan dos zonas ("CABA" y "Provincia") que reemplazan 1:1 la
  clasificación anterior, para que los datos reales ya existentes (pedidos y
  tarifas ya cargadas) no pierdan su clasificación. Cordón 1/2/3 se agregan
  después como filas nuevas de ZonaTarifaria, sin otra migración.
*/

-- CreateTable
CREATE TABLE "zonas_tarifarias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "zonas_tarifarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localidades_zonas_tarifarias" (
    "id" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "zonaTarifariaId" TEXT NOT NULL,

    CONSTRAINT "localidades_zonas_tarifarias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_tarifarias_nombre_key" ON "zonas_tarifarias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "localidades_zonas_tarifarias_localidad_key" ON "localidades_zonas_tarifarias"("localidad");

-- AddForeignKey
ALTER TABLE "localidades_zonas_tarifarias" ADD CONSTRAINT "localidades_zonas_tarifarias_zonaTarifariaId_fkey" FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: zonas equivalentes a la clasificación anterior
INSERT INTO "zonas_tarifarias" ("id", "nombre", "activa") VALUES (gen_random_uuid()::text, 'CABA', true);
INSERT INTO "zonas_tarifarias" ("id", "nombre", "activa") VALUES (gen_random_uuid()::text, 'Provincia', true);

-- AlterTable tarifas_cliente: agrega zonaTarifariaId, backfillea desde "tipo", borra "tipo"
ALTER TABLE "tarifas_cliente" ADD COLUMN "zonaTarifariaId" TEXT;

UPDATE "tarifas_cliente" t
SET "zonaTarifariaId" = z."id"
FROM "zonas_tarifarias" z
WHERE z."nombre" = (CASE WHEN t."tipo" = 'CABA' THEN 'CABA' ELSE 'Provincia' END);

ALTER TABLE "tarifas_cliente" ALTER COLUMN "zonaTarifariaId" SET NOT NULL;

DROP INDEX IF EXISTS "tarifas_cliente_clienteId_tipo_vigenciaDesde_idx";

ALTER TABLE "tarifas_cliente" DROP COLUMN "tipo";

CREATE INDEX "tarifas_cliente_clienteId_zonaTarifariaId_vigenciaDesde_idx" ON "tarifas_cliente"("clienteId", "zonaTarifariaId", "vigenciaDesde");

ALTER TABLE "tarifas_cliente" ADD CONSTRAINT "tarifas_cliente_zonaTarifariaId_fkey" FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable pedidos: agrega zonaTarifariaId (nullable, igual que cabaProvincia), backfillea, borra cabaProvincia
ALTER TABLE "pedidos" ADD COLUMN "zonaTarifariaId" TEXT;

UPDATE "pedidos" p
SET "zonaTarifariaId" = z."id"
FROM "zonas_tarifarias" z
WHERE p."cabaProvincia" IS NOT NULL
  AND z."nombre" = (CASE WHEN p."cabaProvincia" = 'CABA' THEN 'CABA' ELSE 'Provincia' END);

ALTER TABLE "pedidos" DROP COLUMN "cabaProvincia";

ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaTarifariaId_fkey" FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropEnum: ya no queda ninguna columna de la tabla usándolo (GeorefArAdapter
-- sigue clasificando CABA/Provincia, pero como tipo de TypeScript en
-- @mym/shared-types, ya no como enum de Postgres/Prisma).
DROP TYPE "CabaProvincia";
