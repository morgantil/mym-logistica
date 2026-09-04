-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "choferPreEnvioId" TEXT,
ADD COLUMN     "choferPreEnvioNombre" TEXT,
ADD COLUMN     "geocodeAlert" TEXT,
ADD COLUMN     "latitudEntrega" DOUBLE PRECISION,
ADD COLUMN     "longitudEntrega" DOUBLE PRECISION,
ADD COLUMN     "zonaPreEnvioId" TEXT,
ADD COLUMN     "zonaPreEnvioNombre" TEXT;

