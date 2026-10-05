-- CreateEnum
CREATE TYPE "CabaProvincia" AS ENUM ('CABA', 'PROVINCIA');

-- AlterTable: la(s) tarifa(s) existentes (monto único global, sin distinción
-- de zona) quedan como CABA por default — hay que cargar la de Provincia
-- aparte desde la pantalla (ahora pide zona).
ALTER TABLE "tarifas_transportista" ADD COLUMN "zona" "CabaProvincia";
UPDATE "tarifas_transportista" SET "zona" = 'CABA' WHERE "zona" IS NULL;
ALTER TABLE "tarifas_transportista" ALTER COLUMN "zona" SET NOT NULL;
