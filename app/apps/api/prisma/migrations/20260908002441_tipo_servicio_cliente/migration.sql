-- CreateEnum
CREATE TYPE "TipoServicioCliente" AS ENUM ('PANAL', 'MEDICAMENTO', 'AMBOS');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "tipoServicio" "TipoServicioCliente" NOT NULL DEFAULT 'PANAL';

