-- CreateEnum
CREATE TYPE "FormatoRemito" AS ENUM ('BELLA_VISTA', 'FARMAPAL');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "formatoRemito" "FormatoRemito";
