-- CreateEnum
CREATE TYPE "TipoEnvase" AS ENUM ('BOLSA', 'BULTO');

-- DropIndex
DROP INDEX "tarifas_cliente_clienteId_zonaTarifariaId_vigenciaDesde_idx";

-- AlterTable
ALTER TABLE "grupos_facturacion" ADD COLUMN     "clienteSocioId" TEXT,
ADD COLUMN     "pedidoSocioId" TEXT,
ADD COLUMN     "porcentajeMedicamentoAplicado" DECIMAL(5,2),
ADD COLUMN     "porcentajePanalAplicado" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "porcentajes_segundo_servicio" DROP COLUMN "porcentaje",
ADD COLUMN     "porcentajeMedicamento" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "porcentajePanal" DECIMAL(5,2) NOT NULL;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "tipoEnvase" "TipoEnvase";

-- AlterTable
ALTER TABLE "tarifas_cliente" ADD COLUMN     "tipoEnvase" "TipoEnvase",
ADD COLUMN     "tipoServicio" "TipoServicio" NOT NULL DEFAULT 'PANAL';

-- CreateTable
CREATE TABLE "combinaciones_unificacion_clientes" (
    "id" TEXT NOT NULL,
    "clienteMedicamentoId" TEXT NOT NULL,
    "clientePanalId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "combinaciones_unificacion_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combinaciones_unificacion_clientes_clienteMedicamentoId_cli_key" ON "combinaciones_unificacion_clientes"("clienteMedicamentoId", "clientePanalId");

-- CreateIndex
CREATE INDEX "tarifas_cliente_clienteId_zonaTarifariaId_tipoServicio_tipo_idx" ON "tarifas_cliente"("clienteId", "zonaTarifariaId", "tipoServicio", "tipoEnvase", "vigenciaDesde");

-- AddForeignKey
ALTER TABLE "combinaciones_unificacion_clientes" ADD CONSTRAINT "combinaciones_unificacion_clientes_clienteMedicamentoId_fkey" FOREIGN KEY ("clienteMedicamentoId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combinaciones_unificacion_clientes" ADD CONSTRAINT "combinaciones_unificacion_clientes_clientePanalId_fkey" FOREIGN KEY ("clientePanalId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

