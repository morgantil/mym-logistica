import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosCrearGrupoFacturacion,
  DatosCrearPorcentaje,
  DatosCrearTarifa,
  DatosCrearTarifaTransportista,
  FacturacionRepositorio,
} from "../domain/facturacion.repositorio";
import { GrupoFacturacion, PedidoFacturado } from "../domain/grupo-facturacion";
import { PedidoParaLiquidarTransportista } from "../domain/motor-liquidacion-transportistas";
import { PorcentajeSegundoServicio, TarifaCliente, TarifaTransportista } from "../domain/tarifa";

const UN_DIA_MS = 24 * 60 * 60 * 1000;

type FilaGrupo = Prisma.GrupoFacturacionGetPayload<{ include: { pedidos: { select: { id: true } } } }>;

function mapearGrupo(fila: FilaGrupo): GrupoFacturacion {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    mes: fila.mes,
    anio: fila.anio,
    estado: fila.estado as unknown as GrupoFacturacion["estado"],
    reglaAplicada: fila.reglaAplicada,
    tarifaUtilizada: fila.tarifaUtilizada ? Number(fila.tarifaUtilizada) : null,
    porcentajeAplicado: fila.porcentajeAplicado ? Number(fila.porcentajeAplicado) : null,
    importeCalculado: Number(fila.importeCalculado),
    confirmadoEn: fila.confirmadoEn,
    confirmadoPorId: fila.confirmadoPorId,
    pedidoIds: fila.pedidos.map((pedido) => pedido.id),
  };
}

@Injectable()
export class FacturacionRepositorioPrisma implements FacturacionRepositorio {
  constructor(private prisma: PrismaService) {}

  listarTarifas(clienteId: string): Promise<TarifaCliente[]> {
    return this.prisma.tarifaCliente
      .findMany({
        where: { clienteId },
        orderBy: { vigenciaDesde: "desc" },
        include: { zonaTarifaria: { select: { nombre: true } } },
      })
      .then((filas) => filas.map(mapearTarifa));
  }

  async tarifaVigente(clienteId: string, zonaTarifariaId: string, fecha: Date): Promise<TarifaCliente | null> {
    const fila = await this.prisma.tarifaCliente.findFirst({
      where: {
        clienteId,
        zonaTarifariaId,
        vigenciaDesde: { lte: fecha },
        OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: fecha } }],
      },
      orderBy: { vigenciaDesde: "desc" },
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
    return fila ? mapearTarifa(fila) : null;
  }

  async crearTarifa(datos: DatosCrearTarifa): Promise<TarifaCliente> {
    return this.prisma.$transaction(async (tx) => {
      // Cierra la tarifa de la misma zona que estuviera abierta, para no
      // dejar dos vigentes al mismo tiempo (§23 funcional: "vigencia para
      // mantener históricos").
      await tx.tarifaCliente.updateMany({
        where: {
          clienteId: datos.clienteId,
          zonaTarifariaId: datos.zonaTarifariaId,
          vigenciaHasta: null,
        },
        data: { vigenciaHasta: new Date(datos.vigenciaDesde.getTime() - UN_DIA_MS) },
      });
      const creada = await tx.tarifaCliente.create({
        data: {
          clienteId: datos.clienteId,
          zonaTarifariaId: datos.zonaTarifariaId,
          monto: datos.monto,
          vigenciaDesde: datos.vigenciaDesde,
        },
        include: { zonaTarifaria: { select: { nombre: true } } },
      });
      return mapearTarifa(creada);
    });
  }

  listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]> {
    return this.prisma.porcentajeSegundoServicio
      .findMany({ where: { clienteId }, orderBy: { vigenciaDesde: "desc" } })
      .then((filas) => filas.map(mapearPorcentaje));
  }

  async porcentajeVigente(clienteId: string, fecha: Date): Promise<PorcentajeSegundoServicio | null> {
    const fila = await this.prisma.porcentajeSegundoServicio.findFirst({
      where: {
        clienteId,
        vigenciaDesde: { lte: fecha },
        OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: fecha } }],
      },
      orderBy: { vigenciaDesde: "desc" },
    });
    return fila ? mapearPorcentaje(fila) : null;
  }

  async crearPorcentaje(datos: DatosCrearPorcentaje): Promise<PorcentajeSegundoServicio> {
    return this.prisma.$transaction(async (tx) => {
      await tx.porcentajeSegundoServicio.updateMany({
        where: { clienteId: datos.clienteId, vigenciaHasta: null },
        data: { vigenciaHasta: new Date(datos.vigenciaDesde.getTime() - UN_DIA_MS) },
      });
      const creado = await tx.porcentajeSegundoServicio.create({
        data: {
          clienteId: datos.clienteId,
          porcentaje: datos.porcentaje,
          vigenciaDesde: datos.vigenciaDesde,
        },
      });
      return mapearPorcentaje(creado);
    });
  }

  listarTarifasTransportista(): Promise<TarifaTransportista[]> {
    return this.prisma.tarifaTransportista
      .findMany({ orderBy: { vigenciaDesde: "desc" } })
      .then((filas) => filas.map(mapearTarifaTransportista));
  }

  async tarifaTransportistaVigente(fecha: Date): Promise<TarifaTransportista | null> {
    const fila = await this.prisma.tarifaTransportista.findFirst({
      where: {
        vigenciaDesde: { lte: fecha },
        OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: fecha } }],
      },
      orderBy: { vigenciaDesde: "desc" },
    });
    return fila ? mapearTarifaTransportista(fila) : null;
  }

  async crearTarifaTransportista(datos: DatosCrearTarifaTransportista): Promise<TarifaTransportista> {
    return this.prisma.$transaction(async (tx) => {
      await tx.tarifaTransportista.updateMany({
        where: { vigenciaHasta: null },
        data: { vigenciaHasta: new Date(datos.vigenciaDesde.getTime() - UN_DIA_MS) },
      });
      const creada = await tx.tarifaTransportista.create({
        data: { monto: datos.monto, vigenciaDesde: datos.vigenciaDesde },
      });
      return mapearTarifaTransportista(creada);
    });
  }

  async listarEntregadosPorChoferEnPeriodo(
    fechaDesde: Date,
    fechaHasta: Date,
  ): Promise<PedidoParaLiquidarTransportista[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estado: "ENTREGADO",
        choferId: { not: null },
        fechaEntregaEfectiva: { gte: fechaDesde, lt: fechaHasta },
      },
      select: { id: true, choferId: true, choferNombre: true },
    });
    return pedidos.map((p) => ({
      id: p.id,
      choferId: p.choferId as string,
      choferNombre: p.choferNombre ?? "(sin nombre)",
    }));
  }

  async existeGrupoConfirmado(clienteId: string, mes: number, anio: number): Promise<boolean> {
    const total = await this.prisma.grupoFacturacion.count({
      where: { clienteId, mes, anio, estado: "CONFIRMADO" },
    });
    return total > 0;
  }

  // Recalcular una vista previa (§ "vista previa de facturación", DOCUMENTO
  // TECNICO.md sección 2) reemplaza los BORRADOR anteriores del mismo
  // cliente/mes/año: primero desvincula sus pedidos (grupoFacturacionId es FK,
  // no se puede borrar el grupo con pedidos todavía apuntándole), después los
  // borra físicamente (GrupoFacturacion no tiene borrado lógico — un BORRADOR
  // sin confirmar no tiene valor de auditoría, ver soft-delete.middleware.ts)
  // y por último crea los nuevos. Todo en una sola transacción.
  async reemplazarBorrador(
    clienteId: string,
    mes: number,
    anio: number,
    grupos: DatosCrearGrupoFacturacion[],
  ): Promise<GrupoFacturacion[]> {
    // El timeout default de Prisma para transacciones interactivas es 5s —
    // de sobra normalmente, pero acá adentro se hace un `create` + `updateMany`
    // POR CADA viaje (no hay forma de hacerlo en un solo `createMany`, porque
    // necesita la relación `pedidos: connect`), y contra Neon (Postgres
    // serverless, con latencia de red real por request) un mes con varios
    // viajes puede superar los 5s y tirar "Transaction already closed" — bug
    // real encontrado en QA el 2026-08-11 con solo 2 grupos. 30s da margen
    // para volúmenes reales sin tener que rediseñar el batching ahora.
    return this.prisma.$transaction(
      async (tx) => {
        const anteriores = await tx.grupoFacturacion.findMany({
          where: { clienteId, mes, anio, estado: "BORRADOR" },
          select: { id: true },
        });
        const idsAnteriores = anteriores.map((g) => g.id);

        if (idsAnteriores.length > 0) {
          await tx.pedido.updateMany({
            where: { grupoFacturacionId: { in: idsAnteriores } },
            data: { grupoFacturacionId: null, reglaAplicada: null },
          });
          await tx.grupoFacturacion.deleteMany({ where: { id: { in: idsAnteriores } } });
        }

        const creados: FilaGrupo[] = [];
        for (const grupo of grupos) {
          const creado = await tx.grupoFacturacion.create({
            data: {
              clienteId: grupo.clienteId,
              mes: grupo.mes,
              anio: grupo.anio,
              estado: "BORRADOR",
              reglaAplicada: grupo.reglaAplicada,
              tarifaUtilizada: grupo.tarifaUtilizada,
              porcentajeAplicado: grupo.porcentajeAplicado,
              importeCalculado: grupo.importeCalculado,
              pedidos: { connect: grupo.pedidoIds.map((id) => ({ id })) },
            },
            include: { pedidos: { select: { id: true } } },
          });
          await tx.pedido.updateMany({
            where: { id: { in: grupo.pedidoIds } },
            data: { reglaAplicada: grupo.reglaAplicada },
          });
          creados.push(creado);
        }

        return creados.map(mapearGrupo);
      },
      { timeout: 30000 },
    );
  }

  async listarGrupos(clienteId: string, mes: number, anio: number): Promise<GrupoFacturacion[]> {
    const filas = await this.prisma.grupoFacturacion.findMany({
      where: { clienteId, mes, anio },
      include: { pedidos: { select: { id: true } } },
      orderBy: { creadoEn: "asc" },
    });
    return filas.map(mapearGrupo);
  }

  async confirmar(clienteId: string, mes: number, anio: number, usuarioId: string): Promise<GrupoFacturacion[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.grupoFacturacion.updateMany({
        where: { clienteId, mes, anio, estado: "BORRADOR" },
        data: { estado: "CONFIRMADO", confirmadoEn: new Date(), confirmadoPorId: usuarioId },
      });
      const confirmados = await tx.grupoFacturacion.findMany({
        where: { clienteId, mes, anio, estado: "CONFIRMADO" },
        include: { pedidos: { select: { id: true } } },
      });
      return confirmados.map(mapearGrupo);
    });
  }

  async listarPedidosFacturados(clienteId: string, mes: number, anio: number): Promise<PedidoFacturado[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: { clienteId, grupoFacturacion: { mes, anio } },
      include: {
        destinatario: { select: { nombre: true, numeroAfiliado: true } },
        zonaTarifaria: { select: { id: true, nombre: true } },
        grupoFacturacion: true,
      },
      orderBy: { fechaProgramada: "asc" },
    });

    return pedidos.map((pedido) => ({
      pedidoId: pedido.id,
      fechaProgramada: pedido.fechaProgramada,
      destinatarioNombre: pedido.destinatario.nombre,
      numeroAfiliado: pedido.destinatario.numeroAfiliado,
      direccion: pedido.direccionUsada,
      zonaTarifariaId: pedido.zonaTarifaria?.id ?? null,
      zonaTarifariaNombre: pedido.zonaTarifaria?.nombre ?? null,
      tipoServicio: pedido.tipoServicio as unknown as PedidoFacturado["tipoServicio"],
      choferNombre: pedido.choferNombre,
      // grupoFacturacion no puede ser null acá: el `where` de arriba
      // (`grupoFacturacion: { mes, anio }`) ya excluye los pedidos sin grupo.
      grupoId: pedido.grupoFacturacion!.id,
      reglaAplicada: pedido.grupoFacturacion!.reglaAplicada,
      tarifaUtilizada: pedido.grupoFacturacion!.tarifaUtilizada
        ? Number(pedido.grupoFacturacion!.tarifaUtilizada)
        : null,
      porcentajeAplicado: pedido.grupoFacturacion!.porcentajeAplicado
        ? Number(pedido.grupoFacturacion!.porcentajeAplicado)
        : null,
      importeViaje: Number(pedido.grupoFacturacion!.importeCalculado),
    }));
  }
}

function mapearTarifa(fila: {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifaria?: { nombre: string };
  monto: Prisma.Decimal;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}): TarifaCliente {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    zonaTarifariaId: fila.zonaTarifariaId,
    zonaTarifariaNombre: fila.zonaTarifaria?.nombre,
    monto: Number(fila.monto),
    vigenciaDesde: fila.vigenciaDesde,
    vigenciaHasta: fila.vigenciaHasta,
  };
}

function mapearPorcentaje(fila: {
  id: string;
  clienteId: string;
  porcentaje: Prisma.Decimal;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}): PorcentajeSegundoServicio {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    porcentaje: Number(fila.porcentaje),
    vigenciaDesde: fila.vigenciaDesde,
    vigenciaHasta: fila.vigenciaHasta,
  };
}

function mapearTarifaTransportista(fila: {
  id: string;
  monto: Prisma.Decimal;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}): TarifaTransportista {
  return {
    id: fila.id,
    monto: Number(fila.monto),
    vigenciaDesde: fila.vigenciaDesde,
    vigenciaHasta: fila.vigenciaHasta,
  };
}
