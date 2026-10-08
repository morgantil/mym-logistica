-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "ruta" SET DEFAULT 'Ruta 1';

-- Backfill: los pedidos que ya existían sin ruta guardada (bug real
-- 2026-10-08, ver comentario en schema.prisma) pasan a "Ruta 1" también —
-- el default de la columna solo aplica a filas nuevas, no a las que ya
-- estaban en null.
UPDATE "pedidos" SET "ruta" = 'Ruta 1' WHERE "ruta" IS NULL;

-- Nota: `prisma migrate dev --create-only` también propuso un RENAME INDEX
-- sobre "montos_unificado_medicamento_..." — drift preexistente y no
-- relacionado con este cambio (mismo caso que las migraciones
-- 20261008001028 y 20261004070000). Se saca de acá a propósito.
