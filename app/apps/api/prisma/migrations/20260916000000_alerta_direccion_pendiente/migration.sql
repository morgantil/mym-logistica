-- Un pedido con dirección distinta a la registrada en el padrón queda
-- marcado y no se puede enviar hasta resolverlo (ver validar-envio.ts) —
-- antes solo quedaba una nota de texto libre en "observaciones", sin bloquear
-- nada.
ALTER TABLE "pedidos" ADD COLUMN "alertaDireccionPendiente" BOOLEAN NOT NULL DEFAULT false;
