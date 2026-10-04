import { randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { Rol } from "@prisma/client";
import { Usuario, UsuarioSinCredenciales } from "../domain/usuario";
import { USUARIOS_REPOSITORIO, UsuariosRepositorio } from "../domain/usuarios.repositorio";

function sinCredenciales(usuario: Usuario): UsuarioSinCredenciales {
  const { passwordHash: _passwordHash, ...resto } = usuario;
  return resto;
}

export interface UsuarioListado extends UsuarioSinCredenciales {
  clientesPermitidosIds: string[];
}

// Password temporal legible (sin caracteres ambiguos 0/O/1/l/I) — se muestra
// una sola vez en pantalla al crear el usuario o resetear su contraseña; no
// se guarda en texto plano en ningún lado.
function generarPasswordTemporal(): string {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
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

  // --- Administración de usuarios (pantalla "Usuarios", rol Administración) ---
  // Agregado 2026-08-26: hasta acá el único alta posible era vía Google o
  // directo en la base — necesario para poder sacar Google del login sin
  // quedarse sin forma de dar de alta gente.

  async listar(): Promise<UsuarioListado[]> {
    const usuarios = await this.repositorio.listar();
    return Promise.all(
      usuarios.map(async (usuario) => ({
        ...sinCredenciales(usuario),
        clientesPermitidosIds: await this.repositorio.clientesPermitidosDe(usuario.id),
      })),
    );
  }

  // Devuelve la contraseña temporal en texto plano UNA vez — el llamador
  // (controller) es responsable de que solo se muestre en esta respuesta y
  // no se persista en ningún lado más que el hash.
  async crear(datos: {
    email: string;
    nombre: string;
    roles: Rol[];
    clienteIds: string[];
  }): Promise<{ usuario: UsuarioSinCredenciales; passwordTemporal: string }> {
    const existente = await this.repositorio.buscarPorEmail(datos.email);
    if (existente) {
      throw new ConflictException(`Ya existe un usuario con el email ${datos.email}.`);
    }

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await argon2.hash(passwordTemporal);

    const creado = await this.repositorio.crear({
      email: datos.email,
      nombre: datos.nombre,
      passwordHash,
      roles: datos.roles,
    });

    if (datos.clienteIds.length > 0) {
      await this.repositorio.asignarClientesPermitidos(creado.id, datos.clienteIds);
    }

    return { usuario: sinCredenciales(creado), passwordTemporal };
  }

  async actualizar(
    id: string,
    usuarioActualId: string,
    datos: { nombre?: string; roles?: Rol[]; activo?: boolean; columnasFijasPedidos?: string[] },
  ): Promise<UsuarioSinCredenciales> {
    const usuario = await this.repositorio.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    }

    // Evita el auto-bloqueo más común: un admin desactivándose a sí mismo
    // (o sacándose el único rol Administración) sin querer y quedando afuera
    // del sistema sin nadie que lo pueda reactivar.
    if (id === usuarioActualId) {
      if (datos.activo === false) {
        throw new BadRequestException("No podés desactivar tu propio usuario.");
      }
      if (datos.roles && !datos.roles.includes(Rol.ADMINISTRACION) && usuario.roles.includes(Rol.ADMINISTRACION)) {
        throw new BadRequestException("No podés quitarte a vos mismo el rol Administración.");
      }
    }

    const actualizado = await this.repositorio.actualizar(id, datos);
    return sinCredenciales(actualizado);
  }

  async resetearPassword(id: string): Promise<{ passwordTemporal: string }> {
    const usuario = await this.repositorio.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    }

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await argon2.hash(passwordTemporal);
    await this.repositorio.actualizar(id, { passwordHash });

    return { passwordTemporal };
  }

  async actualizarClientesPermitidos(id: string, clienteIds: string[]): Promise<void> {
    const usuario = await this.repositorio.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    }
    await this.repositorio.asignarClientesPermitidos(id, clienteIds);
  }
}
