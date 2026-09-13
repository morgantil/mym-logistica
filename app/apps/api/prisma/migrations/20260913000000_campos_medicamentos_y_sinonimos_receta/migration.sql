-- AlterTable: campos específicos de medicamentos en Pedido (null para pañales)
ALTER TABLE "pedidos" ADD COLUMN     "receta" TEXT,
ADD COLUMN     "recetaResuelta" TEXT,
ADD COLUMN     "tipoPedido" TEXT,
ADD COLUMN     "retiroDeReceta" BOOLEAN,
ADD COLUMN     "tiempoDeEntrega" TEXT,
ADD COLUMN     "horarioEntrega" TEXT;

-- CreateTable
CREATE TABLE "sinonimos_receta" (
    "id" TEXT NOT NULL,
    "valorOrigen" TEXT NOT NULL,
    "valorCanonico" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "sinonimos_receta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sinonimos_receta_valorOrigen_key" ON "sinonimos_receta"("valorOrigen");
