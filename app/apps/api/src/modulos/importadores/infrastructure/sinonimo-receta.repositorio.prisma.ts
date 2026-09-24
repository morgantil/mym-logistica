import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SinonimoReceta as FilaSinonimo } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosActualizarSinonimoReceta,
  DatosCrearSinonimoReceta,
  SinonimoReceta,
  SinonimoRecetaRepositorio,
} from "../domain/sinonimo-receta.repositorio";
import { coincideTexto } from "../domain/reglas-importacion";

function mapear(fila: FilaSinonimo): SinonimoReceta {
  return {
    id: fila.id,
    valorOrigen: fila.valorOrigen,
    valorCanonico: fila.valorCanonico,
    tipoCoincidencia: fila.tipoCoincidencia,
    orden: fila.orden,
  };
}

@Injectable()
export class SinonimoRecetaRepositorioPrisma implements SinonimoRecetaRepositorio {
  constructor(private prisma: PrismaService) {}

  listar(): Promise<SinonimoReceta[]> {
    return this.prisma.sinonimoReceta
      .findMany({ where: { eliminadoEn: null }, orderBy: [{ orden: "asc" }, { valorOrigen: "asc" }] })
      .then((filas) => filas.map(mapear));
  }

  async resolver(valorNormalizado: string): Promise<SinonimoReceta | null> {
    const filas = await this.prisma.sinonimoReceta.findMany({ where: { eliminadoEn: null } });
    const candidatos = filas
      .filter((fila) => coincideTexto(valorNormalizado, fila.tipoCoincidencia, fila.valorOrigen))
      .sort((a, b) => a.orden - b.orden || b.valorOrigen.length - a.valorOrigen.length);
    return candidatos.length > 0 ? mapear(candidatos[0]) : null;
  }

  async crear(datos: DatosCrearSinonimoReceta): Promise<SinonimoReceta> {
    // Incluye los borrados: la clave única (valorOrigen + tipo) también los
    // cuenta, así que un sinónimo borrado antes se reactiva en vez de chocar.
    const existente = await this.prisma.sinonimoReceta.findFirst({
      where: { valorOrigen: datos.valorOrigen, tipoCoincidencia: datos.tipoCoincidencia },
    });
    if (existente && existente.eliminadoEn === null) {
      throw new BadRequestException(
        `Ya existe una regla igual para "${datos.valorOrigen}" — editá la que ya está en vez de crear otra.`,
      );
    }
    if (existente) {
      const reactivado = await this.prisma.sinonimoReceta.update({
        where: { id: existente.id },
        data: {
          eliminadoEn: null,
          valorCanonico: datos.valorCanonico,
          orden: datos.orden,
          actualizadoPorId: datos.usuarioId,
        },
      });
      return mapear(reactivado);
    }
    const creado = await this.prisma.sinonimoReceta.create({
      data: {
        valorOrigen: datos.valorOrigen,
        valorCanonico: datos.valorCanonico,
        tipoCoincidencia: datos.tipoCoincidencia,
        orden: datos.orden,
        creadoPorId: datos.usuarioId,
      },
    });
    return mapear(creado);
  }

  async actualizar(id: string, datos: DatosActualizarSinonimoReceta): Promise<SinonimoReceta> {
    const existente = await this.prisma.sinonimoReceta.findUnique({ where: { id } });
    if (!existente || existente.eliminadoEn) throw new NotFoundException(`Sinónimo de receta ${id} no encontrado.`);
    const actualizado = await this.prisma.sinonimoReceta.update({
      where: { id },
      data: {
        valorCanonico: datos.valorCanonico,
        ...(datos.tipoCoincidencia !== undefined ? { tipoCoincidencia: datos.tipoCoincidencia } : {}),
        ...(datos.orden !== undefined ? { orden: datos.orden } : {}),
        actualizadoPorId: datos.usuarioId,
      },
    });
    return mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.sinonimoReceta.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Sinónimo de receta ${id} no encontrado.`);
    await this.prisma.sinonimoReceta.update({ where: { id }, data: { eliminadoEn: new Date() } });
  }
}
