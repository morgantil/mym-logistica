-- CreateTable
CREATE TABLE "jornadas_chofer" (
    "id" TEXT NOT NULL,
    "choferId" TEXT NOT NULL,
    "choferNombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "jornadas_chofer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jornadas_chofer_fecha_idx" ON "jornadas_chofer"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "jornadas_chofer_choferId_fecha_key" ON "jornadas_chofer"("choferId", "fecha");
