import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { EstadoGastoChofer } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { GastoChofer } from "../domain/gasto-chofer";
import {
  DatosActualizarGastoChofer,
  DatosCrearGastoChofer,
  FiltroGastosChofer,
  GastosChoferesRepositorio,
} from "../domain/gastos-choferes.repositorio";

function aNumeroONull(valor: Prisma.Decimal | null): number | null {
  return valor === null ? null : Number(valor);
}

function mapear(fila: {
  id: string;
  tipo: unknown;
  fecha: Date;
  monto: Prisma.Decimal;
  estado: unknown;
  choferId: string | null;
  choferNombre: string | null;
  choferNombreOriginal: string;
  proveedor: string | null;
  comprobante: string | null;
  archivoOrigen: string;
  creadoEn: Date;
  fechaRecepcion: Date | null;
  comprobanteCodigo: string | null;
  comprobanteTipo: string | null;
  comprobanteSucursal: string | null;
  comprobanteNumero: string | null;
  tipoDocumento: string | null;
  cuit: string | null;
  domicilio: string | null;
  codigoPostal: string | null;
  provincia: string | null;
  condicionFiscal: string | null;
  codigoNeto: string | null;
  netoGravado: Prisma.Decimal | null;
  alicuota: Prisma.Decimal | null;
  ivaLiquidado: Prisma.Decimal | null;
  ivaCredito: Prisma.Decimal | null;
  codigoNgEx: string | null;
  conceptosNgEx: Prisma.Decimal | null;
  codigoPR: string | null;
  percepcionRetencion: Prisma.Decimal | null;
  provinciaPR: string | null;
}): GastoChofer {
  return {
    id: fila.id,
    tipo: fila.tipo as GastoChofer["tipo"],
    fecha: fila.fecha,
    monto: Number(fila.monto),
    estado: fila.estado as GastoChofer["estado"],
    choferId: fila.choferId,
    choferNombre: fila.choferNombre,
    choferNombreOriginal: fila.choferNombreOriginal,
    proveedor: fila.proveedor,
    comprobante: fila.comprobante,
    archivoOrigen: fila.archivoOrigen,
    creadoEn: fila.creadoEn,
    fechaRecepcion: fila.fechaRecepcion,
    comprobanteCodigo: fila.comprobanteCodigo,
    comprobanteTipo: fila.comprobanteTipo,
    comprobanteSucursal: fila.comprobanteSucursal,
    comprobanteNumero: fila.comprobanteNumero,
    tipoDocumento: fila.tipoDocumento,
    cuit: fila.cuit,
    domicilio: fila.domicilio,
    codigoPostal: fila.codigoPostal,
    provincia: fila.provincia,
    condicionFiscal: fila.condicionFiscal,
    codigoNeto: fila.codigoNeto,
    netoGravado: aNumeroONull(fila.netoGravado),
    alicuota: aNumeroONull(fila.alicuota),
    ivaLiquidado: aNumeroONull(fila.ivaLiquidado),
    ivaCredito: aNumeroONull(fila.ivaCredito),
    codigoNgEx: fila.codigoNgEx,
    conceptosNgEx: aNumeroONull(fila.conceptosNgEx),
    codigoPR: fila.codigoPR,
    percepcionRetencion: aNumeroONull(fila.percepcionRetencion),
    provinciaPR: fila.provinciaPR,
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

  async crear(datos: DatosCrearGastoChofer): Promise<GastoChofer> {
    const creado = await this.prisma.gastoChofer.create({
      data: { ...datos, tipo: datos.tipo as unknown as Prisma.GastoChoferCreateInput["tipo"] },
    });
    return mapear(creado);
  }

  async actualizar(id: string, datos: DatosActualizarGastoChofer): Promise<GastoChofer> {
    const existente = await this.prisma.gastoChofer.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Gasto ${id} no encontrado.`);
    const actualizado = await this.prisma.gastoChofer.update({
      where: { id },
      data: { ...datos, tipo: datos.tipo as unknown as Prisma.GastoChoferUpdateInput["tipo"] },
    });
    return mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.gastoChofer.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Gasto ${id} no encontrado.`);
    // El middleware de borrado lógico reescribe esto como un update seteando
    // eliminadoEn — nunca borra la fila físicamente.
    await this.prisma.gastoChofer.delete({ where: { id } });
  }

  async listar(filtro: FiltroGastosChofer): Promise<GastoChofer[]> {
    const filas = await this.prisma.gastoChofer.findMany({
      where: {
        ...(filtro.tipo ? { tipo: filtro.tipo as unknown as Prisma.EnumTipoGastoChoferFilter } : {}),
        ...(filtro.estado ? { estado: filtro.estado as unknown as Prisma.EnumEstadoGastoChoferFilter } : {}),
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

  async cambiarEstado(id: string, estado: EstadoGastoChofer): Promise<GastoChofer> {
    const existente = await this.prisma.gastoChofer.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException(`Gasto ${id} no encontrado.`);
    const actualizado = await this.prisma.gastoChofer.update({
      where: { id },
      data: { estado: estado as unknown as Prisma.GastoChoferUpdateInput["estado"] },
    });
    return mapear(actualizado);
  }
}
