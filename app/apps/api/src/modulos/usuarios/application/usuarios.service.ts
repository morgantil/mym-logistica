import { Inject, Injectable } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Usuario, UsuarioSinCredenciales } from "../domain/usuario";
import { USUARIOS_REPOSITORIO, UsuariosRepositorio } from "../domain/usuarios.repositorio";

function sinCredenciales(usuario: Usuario): UsuarioSinCredenciales {
  const { passwordHash: _passwordHash, ...resto } = usuario;
  return resto;
}

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORIO) private readonly repositorio: UsuariosRepositorio,
  ) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repositorio.buscarPorEmail(email);
  }

  async buscarPorId(id: string): Promise<UsuarioSinCredenciales | null> {
    const usuario = await this.repositorio.buscarPorId(id);
    return usuario ? sinCredenciales(usuario) : null;
  }

  async buscarOCrearPorGoogle(perfil: {
    googleId: string;
    email: string;
    nombre: string;
  }): Promise<Usuario> {
    const existentePorGoogleId = await this.repositorio.buscarPorGoogleId(perfil.googleId);
    if (existentePorGoogleId) {
      return existentePorGoogleId;
    }

    const existentePorEmail = await this.repositorio.buscarPorEmail(perfil.email);
    if (existentePorEmail) {
      // Ya existía con login propio — vinculamos la cuenta de Google, no duplicamos usuario.
      return this.repositorio.actualizarGoogleId(existentePorEmail.id, perfil.googleId);
    }

    // Usuario nuevo vía Google: sin rol todavía — un admin se lo asigna (ver §33 funcional).
    return this.repositorio.crear({
      email: perfil.email,
      nombre: perfil.nombre,
      googleId: perfil.googleId,
      roles: [] as Rol[],
    });
  }
}
