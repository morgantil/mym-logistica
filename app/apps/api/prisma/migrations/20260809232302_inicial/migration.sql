-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('OPERACIONES', 'LOGISTICA', 'ADMINISTRACION', 'FACTURACION');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('PANAL', 'MEDICAMENTO');

-- CreateEnum
CREATE TYPE "CabaProvincia" AS ENUM ('CABA', 'PROVINCIA');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('SIN_ASIGNAR', 'COORDINADO', 'EN_TRANSITO', 'ENTREGADO', 'ENTREGA_FALLIDA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoValidacion" AS ENUM ('PENDIENTE', 'VALIDO', 'CON_ERRORES');

-- CreateEnum
CREATE TYPE "EstadoSimpliroute" AS ENUM ('NO_ENVIADO', 'ENVIADO', 'NO_ENCONTRADO', 'ERROR');

-- CreateEnum
CREATE TYPE "EstadoImportacion" AS ENUM ('PROCESANDO', 'COMPLETADA', 'COMPLETADA_CON_ERRORES', 'FALLIDA');

-- CreateEnum
CREATE TYPE "EstadoGrupoFacturacion" AS ENUM ('BORRADOR', 'CONFIRMADO');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREAR', 'ACTUALIZAR', 'BORRAR', 'RESTAURAR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "roles" "Rol"[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_clientes" (
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "usuarios_clientes_pkey" PRIMARY KEY ("usuarioId","clienteId")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "patronesDeteccion" TEXT[],
    "porcentajeSegundoServicioActual" DECIMAL(5,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_cliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "CabaProvincia" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "tarifas_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinatarios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numeroAfiliado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "direccionNormalizada" TEXT,
    "localidad" TEXT NOT NULL,
    "telefono" TEXT,
    "simplirouteId" TEXT,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "destinatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choferes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "choferes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_choferes" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "choferId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zonas_choferes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importaciones_excel" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "urlArchivo" TEXT NOT NULL,
    "estado" "EstadoImportacion" NOT NULL DEFAULT 'PROCESANDO',
    "totalFilas" INTEGER,
    "filasConError" INTEGER,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importaciones_excel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "importacionId" TEXT,
    "numeroAfiliado" TEXT NOT NULL,
    "direccionOriginal" TEXT NOT NULL,
    "direccionUsada" TEXT NOT NULL,
    "direccionNormalizada" TEXT,
    "localidad" TEXT NOT NULL,
    "cabaProvincia" "CabaProvincia",
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaEntregaEfectiva" TIMESTAMP(3),
    "tipoServicio" "TipoServicio" NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'SIN_ASIGNAR',
    "estadoValidacion" "EstadoValidacion" NOT NULL DEFAULT 'PENDIENTE',
    "estadoSimpliroute" "EstadoSimpliroute" NOT NULL DEFAULT 'NO_ENVIADO',
    "zonaId" TEXT,
    "choferId" TEXT,
    "bultos" INTEGER,
    "remito" TEXT,
    "ticket" TEXT,
    "simplirouteId" TEXT,
    "observaciones" TEXT,
    "grupoFacturacionId" TEXT,
    "reglaAplicada" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "codigo" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "porcentajes_segundo_servicio" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "porcentajes_segundo_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_facturacion" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoGrupoFacturacion" NOT NULL DEFAULT 'BORRADOR',
    "reglaAplicada" TEXT NOT NULL,
    "tarifaUtilizada" DECIMAL(12,2),
    "porcentajeAplicado" DECIMAL(5,2),
    "importeCalculado" DECIMAL(12,2) NOT NULL,
    "confirmadoEn" TIMESTAMP(3),
    "confirmadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_facturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" "AccionAuditoria" NOT NULL,
    "usuarioId" TEXT,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");

-- CreateIndex
CREATE INDEX "tarifas_cliente_clienteId_tipo_vigenciaDesde_idx" ON "tarifas_cliente"("clienteId", "tipo", "vigenciaDesde");

-- CreateIndex
CREATE UNIQUE INDEX "destinatarios_clienteId_numeroAfiliado_key" ON "destinatarios"("clienteId", "numeroAfiliado");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nombre_key" ON "zonas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_choferes_zonaId_choferId_key" ON "zonas_choferes"("zonaId", "choferId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_estado_fechaProgramada_idx" ON "pedidos"("clienteId", "estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "pedidos_destinatarioId_idx" ON "pedidos"("destinatarioId");

-- CreateIndex
CREATE INDEX "grupos_facturacion_clienteId_anio_mes_estado_idx" ON "grupos_facturacion"("clienteId", "anio", "mes", "estado");

-- CreateIndex
CREATE INDEX "registros_auditoria_entidad_entidadId_idx" ON "registros_auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "registros_auditoria_usuarioId_idx" ON "registros_auditoria"("usuarioId");

-- AddForeignKey
ALTER TABLE "usuarios_clientes" ADD CONSTRAINT "usuarios_clientes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_clientes" ADD CONSTRAINT "usuarios_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_cliente" ADD CONSTRAINT "tarifas_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinatarios" ADD CONSTRAINT "destinatarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_choferes" ADD CONSTRAINT "zonas_choferes_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_choferes" ADD CONSTRAINT "zonas_choferes_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES "choferes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importaciones_excel" ADD CONSTRAINT "importaciones_excel_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "destinatarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "importaciones_excel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES "choferes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_grupoFacturacionId_fkey" FOREIGN KEY ("grupoFacturacionId") REFERENCES "grupos_facturacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_facturacion" ADD CONSTRAINT "grupos_facturacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
