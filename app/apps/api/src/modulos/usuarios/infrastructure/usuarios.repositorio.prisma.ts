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

  buscarPorGoogleId(googleId: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { googleId } });
  }

  crear(datos: {
    email: string;
    nombre: string;
    passwordHash?: string | null;
    googleId?: string | null;
    roles: Usuario["roles"];
  }): Promise<Usuario> {
    return this.prisma.usuario.create({ data: datos });
  }

  actualizarGoogleId(usuarioId: string, googleId: string): Promise<Usuario> {
    return this.prisma.usuario.update({ where: { id: usuarioId }, data: { googleId } });
  }
}
