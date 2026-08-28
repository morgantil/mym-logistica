import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { EstadoPedido } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ConflictoVersionError } from "../domain/conflicto-version.error";
import { Pedido, PedidoListado } from "../domain/pedido";
import {
  DatosCrearPedido,
  FiltroPedidos,
  FiltroPedidosFacturables,
  PaginaPedidos,
  PedidoParaSincronizar,
  PedidosRepositorio,
} from "../domain/pedidos.repositorio";

// Include compartido por listar() y listarPendientesDeEnvio(): son los únicos
// dos métodos que devuelven PedidoListado (ver domain/pedido.ts) en vez del
// Pedido base.
// Zona/Chofer ya no son relaciones (ver schema.prisma) — `zonaNombre` y
// `choferNombre` son columnas planas del propio Pedido (snapshot al momento
// de resolverlas, ver DOCUMENTO TECNICO.md historial 2026-08-26), no hace
// falta joinearlas.
const INCLUDE_LISTADO = {
  cliente: { select: { nombre: true } },
  destinatario: { select: { nombre: true } },
  productos: { select: { codigo: true, descripcion: true, cantidad: true } },
} satisfies Prisma.PedidoInclude;

type FilaPedidoListado = Prisma.PedidoGetPayload<{ include: typeof INCLUDE_LISTADO }>;

function mapearListado(fila: FilaPedidoListado): PedidoListado {
  const { cliente, destinatario, ...resto } = fila;
  return {
    ...(resto as unknown as Pedido),
    clienteNombre: cliente.nombre,
    destinatarioNombre: destinatario.nombre,
    productos: fila.productos,
  };
}

@Injectable()
export class PedidosRepositorioPrisma implements PedidosRepositorio {
  constructor(private prisma: PrismaService) {}

  private armarWhere(filtro: FiltroPedidos): Prisma.PedidoWhereInput {
    return {
      ...(filtro.clienteIds ? { clienteId: { in: filtro.clienteIds } } : {}),
      // El dominio usa el enum de @mym/shared-types (no depende de Prisma); acá en
      // el adapter de infra es donde corresponde traducirlo al enum generado por
      // Prisma — mismos valores string, tipos nominalmente distintos.
      ...(filtro.estado ? { estado: filtro.estado as unknown as Prisma.EnumEstadoPedidoFilter } : {}),
      ...(filtro.fechaDesde || filtro.fechaHasta
        ? {
            fechaProgramada: {
              ...(filtro.fechaDesde ? { gte: filtro.fechaDesde } : {}),
              ...(filtro.fechaHasta ? { lte: filtro.fechaHasta } : {}),
            },
          }
        : {}),
    };
  }

  async listar(filtro: FiltroPedidos, pagina: number, porPagina: number): Promise<PaginaPedidos> {
    const where = this.armarWhere(filtro);
    const [datos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        orderBy: { fechaProgramada: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: INCLUDE_LISTADO,
      }),
      this.prisma.pedido.count({ where }),
    ]);
    return { datos: datos.map(mapearListado), total };
  }

  // Base de los endpoints de dashboard/KPIs (DOCUMENTO TECNICO.md, ítem confirmado
  // "endpoints ahora, pantalla después").
  async contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>> {
    const resultado = await this.prisma.pedido.groupBy({
      by: ["estado"],
      where: clienteIds ? { clienteId: { in: clienteIds } } : undefined,
      _count: true,
    });
    return Object.fromEntries(resultado.map((fila) => [fila.estado, fila._count]));
  }

  async crear(datos: DatosCrearPedido): Promise<Pedido> {
    const creado = await this.prisma.pedido.create({
      data: {
        clienteId: datos.clienteId,
        destinatarioId: datos.destinatarioId,
        importacionId: datos.importacionId,
        numeroAfiliado: datos.numeroAfiliado,
        direccionOriginal: datos.direccionOriginal,
        direccionUsada: datos.direccionUsada,
        localidad: datos.localidad,
        zonaTarifariaId: datos.zonaTarifariaId,
        fechaProgramada: datos.fechaProgramada,
        tipoServicio: datos.tipoServicio as unknown as Prisma.PedidoCreateInput["tipoServicio"],
        observaciones: datos.observaciones,
        zonaId: datos.zonaId,
        zonaNombre: datos.zonaNombre,
        choferId: datos.choferId,
        choferNombre: datos.choferNombre,
        estadoSimpliroute:
          datos.estadoSimpliroute as unknown as Prisma.PedidoCreateInput["estadoSimpliroute"],
        estadoValidacion:
          datos.estadoValidacion as unknown as Prisma.PedidoCreateInput["estadoValidacion"],
        productos: {
          create: datos.productos.map((producto) => ({
            codigo: producto.codigo,
            descripcion: producto.descripcion,
            cantidad: producto.cantidad,
          })),
        },
      },
    });
    return creado as unknown as Pedido;
  }

  async obtenerPorId(id: string): Promise<Pedido | null> {
    const encontrado = await this.prisma.pedido.findUnique({ where: { id } });
    return encontrado as unknown as Pedido | null;
  }

  async obtenerListadoPorId(id: string): Promise<PedidoListado | null> {
    const encontrado = await this.prisma.pedido.findUnique({ where: { id }, include: INCLUDE_LISTADO });
    return encontrado ? mapearListado(encontrado) : null;
  }

  async listarPendientesDeEnvio(clienteIds?: string[]): Promise<PedidoListado[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estado: "SIN_ASIGNAR",
        ...(clienteIds ? { clienteId: { in: clienteIds } } : {}),
      },
      orderBy: { fechaProgramada: "asc" },
      include: INCLUDE_LISTADO,
    });
    return pedidos.map(mapearListado);
  }

  async listarFacturables(filtro: FiltroPedidosFacturables): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        clienteId: filtro.clienteId,
        estado: "ENTREGADO",
        grupoFacturacionId: null,
        fechaProgramada: { gte: filtro.fechaDesde, lt: filtro.fechaHasta },
      },
      orderBy: { fechaProgramada: "asc" },
    });
    return pedidos as unknown as Pedido[];
  }

  // count===0 en el updateMany puede significar "no existe" o "cambió la
  // versión" — son errores distintos (404 vs 409), así que se distingue acá
  // antes de decidir cuál tirar.
  private async fallarSiNoExiste(id: string): Promise<never> {
    const existe = await this.prisma.pedido.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException(`Pedido ${id} no encontrado.`);
    throw new ConflictoVersionError(id);
  }

  async actualizarBultos(id: string, bultos: number, version: number): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version },
      data: { bultos, version: { increment: 1 } },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async marcarEnviado(id: string, datos: { simplirouteId: string; version: number }): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version: datos.version },
      data: {
        simplirouteId: datos.simplirouteId,
        estadoSimpliroute: "ENVIADO",
        estado: "COORDINADO",
        version: { increment: 1 },
      },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async marcarEtiquetaImpresa(id: string): Promise<void> {
    await this.prisma.pedido.update({ where: { id }, data: { etiquetaImpresaEn: new Date() } });
  }

  async listarPendientesDeSincronizar(): Promise<PedidoParaSincronizar[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estadoSimpliroute: "ENVIADO",
        estado: { in: ["COORDINADO", "EN_TRANSITO"] },
        simplirouteId: { not: null },
      },
      select: { id: true, simplirouteId: true, version: true },
    });
    return pedidos.map((p) => ({ id: p.id, simplirouteId: p.simplirouteId as string, version: p.version }));
  }

  async actualizarEstadoDesdeProveedor(
    id: string,
    datos: { estado: EstadoPedido; fechaEntregaEfectiva: Date | null; version: number },
  ): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version: datos.version },
      data: {
        estado: datos.estado,
        fechaEntregaEfectiva: datos.fechaEntregaEfectiva,
        version: { increment: 1 },
      },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }
}
