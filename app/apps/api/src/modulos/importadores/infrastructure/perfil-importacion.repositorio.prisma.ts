import { Injectable } from "@nestjs/common";
import { $Enums, Prisma } from "@prisma/client";
import { TipoServicio } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { MapeoColumnas } from "../domain/campo-canonico";
import { PerfilImportacionRepositorio } from "../domain/perfil-importacion.repositorio";

@Injectable()
export class PerfilImportacionRepositorioPrisma implements PerfilImportacionRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarPorCliente(clienteId: string, tipoServicio: TipoServicio): Promise<MapeoColumnas | null> {
    const tipoServicioPrisma = tipoServicio as unknown as $Enums.TipoServicio;
    const perfil = await this.prisma.perfilImportacion.findUnique({
      where: { clienteId_tipoServicio: { clienteId, tipoServicio: tipoServicioPrisma } },
    });
    return (perfil?.mapeoColumnas as MapeoColumnas) ?? null;
  }

  async guardar(
    clienteId: string,
    tipoServicio: TipoServicio,
    mapeo: MapeoColumnas,
    usuarioId: string | null,
  ): Promise<void> {
    const tipoServicioPrisma = tipoServicio as unknown as $Enums.TipoServicio;
    await this.prisma.perfilImportacion.upsert({
      where: { clienteId_tipoServicio: { clienteId, tipoServicio: tipoServicioPrisma } },
      create: {
        clienteId,
        tipoServicio: tipoServicioPrisma,
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
