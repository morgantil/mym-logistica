import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ConflictoVersionError } from "../domain/conflicto-version.error";
import { Pedido } from "../domain/pedido";
import {
  DatosCrearPedido,
  FiltroPedidos,
  PaginaPedidos,
  PedidosRepositorio,
} from "../domain/pedidos.repositorio";

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
      }),
      this.prisma.pedido.count({ where }),
    ]);
    // Los enums generados por Prisma y los de @mym/shared-types tienen los mismos
    // valores string pero son tipos nominalmente distintos — cast intencional acá,
    // en el borde infra/dominio, para que el resto de la app dependa del tipo
    // agnóstico de framework (Pedido de domain/pedido.ts).
    return { datos: datos as unknown as Pedido[], total };
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
        cabaProvincia: datos.cabaProvincia as unknown as Prisma.PedidoCreateInput["cabaProvincia"],
        fechaProgramada: datos.fechaProgramada,
        tipoServicio: datos.tipoServicio as unknown as Prisma.PedidoCreateInput["tipoServicio"],
        observaciones: datos.observaciones,
        zonaId: datos.zonaId,
        choferId: datos.choferId,
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

  async listarPendientesDeEnvio(clienteIds?: string[]): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estado: "SIN_ASIGNAR",
        ...(clienteIds ? { clienteId: { in: clienteIds } } : {}),
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
}
