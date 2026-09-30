-- Por cliente: si factura por Cordón (Primer/Segundo/Tercer, resolviendo el
-- partido) o con tarifa plana CABA/Provincia (ignora el partido, siempre
-- factura Provincia fuera de CABA). Decisión 2026-09-30, ver comentario en
-- schema.prisma.
ALTER TABLE "clientes" ADD COLUMN "facturaPorCordon" BOOLEAN NOT NULL DEFAULT false;

-- Se deriva de los datos ya cargados en vez de hardcodear un nombre de
-- cliente: cualquiera que ya tenga una tarifa o un monto de medicamento en
-- unificado apuntando a una zona de Cordón evidentemente ya factura así
-- (hoy: Bella Vista Medicamentos).
UPDATE "clientes" c
SET "facturaPorCordon" = true
WHERE EXISTS (
  SELECT 1 FROM tarifas_cliente t
  JOIN zonas_tarifarias z ON z.id = t."zonaTarifariaId"
  WHERE t."clienteId" = c.id AND z.nombre IN ('Primer Cordon', 'Segundo Cordón', 'Tercer Cordón')
) OR EXISTS (
  SELECT 1 FROM montos_unificado_medicamento m
  JOIN zonas_tarifarias z ON z.id = m."zonaTarifariaId"
  WHERE m."clienteId" = c.id AND z.nombre IN ('Primer Cordon', 'Segundo Cordón', 'Tercer Cordón')
);
