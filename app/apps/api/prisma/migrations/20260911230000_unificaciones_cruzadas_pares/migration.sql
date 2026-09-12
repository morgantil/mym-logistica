-- CreateTable
CREATE TABLE "unificaciones_cruzadas_pares" (
    "id" TEXT NOT NULL,
    "combinacionId" TEXT NOT NULL,
    "pedidoPanalId" TEXT NOT NULL,
    "pedidoMedicamentoId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unificaciones_cruzadas_pares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unificaciones_cruzadas_pares_pedidoPanalId_key" ON "unificaciones_cruzadas_pares"("pedidoPanalId");

-- CreateIndex
CREATE UNIQUE INDEX "unificaciones_cruzadas_pares_pedidoMedicamentoId_key" ON "unificaciones_cruzadas_pares"("pedidoMedicamentoId");

-- AddForeignKey
ALTER TABLE "unificaciones_cruzadas_pares" ADD CONSTRAINT "unificaciones_cruzadas_pares_combinacionId_fkey" FOREIGN KEY ("combinacionId") REFERENCES "combinaciones_unificacion_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unificaciones_cruzadas_pares" ADD CONSTRAINT "unificaciones_cruzadas_pares_pedidoPanalId_fkey" FOREIGN KEY ("pedidoPanalId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unificaciones_cruzadas_pares" ADD CONSTRAINT "unificaciones_cruzadas_pares_pedidoMedicamentoId_fkey" FOREIGN KEY ("pedidoMedicamentoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
