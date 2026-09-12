import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosActualizarPorcentaje,
  DatosActualizarTarifa,
  DatosActualizarTarifaTransportista,
  DatosCrearCombinacion,
  DatosCrearGrupoFacturacion,
  DatosCrearParUnificacion,
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
    cantidadViajes: fila.cantidadViajes,
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
        orderBy: { creadoEn: "desc" },
        include: { zonaTarifaria: { select: { nombre: true } } },
      })
      .then((filas) => filas.map(mapearTarifa));
  }

  async tarifaActiva(
    clienteId: string,
    zonaTarifariaId: string,
    tipoServicio: TipoServicio,
    tipoEnvase: TipoEnvase | null,
  ): Promise<TarifaCliente | null> {
    const fila = await this.prisma.tarifaCliente.findFirst({
      where: {
        clienteId,
        zonaTarifariaId,
        tipoServicio: tipoServicio as unknown as Prisma.TarifaClienteWhereInput["tipoServicio"],
        tipoEnvase: tipoEnvase as unknown as Prisma.TarifaClienteWhereInput["tipoEnvase"],
        activa: true,
      },
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
    return fila ? mapearTarifa(fila) : null;
  }

  async crearTarifa(datos: DatosCrearTarifa): Promise<TarifaCliente> {
    // Decisión 2026-09-11: sin historial por vigencia — una sola fila por
    // combinación clienteId+zonaTarifariaId+tipoServicio+tipoEnvase. Si ya
    // existe, no se crea otra (usar actualizarTarifa para editarla).
    const existente = await this.prisma.tarifaCliente.findFirst({
      where: {
        clienteId: datos.clienteId,
        zonaTarifariaId: datos.zonaTarifariaId,
        tipoServicio: datos.tipoServicio as unknown as Prisma.TarifaClienteWhereInput["tipoServicio"],
        tipoEnvase: datos.tipoEnvase as unknown as Prisma.TarifaClienteWhereInput["tipoEnvase"],
      },
    });
    if (existente) {
      throw new BadRequestException(
        "Ya existe una tarifa para esa zona y tipo — editá la que ya está en vez de crear otra.",
      );
    }
    const creada = await this.prisma.tarifaCliente.create({
      data: {
        clienteId: datos.clienteId,
        zonaTarifariaId: datos.zonaTarifariaId,
        tipoServicio: datos.tipoServicio as unknown as Prisma.TarifaClienteCreateInput["tipoServicio"],
        tipoEnvase: datos.tipoEnvase as unknown as Prisma.TarifaClienteCreateInput["tipoEnvase"],
        monto: datos.monto,
      },
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
    return mapearTarifa(creada);
  }

  async actualizarTarifa(id: string, datos: DatosActualizarTarifa): Promise<TarifaCliente> {
    const existente = await this.prisma.tarifaCliente.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Tarifa ${id} no encontrada.`);
    const actualizada = await this.prisma.tarifaCliente.update({
      where: { id },
      data: datos,
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
    return mapearTarifa(actualizada);
  }

  listarPorcentajes(clienteId: string): Promise<PorcentajeSegundoServicio[]> {
    return this.prisma.porcentajeSegundoServicio
      .findMany({ where: { clienteId }, orderBy: { creadoEn: "desc" } })
      .then((filas) => filas.map(mapearPorcentaje));
  }

  async porcentajeActivo(clienteId: string): Promise<PorcentajeSegundoServicio | null> {
    const fila = await this.prisma.porcentajeSegundoServicio.findFirst({
      where: { clienteId, activa: true },
    });
    return fila ? mapearPorcentaje(fila) : null;
  }

  async crearPorcentaje(datos: DatosCrearPorcentaje): Promise<PorcentajeSegundoServicio> {
    // Sin historial por vigencia — una sola fila por cliente. Si ya existe,
    // no se crea otra (usar actualizarPorcentaje para editarla).
    const existente = await this.prisma.porcentajeSegundoServicio.findFirst({
      where: { clienteId: datos.clienteId },
    });
    if (existente) {
      throw new BadRequestException(
        "Este cliente ya tiene un porcentaje cargado — editalo en vez de crear otro.",
      );
    }
    const creado = await this.prisma.porcentajeSegundoServicio.create({
      data: {
        clienteId: datos.clienteId,
        porcentajePanal: datos.porcentajePanal,
        porcentajeMedicamento: datos.porcentajeMedicamento,
      },
    });
    return mapearPorcentaje(creado);
  }

  async actualizarPorcentaje(id: string, datos: DatosActualizarPorcentaje): Promise<PorcentajeSegundoServicio> {
    const existente = await this.prisma.porcentajeSegundoServicio.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Porcentaje ${id} no encontrado.`);
    const actualizado = await this.prisma.porcentajeSegundoServicio.update({ where: { id }, data: datos });
    return mapearPorcentaje(actualizado);
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
    // `@@unique([clienteMedicamentoId, clientePanalId])` en el schema evitaría
    // el duplicado igual, pero con un error crudo de Postgres — este chequeo
    // da un mensaje entendible, mismo criterio que crearTarifa/crearPorcentaje.
    const existente = await this.prisma.combinacionUnificacionClientes.findFirst({
      where: { clienteMedicamentoId: datos.clienteMedicamentoId, clientePanalId: datos.clientePanalId },
    });
    if (existente) {
      throw new BadRequestException("Ya existe esta combinación entre estos dos clientes.");
    }
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

  async obtenerParesPorPedidos(pedidoIds: string[]): Promise<Map<string, string>> {
    if (pedidoIds.length === 0) return new Map();
    const pares = await this.prisma.unificacionCruzadaPar.findMany({
      where: { OR: [{ pedidoPanalId: { in: pedidoIds } }, { pedidoMedicamentoId: { in: pedidoIds } }] },
    });
    const mapa = new Map<string, string>();
    for (const par of pares) {
      mapa.set(par.pedidoPanalId, par.pedidoMedicamentoId);
      mapa.set(par.pedidoMedicamentoId, par.pedidoPanalId);
    }
    return mapa;
  }

  async listarPedidosConGrupoConfirmado(pedidoIds: string[]): Promise<Set<string>> {
    if (pedidoIds.length === 0) return new Set();
    const filas = await this.prisma.pedido.findMany({
      where: { id: { in: pedidoIds }, grupoFacturacion: { estado: "CONFIRMADO" } },
      select: { id: true },
    });
    return new Set(filas.map((fila) => fila.id));
  }

  async buscarCombinacionEntreClientes(
    clienteAId: string,
    clienteBId: string,
  ): Promise<CombinacionUnificacionClientes | null> {
    const fila = await this.prisma.combinacionUnificacionClientes.findFirst({
      where: {
        eliminadoEn: null,
        OR: [
          { clienteMedicamentoId: clienteAId, clientePanalId: clienteBId },
          { clienteMedicamentoId: clienteBId, clientePanalId: clienteAId },
        ],
      },
      include: {
        clienteMedicamento: { select: { nombre: true } },
        clientePanal: { select: { nombre: true } },
      },
    });
    return fila ? mapearCombinacion(fila) : null;
  }

  async crearParUnificacion(datos: DatosCrearParUnificacion): Promise<void> {
    const [existentePanal, existenteMedicamento] = await Promise.all([
      this.prisma.unificacionCruzadaPar.findUnique({ where: { pedidoPanalId: datos.pedidoPanalId } }),
      this.prisma.unificacionCruzadaPar.findUnique({ where: { pedidoMedicamentoId: datos.pedidoMedicamentoId } }),
    ]);
    if (existentePanal && existentePanal.pedidoMedicamentoId !== datos.pedidoMedicamentoId) {
      throw new BadRequestException(
        `El pedido ${datos.pedidoPanalId} ya está vinculado con otro pedido de medicamentos distinto.`,
      );
    }
    if (existenteMedicamento && existenteMedicamento.pedidoPanalId !== datos.pedidoPanalId) {
      throw new BadRequestException(
        `El pedido ${datos.pedidoMedicamentoId} ya está vinculado con otro pedido de pañal distinto.`,
      );
    }
    if (existentePanal) return; // ya existe exactamente este mismo par — nada que hacer.
    await this.prisma.unificacionCruzadaPar.create({ data: datos });
  }

  listarTarifasTransportista(): Promise<TarifaTransportista[]> {
    return this.prisma.tarifaTransportista
      .findMany({ orderBy: { creadoEn: "desc" } })
      .then((filas) => filas.map(mapearTarifaTransportista));
  }

  async tarifaTransportistaActiva(): Promise<TarifaTransportista | null> {
    const fila = await this.prisma.tarifaTransportista.findFirst({ where: { activa: true } });
    return fila ? mapearTarifaTransportista(fila) : null;
  }

  async crearTarifaTransportista(datos: DatosCrearTarifaTransportista): Promise<TarifaTransportista> {
    // Sin historial por vigencia — es un valor único global, si ya existe
    // alguna fila hay que editarla (actualizarTarifaTransportista).
    const existente = await this.prisma.tarifaTransportista.findFirst();
    if (existente) {
      throw new BadRequestException("Ya hay una tarifa de transportista cargada — editala en vez de crear otra.");
    }
    const creada = await this.prisma.tarifaTransportista.create({ data: { monto: datos.monto } });
    return mapearTarifaTransportista(creada);
  }

  async actualizarTarifaTransportista(
    id: string,
    datos: DatosActualizarTarifaTransportista,
  ): Promise<TarifaTransportista> {
    const existente = await this.prisma.tarifaTransportista.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Tarifa de transportista ${id} no encontrada.`);
    const actualizada = await this.prisma.tarifaTransportista.update({ where: { id }, data: datos });
    return mapearTarifaTransportista(actualizada);
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
  // Extraído para que generarVistaPrevia lo pueda llamar ANTES de volver a
  // listar los pedidos facturables — decisión 2026-09-11: si se limpia recién
  // adentro de reemplazarBorrador (al final del cálculo), un pedido que ya
  // había quedado en un BORRADOR de un cálculo anterior no aparece en el
  // nuevo listado (listarFacturables excluye grupoFacturacionId no nulo) y
  // "Volver a calcular" nunca lo vuelve a levantar — bug real encontrado
  // probando el peso por pedidos originales (ver DOCUMENTO TECNICO.md historial).
  private async limpiarBorradorEnTx(
    tx: Prisma.TransactionClient,
    clienteId: string,
    mes: number,
    anio: number,
  ): Promise<void> {
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
  }

  async limpiarBorrador(clienteId: string, mes: number, anio: number): Promise<void> {
    await this.prisma.$transaction((tx) => this.limpiarBorradorEnTx(tx, clienteId, mes, anio));
  }

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
        // Ya se llamó a limpiarBorrador antes de listar los pedidos
        // facturables (ver FacturacionService.generarVistaPrevia) — esto
        // queda como red de seguridad, no debería encontrar nada para borrar.
        await this.limpiarBorradorEnTx(tx, clienteId, mes, anio);

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
              cantidadViajes: grupo.cantidadViajes,
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
      numero: pedido.numero,
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
      cantidadViajes: pedido.grupoFacturacion!.cantidadViajes,
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
  activa: boolean;
}): TarifaCliente {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    zonaTarifariaId: fila.zonaTarifariaId,
    zonaTarifariaNombre: fila.zonaTarifaria?.nombre,
    tipoServicio: fila.tipoServicio as TarifaCliente["tipoServicio"],
    tipoEnvase: fila.tipoEnvase as TarifaCliente["tipoEnvase"],
    monto: Number(fila.monto),
    activa: fila.activa,
  };
}

function mapearPorcentaje(fila: {
  id: string;
  clienteId: string;
  porcentajePanal: Prisma.Decimal;
  porcentajeMedicamento: Prisma.Decimal;
  activa: boolean;
}): PorcentajeSegundoServicio {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    porcentajePanal: Number(fila.porcentajePanal),
    porcentajeMedicamento: Number(fila.porcentajeMedicamento),
    activa: fila.activa,
  };
}

function mapearTarifaTransportista(fila: { id: string; monto: Prisma.Decimal; activa: boolean }): TarifaTransportista {
  return {
    id: fila.id,
    monto: Number(fila.monto),
    activa: fila.activa,
  };
}
