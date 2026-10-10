import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TipoReporte } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { LimiteReporte } from "../domain/limite-reporte";
import { LimitesReporteRepositorio } from "../domain/limites-reporte.repositorio";

function mapear(fila: { reporte: unknown; maxDias: number; actualizadoEn: Date }): LimiteReporte {
  return {
    reporte: fila.reporte as TipoReporte,
    maxDias: fila.maxDias,
    actualizadoEn: fila.actualizadoEn,
  };
}

@Injectable()
export class LimitesReporteRepositorioPrisma implements LimitesReporteRepositorio {
  constructor(private prisma: PrismaService) {}

  async listar(): Promise<LimiteReporte[]> {
    const filas = await this.prisma.limiteReporte.findMany({ orderBy: { reporte: "asc" } });
    return filas.map(mapear);
  }

  async obtener(reporte: TipoReporte): Promise<LimiteReporte | null> {
    const fila = await this.prisma.limiteReporte.findUnique({
      where: { reporte: reporte as unknown as Prisma.LimiteReporteWhereUniqueInput["reporte"] },
    });
    return fila ? mapear(fila) : null;
  }

  async actualizar(reporte: TipoReporte, maxDias: number, actualizadoPorId: string): Promise<LimiteReporte> {
    const reporteTipado = reporte as unknown as Prisma.LimiteReporteWhereUniqueInput["reporte"];
    const fila = await this.prisma.limiteReporte.upsert({
      where: { reporte: reporteTipado },
      create: { reporte: reporteTipado!, maxDias, actualizadoPorId },
      update: { maxDias, actualizadoPorId },
    });
    return mapear(fila);
  }
}
