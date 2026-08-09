import { Global, Module } from "@nestjs/common";
import { PermisosClienteService } from "./permisos-cliente.service";

@Global()
@Module({
  providers: [PermisosClienteService],
  exports: [PermisosClienteService],
})
export class PermisosModule {}
