-- AlterTable: Pedido.cantidadPedidoOriginal (cuántos pedidos del sistema de
-- origen se agruparon en este Pedido — ver comentario en schema.prisma)
ALTER TABLE "pedidos" ADD COLUMN "cantidadPedidoOriginal" INTEGER NOT NULL DEFAULT 1;

-- AlterTable: GrupoFacturacion.cantidadViajes (una fila ya no es siempre 1
-- viaje — ver comentario en schema.prisma)
ALTER TABLE "grupos_facturacion" ADD COLUMN "cantidadViajes" INTEGER NOT NULL DEFAULT 1;
