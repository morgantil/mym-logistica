import { Injectable } from "@nestjs/common";
import { obtenerUsuarioActual } from "../../../common/contexto/contexto-solicitud";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Cliente } from "../domain/cliente";
import { ClientesRepositorio, DatosActualizarCliente } from "../domain/clientes.repositorio";

@Injectable()
export class ClientesRepositorioPrisma implements ClientesRepositorio {
  constructor(private prisma: PrismaService) {}

  listarActivos(): Promise<Cliente[]> {
    return this.prisma.cliente.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  }

  listarTodos(): Promise<Cliente[]> {
    return this.prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
  }

  buscarPorId(id: string): Promise<Cliente | null> {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente> {
    return this.prisma.cliente.create({ data: datos });
  }

  actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    return this.prisma.cliente.update({
      where: { id },
      data: { ...datos, actualizadoPorId: obtenerUsuarioActual()?.usuarioId ?? null },
    });
  }
}
