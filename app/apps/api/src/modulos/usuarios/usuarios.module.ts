import { Module } from "@nestjs/common";
import { USUARIOS_REPOSITORIO } from "./domain/usuarios.repositorio";
import { UsuariosRepositorioPrisma } from "./infrastructure/usuarios.repositorio.prisma";
import { UsuariosService } from "./application/usuarios.service";

@Module({
  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORIO, useClass: UsuariosRepositorioPrisma },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}
