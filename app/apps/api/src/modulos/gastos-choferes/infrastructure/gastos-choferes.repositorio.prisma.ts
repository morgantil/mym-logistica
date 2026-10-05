import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { GastoChofer } from "../domain/gasto-chofer";
import {
  DatosCrearGastoChofer,
  FiltroGastosChofer,
  GastosChoferesRepositorio,
} from "../domain/gastos-choferes.repositorio";

function mapear(fila: {
  id: string;
  tipo: unknown;
  fecha: Date;
  monto: Prisma.Decimal;
  choferId: string | null;
  choferNombre: string | null;
  choferNombreOriginal: string;
  proveedor: string | null;
  comprobante: string | null;
  archivoOrigen: string;
  creadoEn: Date;
}): GastoChofer {
  return {
    id: fila.id,
    tipo: fila.tipo as GastoChofer["tipo"],
    fecha: fila.fecha,
    monto: Number(fila.monto),
    choferId: fila.choferId,
    choferNombre: fila.choferNombre,
    choferNombreOriginal: fila.choferNombreOriginal,
    proveedor: fila.proveedor,
    comprobante: fila.comprobante,
    archivoOrigen: fila.archivoOrigen,
    creadoEn: fila.creadoEn,
  };
}

@Injectable()
export class GastosChoferesRepositorioPrisma implements GastosChoferesRepositorio {
  constructor(private prisma: PrismaService) {}

  async crearVarios(datos: DatosCrearGastoChofer[]): Promise<number> {
    if (datos.length === 0) return 0;
    const resultado = await this.prisma.gastoChofer.createMany({
      data: datos.map((dato) => ({
        ...dato,
        tipo: dato.tipo as unknown as Prisma.GastoChoferCreateManyInput["tipo"],
      })),
    });
    return resultado.count;
  }

  async listar(filtro: FiltroGastosChofer): Promise<GastoChofer[]> {
    const filas = await this.prisma.gastoChofer.findMany({
      where: {
        ...(filtro.tipo ? { tipo: filtro.tipo as unknown as Prisma.EnumTipoGastoChoferFilter } : {}),
        ...(filtro.choferId ? { choferId: filtro.choferId } : {}),
        ...(filtro.soloSinAsignar ? { choferId: null } : {}),
        ...(filtro.fechaDesde || filtro.fechaHasta
          ? {
              fecha: {
                ...(filtro.fechaDesde ? { gte: filtro.fechaDesde } : {}),
                ...(filtro.fechaHasta ? { lt: filtro.fechaHasta } : {}),
              },
            }
          : {}),
      },
      orderBy: { fecha: "desc" },
    });
    return filas.map(mapear);
  }

  async buscarPorId(id: string): Promise<GastoChofer | null> {
    const fila = await this.prisma.gastoChofer.findUnique({ where: { id } });
    return fila ? mapear(fila) : null;
  }

  async asignarChofer(id: string, choferId: string, choferNombre: string): Promise<GastoChofer> {
    const existente = await this.prisma.gastoChofer.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Gasto ${id} no encontrado.`);
    const actualizado = await this.prisma.gastoChofer.update({
      where: { id },
      data: { choferId, choferNombre },
    });
    return mapear(actualizado);
  }
}
