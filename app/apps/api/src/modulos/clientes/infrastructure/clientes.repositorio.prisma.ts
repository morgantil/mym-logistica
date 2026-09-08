import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { obtenerUsuarioActual } from "../../../common/contexto/contexto-solicitud";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Cliente } from "../domain/cliente";
import { ClientesRepositorio, DatosActualizarCliente } from "../domain/clientes.repositorio";

@Injectable()
export class ClientesRepositorioPrisma implements ClientesRepositorio {
  constructor(private prisma: PrismaService) {}

  async listarActivos(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
    return clientes as unknown as Cliente[];
  }

  async listarTodos(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
    return clientes as unknown as Cliente[];
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const encontrado = await this.prisma.cliente.findUnique({ where: { id } });
    return encontrado as unknown as Cliente | null;
  }

  async crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente> {
    const creado = await this.prisma.cliente.create({
      data: { ...datos, tipoServicio: datos.tipoServicio as unknown as Prisma.ClienteCreateInput["tipoServicio"] },
    });
    return creado as unknown as Cliente;
  }

  async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    const actualizado = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...datos,
        tipoServicio: datos.tipoServicio as unknown as Prisma.ClienteUpdateInput["tipoServicio"],
        actualizadoPorId: obtenerUsuarioActual()?.usuarioId ?? null,
      },
    });
    return actualizado as unknown as Cliente;
  }
}
