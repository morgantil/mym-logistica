import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Destinatario } from "../domain/destinatario";
import { DestinatariosRepositorio } from "../domain/destinatarios.repositorio";

@Injectable()
export class DestinatariosRepositorioPrisma implements DestinatariosRepositorio {
  constructor(private prisma: PrismaService) {}

  buscarPorClienteYAfiliado(clienteId: string, numeroAfiliado: string): Promise<Destinatario | null> {
    return this.prisma.destinatario.findUnique({
      where: { clienteId_numeroAfiliado: { clienteId, numeroAfiliado } },
    });
  }

  crear(datos: Omit<Destinatario, "id" | "simplirouteId">): Promise<Destinatario> {
    return this.prisma.destinatario.create({ data: datos });
  }

  actualizarDireccion(id: string, direccion: string): Promise<Destinatario> {
    return this.prisma.destinatario.update({ where: { id }, data: { direccion } });
  }
}
