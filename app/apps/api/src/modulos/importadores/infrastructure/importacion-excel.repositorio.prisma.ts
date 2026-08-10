import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ImportacionExcelRepositorio } from "../domain/importacion-excel.repositorio";

@Injectable()
export class ImportacionExcelRepositorioPrisma implements ImportacionExcelRepositorio {
  constructor(private prisma: PrismaService) {}

  async crear(datos: {
    clienteId: string;
    nombreArchivo: string;
    usuarioId: string;
  }): Promise<{ id: string }> {
    const creada = await this.prisma.importacionExcel.create({
      data: {
        clienteId: datos.clienteId,
        nombreArchivo: datos.nombreArchivo,
        usuarioId: datos.usuarioId,
      },
    });
    return { id: creada.id };
  }

  async actualizarEstado(
    id: string,
    datos: { estado: string; totalFilas: number; filasConError: number },
  ): Promise<void> {
    await this.prisma.importacionExcel.update({
      where: { id },
      data: {
        estado: datos.estado as unknown as Prisma.ImportacionExcelUpdateInput["estado"],
        totalFilas: datos.totalFilas,
        filasConError: datos.filasConError,
      },
    });
  }
}
