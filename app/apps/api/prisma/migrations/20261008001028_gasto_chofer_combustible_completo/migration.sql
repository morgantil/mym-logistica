-- AlterTable
ALTER TABLE "gastos_chofer" ADD COLUMN     "alicuota" DECIMAL(5,2),
ADD COLUMN     "codigoNeto" TEXT,
ADD COLUMN     "codigoNgEx" TEXT,
ADD COLUMN     "codigoPR" TEXT,
ADD COLUMN     "codigoPostal" TEXT,
ADD COLUMN     "comprobanteCodigo" TEXT,
ADD COLUMN     "comprobanteNumero" TEXT,
ADD COLUMN     "comprobanteSucursal" TEXT,
ADD COLUMN     "comprobanteTipo" TEXT,
ADD COLUMN     "conceptosNgEx" DECIMAL(12,2),
ADD COLUMN     "condicionFiscal" TEXT,
ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "domicilio" TEXT,
ADD COLUMN     "fechaRecepcion" TIMESTAMP(3),
ADD COLUMN     "ivaCredito" DECIMAL(12,2),
ADD COLUMN     "ivaLiquidado" DECIMAL(12,2),
ADD COLUMN     "netoGravado" DECIMAL(12,2),
ADD COLUMN     "percepcionRetencion" DECIMAL(12,2),
ADD COLUMN     "provincia" TEXT,
ADD COLUMN     "provinciaPR" TEXT,
ADD COLUMN     "tipoDocumento" TEXT;

-- Nota: `prisma migrate dev --create-only` también propuso un RENAME INDEX
-- sobre "montos_unificado_medicamento_..." — drift preexistente y no
-- relacionado con este cambio (nombre truncado del índice único de
-- MontoUnificadoMedicamento, ver migración 20261004070000). Se saca de acá
-- a propósito para no mezclar un cambio no pedido con este; si hace falta
-- resolverlo, es un tema aparte.
