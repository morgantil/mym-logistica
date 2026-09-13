-- AlterTable: el lado medicamento de un unificado deja de ser un % (ver
-- MontoUnificadoMedicamento más abajo). Sin datos reales que migrar — solo
-- había filas de prueba, ya borradas lógicamente.
ALTER TABLE "porcentajes_segundo_servicio" DROP COLUMN "porcentajeMedicamento";

-- AlterTable: snapshot histórico del monto fijo aplicado, para las filas de
-- GrupoFacturacion nuevas (porcentajeMedicamentoAplicado queda en la tabla,
-- sin usarse, por si hay filas históricas confirmadas).
ALTER TABLE "grupos_facturacion" ADD COLUMN     "montoFijoMedicamentoAplicado" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "montos_unificado_medicamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "zonaTarifariaId" TEXT NOT NULL,
    "tipoEnvase" "TipoEnvase",
    "monto" DECIMAL(10,2) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "montos_unificado_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "montos_unificado_medicamento_clienteId_zonaTarifariaId_ti_key" ON "montos_unificado_medicamento"("clienteId", "zonaTarifariaId", "tipoEnvase");

-- AddForeignKey
ALTER TABLE "montos_unificado_medicamento" ADD CONSTRAINT "montos_unificado_medicamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "montos_unificado_medicamento" ADD CONSTRAINT "montos_unificado_medicamento_zonaTarifariaId_fkey" FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
