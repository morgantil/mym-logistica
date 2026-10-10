-- CreateEnum
CREATE TYPE "TipoReporte" AS ENUM ('TRANSPORTISTAS', 'COMBUSTIBLE', 'PEDIDOS');

-- CreateTable
CREATE TABLE "limites_reporte" (
    "id" TEXT NOT NULL,
    "reporte" "TipoReporte" NOT NULL,
    "maxDias" INTEGER NOT NULL DEFAULT 32,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "actualizadoPorId" TEXT,

    CONSTRAINT "limites_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "limites_reporte_reporte_key" ON "limites_reporte"("reporte");

-- Siembra inicial: Transportistas y Combustible mantienen su tope actual
-- (31 y 30 días, elegidos a propósito distintos en su momento — ver
-- TEMAS_PENDIENTES.md §4.3/§14.3); Pedidos arranca en 32 (el default pedido
-- en reunión 2026-10-10, antes no tenía tope). Administración puede
-- cambiar cualquiera de los tres después, entre 1 y 100.
INSERT INTO "limites_reporte" ("id", "reporte", "maxDias", "actualizadoEn") VALUES
  ('a1a1a1a1-0000-4000-8000-000000000001', 'TRANSPORTISTAS', 31, CURRENT_TIMESTAMP),
  ('a1a1a1a1-0000-4000-8000-000000000002', 'COMBUSTIBLE', 30, CURRENT_TIMESTAMP),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'PEDIDOS', 32, CURRENT_TIMESTAMP);
