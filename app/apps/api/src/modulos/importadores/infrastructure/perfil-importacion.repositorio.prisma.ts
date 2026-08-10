import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { MapeoColumnas } from "../domain/campo-canonico";
import { PerfilImportacionRepositorio } from "../domain/perfil-importacion.repositorio";

@Injectable()
export class PerfilImportacionRepositorioPrisma implements PerfilImportacionRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarPorCliente(clienteId: string): Promise<MapeoColumnas | null> {
    const perfil = await this.prisma.perfilImportacion.findUnique({ where: { clienteId } });
    return (perfil?.mapeoColumnas as MapeoColumnas) ?? null;
  }

  async guardar(clienteId: string, mapeo: MapeoColumnas, usuarioId: string | null): Promise<void> {
    await this.prisma.perfilImportacion.upsert({
      where: { clienteId },
      create: {
        clienteId,
        mapeoColumnas: mapeo as Prisma.InputJsonValue,
        creadoPorId: usuarioId,
      },
      update: {
        mapeoColumnas: mapeo as Prisma.InputJsonValue,
        actualizadoPorId: usuarioId,
      },
    });
  }
}
