/*
  N.º de Pedido interno (secuencial, legible) para mostrar en las etiquetas
  de bulto — documento funcional v6 §8.2. Se backfillea en orden cronológico
  (creadoEn) para los pedidos ya existentes, después queda como secuencia
  automática para los nuevos. También agrega `etiquetaImpresaEn` para el
  "estado de impresión de la etiqueta" de la pantalla de Embalaje y Despacho
  (§8.1).
*/

-- AlterTable: agregar numero (nullable primero, para poder backfillear)
ALTER TABLE "pedidos" ADD COLUMN "numero" INTEGER;

-- Backfill en orden cronológico
WITH numerados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "creadoEn") AS rn
  FROM "pedidos"
)
UPDATE "pedidos" p SET "numero" = n.rn
FROM numerados n
WHERE n."id" = p."id";

-- Secuencia para los pedidos nuevos, arrancando después del máximo ya usado
CREATE SEQUENCE "pedidos_numero_seq";
SELECT setval('pedidos_numero_seq', COALESCE((SELECT MAX("numero") FROM "pedidos"), 0));
ALTER TABLE "pedidos" ALTER COLUMN "numero" SET DEFAULT nextval('pedidos_numero_seq');
ALTER SEQUENCE "pedidos_numero_seq" OWNED BY "pedidos"."numero";

ALTER TABLE "pedidos" ALTER COLUMN "numero" SET NOT NULL;
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- AlterTable: estado de impresión de etiqueta
ALTER TABLE "pedidos" ADD COLUMN "etiquetaImpresaEn" TIMESTAMP(3);
