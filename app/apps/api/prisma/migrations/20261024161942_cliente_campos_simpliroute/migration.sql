-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "notaSimpliRoute" TEXT,
ADD COLUMN     "remitoHabilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sellerSimpliRoute" TEXT,
ADD COLUMN     "tipoVisitaSimpliRoute" TEXT;
