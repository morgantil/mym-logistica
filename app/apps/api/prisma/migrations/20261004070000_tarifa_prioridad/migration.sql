-- AlterTable: TarifaCliente suma prioridad (default NORMAL, mismo criterio
-- que las filas ya cargadas: eran "para Normal" sin saberlo, porque antes
-- la prioridad no afectaba la tarifa).
ALTER TABLE "tarifas_cliente" ADD COLUMN "prioridad" "PrioridadPedido" NOT NULL DEFAULT 'NORMAL';

-- AlterTable: MontoUnificadoMedicamento suma prioridad, reemplazando el
-- índice único que no la incluía.
ALTER TABLE "montos_unificado_medicamento" ADD COLUMN "prioridad" "PrioridadPedido" NOT NULL DEFAULT 'NORMAL';

DROP INDEX "montos_unificado_medicamento_clienteId_zonaTarifariaId_ti_key";

CREATE UNIQUE INDEX "montos_unificado_medicamento_clienteId_zonaTarifariaId_ti_key" ON "montos_unificado_medicamento"("clienteId", "zonaTarifariaId", "tipoEnvase", "prioridad");
