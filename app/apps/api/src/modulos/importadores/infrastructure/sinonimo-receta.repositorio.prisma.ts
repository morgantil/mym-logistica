import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosActualizarSinonimoReceta,
  DatosCrearSinonimoReceta,
  SinonimoReceta,
  SinonimoRecetaRepositorio,
} from "../domain/sinonimo-receta.repositorio";

function mapear(fila: { id: string; valorOrigen: string; valorCanonico: string }): SinonimoReceta {
  return { id: fila.id, valorOrigen: fila.valorOrigen, valorCanonico: fila.valorCanonico };
}

@Injectable()
export class SinonimoRecetaRepositorioPrisma implements SinonimoRecetaRepositorio {
  constructor(private prisma: PrismaService) {}

  listar(): Promise<SinonimoReceta[]> {
    return this.prisma.sinonimoReceta
      .findMany({ where: { eliminadoEn: null }, orderBy: { valorOrigen: "asc" } })
      .then((filas) => filas.map(mapear));
  }

  async resolver(valorOrigenNormalizado: string): Promise<SinonimoReceta | null> {
    const fila = await this.prisma.sinonimoReceta.findFirst({
      where: { valorOrigen: valorOrigenNormalizado, eliminadoEn: null },
    });
    return fila ? mapear(fila) : null;
  }

  async crear(datos: DatosCrearSinonimoReceta): Promise<SinonimoReceta> {
    const existente = await this.prisma.sinonimoReceta.findFirst({
      where: { valorOrigen: datos.valorOrigen, eliminadoEn: null },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya existe un sinónimo para "${datos.valorOrigen}" — editá el que ya está en vez de crear otro.`,
      );
    }
    const creado = await this.prisma.sinonimoReceta.create({
      data: {
        valorOrigen: datos.valorOrigen,
        valorCanonico: datos.valorCanonico,
        creadoPorId: datos.usuarioId,
      },
    });
    return mapear(creado);
  }

  async actualizar(id: string, datos: DatosActualizarSinonimoReceta): Promise<SinonimoReceta> {
    const existente = await this.prisma.sinonimoReceta.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Sinónimo de receta ${id} no encontrado.`);
    const actualizado = await this.prisma.sinonimoReceta.update({
      where: { id },
      data: { valorCanonico: datos.valorCanonico, actualizadoPorId: datos.usuarioId },
    });
    return mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.sinonimoReceta.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Sinónimo de receta ${id} no encontrado.`);
    await this.prisma.sinonimoReceta.update({ where: { id }, data: { eliminadoEn: new Date() } });
  }
}
