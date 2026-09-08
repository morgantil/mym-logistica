import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosCrearCombinacion,
  DatosCrearGrupoFacturacion,
  DatosCrearPorcentaje,
  DatosCrearTarifa,
  DatosCrearTarifaTransportista,
  FacturacionRepositorio,
} from "../domain/facturacion.repositorio";
import { GrupoFacturacion, PedidoFacturado } from "../domain/grupo-facturacion";
import { PedidoParaLiquidarTransportista } from "../domain/motor-liquidacion-transportistas";
import {
  CombinacionUnificacionClientes,
  PorcentajeSegundoServicio,
  TarifaCliente,
  TarifaTransportista,
} from "../domain/tarifa";

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
    porcentajePanalAplicado: fila.porcentajePanalAplicado ? Number(fila.porcentajePanalAplicado) : null,
    porcentajeMedicamentoAplicado: fila.porcentajeMedicamentoAplicado
      ? Number(fila.porcentajeMedicamentoAplicado)
      : null,
    pedidoSocioId: fila.pedidoSocioId,
    clienteSocioId: fila.clienteSocioId,
    importeCalculado: Number(fila.importeCalculado),
    confirmadoEn: fila.confirmadoEn,
    confirmadoPorId: fila.confirmadoPorId,
    pedidoIds: fila.pedidos.map((pedido) => pedido.id),
  };
}

function mapearCombinacion(fila: {
  id: string;
  clienteMedicamentoId: string;
  clienteMedicamento?: { nombre: string };
  clientePanalId: string;
  clientePanal?: { nombre: string };
  activa: boolean;
}): CombinacionUnificacionClientes {
  return {
    id: fila.id,
    clienteMedicamentoId: fila.clienteMedicamentoId,
    clienteMedicamentoNombre: fila.clienteMedicamento?.nombre,
    clientePanalId: fila.clientePanalId,
    clientePanalNombre: fila.clientePanal?.nombre,
    activa: fila.activa,
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

  async tarifaVigente(
    clienteId: string,
    zonaTarifariaId: string,
    tipoServicio: TipoServicio,
    tipoEnvase: TipoEnvase | null,
    fecha: Date,
  ): Promise<TarifaCliente | null> {
    const fila = await this.prisma.tarifaCliente.findFirst({
      where: {
        clienteId,
        zonaTarifariaId,
        tipoServicio: tipoServicio as unknown as Prisma.TarifaClienteWhereInput["tipoServicio"],
        tipoEnvase: tipoEnvase as unknown as Prisma.TarifaClienteWhereInput["tipoEnvase"],
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
      // Cierra la tarifa de la misma combinación zona+tipoServicio+tipoEnvase
      // que estuviera abierta, para no dejar dos vigentes al mismo tiempo
      // (§23 funcional: "vigencia para mantener históricos"). tipoEnvase null
      // no matchea con `equals: null` en Prisma para NOT NULL — pero acá la
      // columna SÍ admite null, así que `tipoEnvase: datos.tipoEnvase` alcanza.
      await tx.tarifaCliente.updateMany({
        where: {
          clienteId: datos.clienteId,
          zonaTarifariaId: datos.zonaTarifariaId,
          tipoServicio: datos.tipoServicio as unknown as Prisma.TarifaClienteWhereInput["tipoServicio"],
          tipoEnvase: datos.tipoEnvase as unknown as Prisma.TarifaClienteWhereInput["tipoEnvase"],
          vigenciaHasta: null,
        },
        data: { vigenciaHasta: new Date(datos.vigenciaDesde.getTime() - UN_DIA_MS) },
      });
      const creada = await tx.tarifaCliente.create({
        data: {
          clienteId: datos.clienteId,
          zonaTarifariaId: datos.zonaTarifariaId,
          tipoServicio: datos.tipoServicio as unknown as Prisma.TarifaClienteCreateInput["tipoServicio"],
          tipoEnvase: datos.tipoEnvase as unknown as Prisma.TarifaClienteCreateInput["tipoEnvase"],
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
          porcentajePanal: datos.porcentajePanal,
          porcentajeMedicamento: datos.porcentajeMedicamento,
          vigenciaDesde: datos.vigenciaDesde,
        },
      });
      return mapearPorcentaje(creado);
    });
  }

  listarCombinaciones(): Promise<CombinacionUnificacionClientes[]> {
    return this.prisma.combinacionUnificacionClientes
      .findMany({
        where: { eliminadoEn: null },
        include: {
          clienteMedicamento: { select: { nombre: true } },
          clientePanal: { select: { nombre: true } },
        },
        orderBy: { creadoEn: "asc" },
      })
      .then((filas) => filas.map(mapearCombinacion));
  }

  listarCombinacionesDeCliente(clienteId: string): Promise<CombinacionUnificacionClientes[]> {
    return this.prisma.combinacionUnificacionClientes
      .findMany({
        where: {
          eliminadoEn: null,
          activa: true,
          OR: [{ clienteMedicamentoId: clienteId }, { clientePanalId: clienteId }],
        },
        include: {
          clienteMedicamento: { select: { nombre: true } },
          clientePanal: { select: { nombre: true } },
        },
      })
      .then((filas) => filas.map(mapearCombinacion));
  }

  async crearCombinacion(datos: DatosCrearCombinacion): Promise<CombinacionUnificacionClientes> {
    const creada = await this.prisma.combinacionUnificacionClientes.create({
      data: {
        clienteMedicamentoId: datos.clienteMedicamentoId,
        clientePanalId: datos.clientePanalId,
      },
      include: {
        clienteMedicamento: { select: { nombre: true } },
        clientePanal: { select: { nombre: true } },
      },
    });
    return mapearCombinacion(creada);
  }

  async eliminarCombinacion(id: string): Promise<void> {
    await this.prisma.combinacionUnificacionClientes.update({
      where: { id },
      data: { eliminadoEn: new Date() },
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
              porcentajePanalAplicado: grupo.porcentajePanalAplicado ?? null,
              porcentajeMedicamentoAplicado: grupo.porcentajeMedicamentoAplicado ?? null,
              pedidoSocioId: grupo.pedidoSocioId ?? null,
              clienteSocioId: grupo.clienteSocioId ?? null,
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
      porcentajePanalAplicado: pedido.grupoFacturacion!.porcentajePanalAplicado
        ? Number(pedido.grupoFacturacion!.porcentajePanalAplicado)
        : null,
      porcentajeMedicamentoAplicado: pedido.grupoFacturacion!.porcentajeMedicamentoAplicado
        ? Number(pedido.grupoFacturacion!.porcentajeMedicamentoAplicado)
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
  tipoServicio: unknown;
  tipoEnvase: unknown;
  monto: Prisma.Decimal;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}): TarifaCliente {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    zonaTarifariaId: fila.zonaTarifariaId,
    zonaTarifariaNombre: fila.zonaTarifaria?.nombre,
    tipoServicio: fila.tipoServicio as TarifaCliente["tipoServicio"],
    tipoEnvase: fila.tipoEnvase as TarifaCliente["tipoEnvase"],
    monto: Number(fila.monto),
    vigenciaDesde: fila.vigenciaDesde,
    vigenciaHasta: fila.vigenciaHasta,
  };
}

function mapearPorcentaje(fila: {
  id: string;
  clienteId: string;
  porcentajePanal: Prisma.Decimal;
  porcentajeMedicamento: Prisma.Decimal;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}): PorcentajeSegundoServicio {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    porcentajePanal: Number(fila.porcentajePanal),
    porcentajeMedicamento: Number(fila.porcentajeMedicamento),
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
