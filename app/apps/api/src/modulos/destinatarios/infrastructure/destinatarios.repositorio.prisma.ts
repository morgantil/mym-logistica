import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Destinatario } from "../domain/destinatario";
import { DatosSimpliRoute, DestinatariosRepositorio } from "../domain/destinatarios.repositorio";

@Injectable()
export class DestinatariosRepositorioPrisma implements DestinatariosRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Destinatario | null> {
    const encontrado = await this.prisma.destinatario.findUnique({ where: { id } });
    return encontrado as unknown as Destinatario | null;
  }

  async buscarPorClienteYAfiliado(
    clienteId: string,
    numeroAfiliado: string,
  ): Promise<Destinatario | null> {
    const encontrado = await this.prisma.destinatario.findUnique({
      where: { clienteId_numeroAfiliado: { clienteId, numeroAfiliado } },
    });
    // Prisma devuelve Decimal para latitud/longitud; el dominio usa number|null —
    // mismo criterio que en pedidos.repositorio.prisma.ts: cast en el borde infra/dominio.
    return encontrado as unknown as Destinatario | null;
  }

  async crear(
    datos: Omit<Destinatario, "id" | "simplirouteId" | "latitud" | "longitud">,
  ): Promise<Destinatario> {
    const creado = await this.prisma.destinatario.create({ data: datos });
    return creado as unknown as Destinatario;
  }

  async actualizarDireccion(id: string, direccion: string): Promise<Destinatario> {
    const actualizado = await this.prisma.destinatario.update({ where: { id }, data: { direccion } });
    return actualizado as unknown as Destinatario;
  }

  async actualizarDatosSimpliRoute(id: string, datos: DatosSimpliRoute): Promise<Destinatario> {
    const actualizado = await this.prisma.destinatario.update({
      where: { id },
      data: {
        simplirouteId: datos.simplirouteId,
        latitud: datos.latitud,
        longitud: datos.longitud,
      },
    });
    return actualizado as unknown as Destinatario;
  }
}
