-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "pantallasPermitidas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
