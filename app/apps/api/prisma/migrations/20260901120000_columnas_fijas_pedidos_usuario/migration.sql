-- Preferencia personal de columnas fijas en la grilla de Pedidos, por usuario.
ALTER TABLE "usuarios" ADD COLUMN "columnasFijasPedidos" TEXT[] NOT NULL DEFAULT '{}';
