-- CreateEnum
CREATE TYPE "TipoGastoChofer" AS ENUM ('COMBUSTIBLE', 'PEAJE');

-- CreateTable
CREATE TABLE "gastos_chofer" (
    "id" TEXT NOT NULL,
    "tipo" "TipoGastoChofer" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "choferId" TEXT,
    "choferNombre" TEXT,
    "choferNombreOriginal" TEXT NOT NULL,
    "proveedor" TEXT,
    "comprobante" TEXT,
    "archivoOrigen" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "gastos_chofer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gastos_chofer_tipo_fecha_idx" ON "gastos_chofer"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "gastos_chofer_choferId_idx" ON "gastos_chofer"("choferId");
