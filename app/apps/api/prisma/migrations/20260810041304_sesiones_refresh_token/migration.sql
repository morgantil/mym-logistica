-- CreateTable
CREATE TABLE "sesiones_refresh_token" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "revocadoEn" TIMESTAMP(3),

    CONSTRAINT "sesiones_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_refresh_token_tokenHash_key" ON "sesiones_refresh_token"("tokenHash");

-- CreateIndex
CREATE INDEX "sesiones_refresh_token_usuarioId_idx" ON "sesiones_refresh_token"("usuarioId");

-- AddForeignKey
ALTER TABLE "sesiones_refresh_token" ADD CONSTRAINT "sesiones_refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
