import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Pedido } from "../domain/pedido";
import {
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
}
