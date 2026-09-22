-- Decisión 2026-09-22 (Leonardo): sacado el campo del todo — desde que se
-- eliminó la detección automática de cliente por nombre de archivo
-- (2026-09-16), nadie lee este dato; quedaba como campo obligatorio confuso
-- en el formulario de Cliente ("¿qué hace este menú?").
ALTER TABLE "clientes" DROP COLUMN "patronesDeteccion";
