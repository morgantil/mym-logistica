-- Farmaet manda el Excel sin fila de encabezados: el perfil de importación
-- puede marcar que las columnas se identifican por letra (A, B, C…).
ALTER TABLE "perfiles_importacion" ADD COLUMN "sinEncabezado" BOOLEAN NOT NULL DEFAULT false;
