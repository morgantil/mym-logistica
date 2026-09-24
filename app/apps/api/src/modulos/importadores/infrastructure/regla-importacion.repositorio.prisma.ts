import { Injectable, NotFoundException } from "@nestjs/common";
import { $Enums, ReglaImportacion as FilaRegla } from "@prisma/client";
import { TipoServicio } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosReglaImportacion,
  ReglaImportacionGuardada,
  ReglaImportacionRepositorio,
} from "../domain/regla-importacion.repositorio";
import { ReglaImportacion } from "../domain/reglas-importacion";

function mapear(fila: FilaRegla): ReglaImportacionGuardada {
  return {
    id: fila.id,
    clienteId: fila.clienteId,
    tipoServicio: fila.tipoServicio as unknown as TipoServicio,
    campoOrigen: fila.campoOrigen as ReglaImportacion["campoOrigen"],
    tipoCoincidencia: fila.tipoCoincidencia,
    valor: fila.valor,
    accion: fila.accion as ReglaImportacion["accion"],
    campoDestino: fila.campoDestino as ReglaImportacion["campoDestino"],
    valorDestino: fila.valorDestino,
    orden: fila.orden,
    activa: fila.activa,
  };
}

@Injectable()
export class ReglaImportacionRepositorioPrisma implements ReglaImportacionRepositorio {
  constructor(private prisma: PrismaService) {}

  async listar(filtro: { clienteId?: string; tipoServicio?: TipoServicio }): Promise<ReglaImportacionGuardada[]> {
    const filas = await this.prisma.reglaImportacion.findMany({
      where: {
        eliminadoEn: null,
        ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
        ...(filtro.tipoServicio ? { tipoServicio: filtro.tipoServicio as unknown as $Enums.TipoServicio } : {}),
      },
      orderBy: [{ clienteId: "asc" }, { tipoServicio: "asc" }, { orden: "asc" }, { creadoEn: "asc" }],
    });
    return filas.map(mapear);
  }

  async listarActivas(clienteId: string, tipoServicio: TipoServicio): Promise<ReglaImportacion[]> {
    const filas = await this.prisma.reglaImportacion.findMany({
      where: {
        clienteId,
        tipoServicio: tipoServicio as unknown as $Enums.TipoServicio,
        activa: true,
        eliminadoEn: null,
      },
      orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
    });
    return filas.map(mapear);
  }

  async crear(datos: DatosReglaImportacion, usuarioId: string): Promise<ReglaImportacionGuardada> {
    const fila = await this.prisma.reglaImportacion.create({
      data: {
        ...datos,
        tipoServicio: datos.tipoServicio as unknown as $Enums.TipoServicio,
        creadoPorId: usuarioId,
      },
    });
    return mapear(fila);
  }

  async actualizar(id: string, datos: DatosReglaImportacion, usuarioId: string): Promise<ReglaImportacionGuardada> {
    const existente = await this.prisma.reglaImportacion.findFirst({ where: { id, eliminadoEn: null } });
    if (!existente) throw new NotFoundException(`Regla de importación ${id} no encontrada.`);
    const fila = await this.prisma.reglaImportacion.update({
      where: { id },
      data: {
        ...datos,
        tipoServicio: datos.tipoServicio as unknown as $Enums.TipoServicio,
        actualizadoPorId: usuarioId,
      },
    });
    return mapear(fila);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.reglaImportacion.findFirst({ where: { id, eliminadoEn: null } });
    if (!existente) throw new NotFoundException(`Regla de importación ${id} no encontrada.`);
    await this.prisma.reglaImportacion.update({ where: { id }, data: { eliminadoEn: new Date() } });
  }
}
