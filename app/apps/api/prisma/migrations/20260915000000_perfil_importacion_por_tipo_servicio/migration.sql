-- Un cliente TipoServicioCliente.AMBOS necesita un perfil de mapeo de
-- columnas distinto por cada Excel que sube (pañales y medicamentos tienen
-- formatos totalmente distintos) — antes solo se permitía uno por cliente.

-- DropIndex
DROP INDEX "perfiles_importacion_clienteId_key";

-- AlterTable
ALTER TABLE "perfiles_importacion" ADD COLUMN "tipoServicio" "TipoServicio" NOT NULL DEFAULT 'PANAL';

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_importacion_clienteId_tipoServicio_key" ON "perfiles_importacion"("clienteId", "tipoServicio");
