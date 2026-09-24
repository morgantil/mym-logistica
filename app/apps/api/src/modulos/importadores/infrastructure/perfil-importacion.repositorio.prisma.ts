import { Injectable } from "@nestjs/common";
import { $Enums, Prisma } from "@prisma/client";
import { TipoServicio } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { MapeoColumnas } from "../domain/campo-canonico";
import { PerfilGuardado, PerfilImportacionRepositorio } from "../domain/perfil-importacion.repositorio";

@Injectable()
export class PerfilImportacionRepositorioPrisma implements PerfilImportacionRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarPorCliente(clienteId: string, tipoServicio: TipoServicio): Promise<PerfilGuardado | null> {
    const tipoServicioPrisma = tipoServicio as unknown as $Enums.TipoServicio;
    const perfil = await this.prisma.perfilImportacion.findUnique({
      where: { clienteId_tipoServicio: { clienteId, tipoServicio: tipoServicioPrisma } },
    });
    return perfil ? { mapeo: perfil.mapeoColumnas as MapeoColumnas, nombreHoja: perfil.nombreHoja } : null;
  }

  async guardar(
    clienteId: string,
    tipoServicio: TipoServicio,
    mapeo: MapeoColumnas,
    usuarioId: string | null,
    nombreHoja?: string | null,
  ): Promise<void> {
    const tipoServicioPrisma = tipoServicio as unknown as $Enums.TipoServicio;
    await this.prisma.perfilImportacion.upsert({
      where: { clienteId_tipoServicio: { clienteId, tipoServicio: tipoServicioPrisma } },
      create: {
        clienteId,
        tipoServicio: tipoServicioPrisma,
        mapeoColumnas: mapeo as Prisma.InputJsonValue,
        nombreHoja: nombreHoja ?? null,
        creadoPorId: usuarioId,
      },
      update: {
        mapeoColumnas: mapeo as Prisma.InputJsonValue,
        // undefined = no tocar la hoja que ya tenía guardada.
        ...(nombreHoja !== undefined ? { nombreHoja } : {}),
        actualizadoPorId: usuarioId,
      },
    });
  }

  async actualizarNombreHoja(
    clienteId: string,
    tipoServicio: TipoServicio,
    nombreHoja: string | null,
    usuarioId: string | null,
  ): Promise<void> {
    const tipoServicioPrisma = tipoServicio as unknown as $Enums.TipoServicio;
    await this.prisma.perfilImportacion.update({
      where: { clienteId_tipoServicio: { clienteId, tipoServicio: tipoServicioPrisma } },
      data: { nombreHoja, actualizadoPorId: usuarioId },
    });
  }
}
