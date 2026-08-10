-- AlterTable
ALTER TABLE "importaciones_excel" ALTER COLUMN "urlArchivo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "perfiles_importacion" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "mapeoColumnas" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,

    CONSTRAINT "perfiles_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_importacion_clienteId_key" ON "perfiles_importacion"("clienteId");

-- AddForeignKey
ALTER TABLE "perfiles_importacion" ADD CONSTRAINT "perfiles_importacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
