-- CreateEnum
CREATE TYPE "EstadoGastoChofer" AS ENUM ('PENDIENTE', 'PAGADO');

-- AlterTable
ALTER TABLE "gastos_chofer" ADD COLUMN     "estado" "EstadoGastoChofer" NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE INDEX "gastos_chofer_estado_idx" ON "gastos_chofer"("estado");
