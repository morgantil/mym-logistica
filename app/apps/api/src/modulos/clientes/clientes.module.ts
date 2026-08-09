import { Module } from "@nestjs/common";
import { CLIENTES_REPOSITORIO } from "./domain/clientes.repositorio";
import { ClientesRepositorioPrisma } from "./infrastructure/clientes.repositorio.prisma";
import { ClientesService } from "./application/clientes.service";
import { ClientesController } from "./interface/clientes.controller";

@Module({
  controllers: [ClientesController],
  providers: [
    ClientesService,
    { provide: CLIENTES_REPOSITORIO, useClass: ClientesRepositorioPrisma },
  ],
  exports: [ClientesService],
})
export class ClientesModule {}
