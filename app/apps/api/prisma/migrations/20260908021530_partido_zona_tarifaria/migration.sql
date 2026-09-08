-- CreateTable
CREATE TABLE "partidos_zonas_tarifarias" (
    "partido" TEXT NOT NULL,
    "zonaTarifariaId" TEXT NOT NULL,

    CONSTRAINT "partidos_zonas_tarifarias_pkey" PRIMARY KEY ("partido")
);

-- AddForeignKey
ALTER TABLE "partidos_zonas_tarifarias" ADD CONSTRAINT "partidos_zonas_tarifarias_zonaTarifariaId_fkey" FOREIGN KEY ("zonaTarifariaId") REFERENCES "zonas_tarifarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

