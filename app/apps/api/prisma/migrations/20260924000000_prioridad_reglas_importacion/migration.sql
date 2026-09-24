-- Decisión 2026-09-24 (Leonardo + cliente): prioridad Normal/Urgente/Crítica
-- en todos los pedidos, reglas de importación editables por el usuario
-- (R-0011 → RR, URGENCIA → Urgente, quitar "OSDE" del afiliado), hoja a
-- importar por perfil y sinónimos de receta con "empieza con"/"contiene".

CREATE TYPE "PrioridadPedido" AS ENUM ('NORMAL', 'URGENTE', 'CRITICA');
CREATE TYPE "TipoCoincidencia" AS ENUM ('IGUAL', 'EMPIEZA_CON', 'CONTIENE');

ALTER TABLE "pedidos" ADD COLUMN "prioridad" "PrioridadPedido" NOT NULL DEFAULT 'NORMAL';

-- Retiro de receta pasa de SI/NO booleano a texto libre ("NO", "RR", ...).
ALTER TABLE "pedidos" ALTER COLUMN "retiroDeReceta" TYPE TEXT
  USING CASE WHEN "retiroDeReceta" IS TRUE THEN 'SI' WHEN "retiroDeReceta" IS FALSE THEN 'NO' ELSE NULL END;

ALTER TABLE "perfiles_importacion" ADD COLUMN "nombreHoja" TEXT;

ALTER TABLE "sinonimos_receta"
  ADD COLUMN "tipoCoincidencia" "TipoCoincidencia" NOT NULL DEFAULT 'IGUAL',
  ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;
DROP INDEX "sinonimos_receta_valorOrigen_key";
CREATE UNIQUE INDEX "sinonimos_receta_valorOrigen_tipoCoincidencia_key"
  ON "sinonimos_receta"("valorOrigen", "tipoCoincidencia");

CREATE TABLE "reglas_importacion" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoServicio" "TipoServicio" NOT NULL DEFAULT 'PANAL',
    "campoOrigen" TEXT NOT NULL,
    "tipoCoincidencia" "TipoCoincidencia" NOT NULL DEFAULT 'CONTIENE',
    "valor" TEXT NOT NULL,
    "accion" TEXT NOT NULL DEFAULT 'ASIGNAR_VALOR',
    "campoDestino" TEXT NOT NULL,
    "valorDestino" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "reglas_importacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reglas_importacion_clienteId_tipoServicio_idx" ON "reglas_importacion"("clienteId", "tipoServicio");

ALTER TABLE "reglas_importacion" ADD CONSTRAINT "reglas_importacion_clienteId_fkey"
  FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
