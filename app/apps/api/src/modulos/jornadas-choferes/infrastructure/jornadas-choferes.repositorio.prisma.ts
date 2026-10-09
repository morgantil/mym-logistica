import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { JornadaChofer } from "../domain/jornada-chofer";
import {
  DatosJornadaChofer,
  FiltroJornadasChofer,
  JornadasChoferesRepositorio,
} from "../domain/jornadas-choferes.repositorio";

function mapear(fila: {
  id: string;
  choferId: string;
  choferNombre: string;
  fecha: Date;
  horaInicio: string | null;
  horaFin: string | null;
  creadoEn: Date;
}): JornadaChofer {
  return {
    id: fila.id,
    choferId: fila.choferId,
    choferNombre: fila.choferNombre,
    fecha: fila.fecha,
    horaInicio: fila.horaInicio,
    horaFin: fila.horaFin,
    creadoEn: fila.creadoEn,
  };
}

@Injectable()
export class JornadasChoferesRepositorioPrisma implements JornadasChoferesRepositorio {
  constructor(private prisma: PrismaService) {}

  async guardar(datos: DatosJornadaChofer): Promise<JornadaChofer> {
    // `upsert` no pasa por el middleware de borrado lógico (solo intercepta
    // delete/deleteMany y las lecturas) — si antes se había borrado una
    // jornada de este mismo chofer+fecha, el `where` de abajo la encuentra
    // igual (coincide la constraint única) y hay que reactivarla a mano
    // (eliminadoEn: null), si no queda "guardada" pero invisible en listar().
    const guardada = await this.prisma.jornadaChofer.upsert({
      where: { choferId_fecha: { choferId: datos.choferId, fecha: datos.fecha } },
      create: datos,
      update: {
        choferNombre: datos.choferNombre,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
        eliminadoEn: null,
        eliminadoPorId: null,
      },
    });
    return mapear(guardada);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.jornadaChofer.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Jornada ${id} no encontrada.`);
    await this.prisma.jornadaChofer.delete({ where: { id } });
  }

  async listar(filtro: FiltroJornadasChofer): Promise<JornadaChofer[]> {
    const filas = await this.prisma.jornadaChofer.findMany({
      where: {
        ...(filtro.choferId ? { choferId: filtro.choferId } : {}),
        ...(filtro.fechaDesde || filtro.fechaHasta
          ? {
              fecha: {
                ...(filtro.fechaDesde ? { gte: filtro.fechaDesde } : {}),
                ...(filtro.fechaHasta ? { lt: filtro.fechaHasta } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ fecha: "desc" }, { choferNombre: "asc" }],
    });
    return filas.map(mapear);
  }
}
