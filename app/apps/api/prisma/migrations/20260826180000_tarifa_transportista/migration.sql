-- Liquidación a transportistas: monto configurable con historial de
-- vigencia (mismo patrón que porcentajes_segundo_servicio/tarifas_cliente).
CREATE TABLE "tarifas_transportista" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "tarifas_transportista_pkey" PRIMARY KEY ("id")
);
