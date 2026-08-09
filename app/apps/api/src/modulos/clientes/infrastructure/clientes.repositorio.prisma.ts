import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Cliente } from "../domain/cliente";
import { ClientesRepositorio } from "../domain/clientes.repositorio";

@Injectable()
export class ClientesRepositorioPrisma implements ClientesRepositorio {
  constructor(private prisma: PrismaService) {}

  listarActivos(): Promise<Cliente[]> {
    return this.prisma.cliente.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  }

  buscarPorId(id: string): Promise<Cliente | null> {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente> {
    return this.prisma.cliente.create({ data: datos });
  }
}
