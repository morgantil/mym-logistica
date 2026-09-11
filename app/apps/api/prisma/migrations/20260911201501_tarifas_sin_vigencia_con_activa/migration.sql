-- Decisión 2026-09-11: se saca el historial automático por vigencia
-- (vigenciaDesde/vigenciaHasta) de TarifaCliente, PorcentajeSegundoServicio y
-- TarifaTransportista — reemplazado por una columna "activa" simple (mismo
-- criterio que ZonaTarifaria.activa). Backfill: la fila que estaba "vigente"
-- (vigenciaHasta IS NULL) queda activa=true, cualquier fila cerrada
-- históricamente queda activa=false (se conserva, no se borra nada).

-- TarifaCliente
ALTER TABLE "tarifas_cliente" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
UPDATE "tarifas_cliente" SET "activa" = ("vigenciaHasta" IS NULL);
DROP INDEX IF EXISTS "tarifas_cliente_clienteId_zonaTarifariaId_tipoServicio_tipo_idx";
ALTER TABLE "tarifas_cliente" DROP COLUMN "vigenciaDesde";
ALTER TABLE "tarifas_cliente" DROP COLUMN "vigenciaHasta";
CREATE INDEX "tarifas_cliente_clienteId_zonaTarifariaId_tipoServicio_tipo_idx" ON "tarifas_cliente"("clienteId", "zonaTarifariaId", "tipoServicio", "tipoEnvase");

-- PorcentajeSegundoServicio
ALTER TABLE "porcentajes_segundo_servicio" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
UPDATE "porcentajes_segundo_servicio" SET "activa" = ("vigenciaHasta" IS NULL);
ALTER TABLE "porcentajes_segundo_servicio" DROP COLUMN "vigenciaDesde";
ALTER TABLE "porcentajes_segundo_servicio" DROP COLUMN "vigenciaHasta";

-- TarifaTransportista
ALTER TABLE "tarifas_transportista" ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
UPDATE "tarifas_transportista" SET "activa" = ("vigenciaHasta" IS NULL);
ALTER TABLE "tarifas_transportista" DROP COLUMN "vigenciaDesde";
ALTER TABLE "tarifas_transportista" DROP COLUMN "vigenciaHasta";
