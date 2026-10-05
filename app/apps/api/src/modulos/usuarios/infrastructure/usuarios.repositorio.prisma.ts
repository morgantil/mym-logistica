import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Usuario } from "../domain/usuario";
import { UsuariosRepositorio } from "../domain/usuarios.repositorio";

@Injectable()
export class UsuariosRepositorioPrisma implements UsuariosRepositorio {
  constructor(private prisma: PrismaService) {}

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  crear(datos: {
    email: string;
    nombre: string;
    passwordHash?: string | null;
    roles: Usuario["roles"];
  }): Promise<Usuario> {
    return this.prisma.usuario.create({ data: datos });
  }

  listar(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({ orderBy: { nombre: "asc" } });
  }

  actualizar(
    id: string,
    datos: Partial<
      Pick<
        Usuario,
        "nombre" | "roles" | "activo" | "passwordHash" | "columnasFijasPedidos" | "pantallasPermitidas"
      >
    >,
  ): Promise<Usuario> {
    return this.prisma.usuario.update({ where: { id }, data: datos });
  }

  async clientesPermitidosDe(usuarioId: string): Promise<string[]> {
    const asignaciones = await this.prisma.usuarioCliente.findMany({
      where: { usuarioId },
      select: { clienteId: true },
    });
    return asignaciones.map((a) => a.clienteId);
  }

  async asignarClientesPermitidos(usuarioId: string, clienteIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.usuarioCliente.deleteMany({ where: { usuarioId } }),
      this.prisma.usuarioCliente.createMany({
        data: clienteIds.map((clienteId) => ({ usuarioId, clienteId })),
      }),
    ]);
  }
}
