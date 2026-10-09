-- AddForeignKey
ALTER TABLE "importaciones_excel" ADD CONSTRAINT "importaciones_excel_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
