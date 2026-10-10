-- CreateIndex
CREATE INDEX "pedidos_choferId_fechaProgramada_idx" ON "pedidos"("choferId", "fechaProgramada");

-- CreateIndex
CREATE INDEX "pedidos_zonaId_fechaProgramada_idx" ON "pedidos"("zonaId", "fechaProgramada");

-- CreateIndex
CREATE INDEX "pedidos_ruta_idx" ON "pedidos"("ruta");

-- CreateIndex
CREATE INDEX "pedidos_localidad_idx" ON "pedidos"("localidad");

-- CreateIndex
CREATE INDEX "pedidos_prioridad_idx" ON "pedidos"("prioridad");

-- CreateIndex
CREATE INDEX "pedidos_estadoSimpliroute_idx" ON "pedidos"("estadoSimpliroute");

-- CreateIndex
CREATE INDEX "pedidos_importacionId_idx" ON "pedidos"("importacionId");

-- La búsqueda libre de Pedidos ("busqueda", ver pedidos.repositorio.prisma.ts)
-- usa `contains` (ILIKE "%texto%") sobre numeroAfiliado/direccionUsada/
-- destinatario.nombre — un índice B-tree normal (los de arriba) no acelera
-- ese patrón, hace falta trigram (pg_trgm). No está declarado en
-- schema.prisma porque Prisma 5.22 no tiene soporte estable para índices
-- GIN en el schema — se gestiona acá a mano, igual criterio que otros
-- ajustes puntuales de migraciones en este proyecto.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "pedidos_numeroAfiliado_trgm_idx" ON "pedidos" USING GIN ("numeroAfiliado" gin_trgm_ops);
CREATE INDEX "pedidos_direccionUsada_trgm_idx" ON "pedidos" USING GIN ("direccionUsada" gin_trgm_ops);
CREATE INDEX "destinatarios_nombre_trgm_idx" ON "destinatarios" USING GIN ("nombre" gin_trgm_ops);
