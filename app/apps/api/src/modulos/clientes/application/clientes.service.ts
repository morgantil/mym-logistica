import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TipoServicioCliente } from "@mym/shared-types";
import { Cliente } from "../domain/cliente";
import {
  CLIENTES_REPOSITORIO,
  ClientesRepositorio,
  DatosActualizarCliente,
} from "../domain/clientes.repositorio";

@Injectable()
export class ClientesService {
  constructor(
    @Inject(CLIENTES_REPOSITORIO) private readonly repositorio: ClientesRepositorio,
  ) {}

  listarActivos(): Promise<Cliente[]> {
    return this.repositorio.listarActivos();
  }

  listarTodos(): Promise<Cliente[]> {
    return this.repositorio.listarTodos();
  }

  buscarPorId(id: string): Promise<Cliente | null> {
    return this.repositorio.buscarPorId(id);
  }

  crear(datos: { nombre: string; tipoServicio: TipoServicioCliente; facturaPorCordon?: boolean }): Promise<Cliente> {
    return this.repositorio.crear({
      ...datos,
      facturaPorCordon: datos.facturaPorCordon ?? false,
      // El remito preimpreso se configura después (pantalla Clientes, editar)
      // una vez que se consigue/confirma el papel real de ese cliente.
      formatoRemito: null,
      usaCarga3: false,
    });
  }

  // Decisión 2026-09-29: si se cambia el tipo de servicio, primero se
  // chequea que no quede configuración/histórico huérfano de lo que se
  // saca — mismo hallazgo que llevó a validar tarifas/montos/reglas/import
  // contra el tipo de servicio del cliente al crearlos.
  async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    if (datos.tipoServicio) {
      const actual = await this.repositorio.buscarPorId(id);
      if (!actual) throw new NotFoundException(`Cliente ${id} no encontrado.`);
      if (actual.tipoServicio !== datos.tipoServicio) {
        const hallazgos = await this.repositorio.buscarConfiguracionIncompatible(id, datos.tipoServicio);
        if (hallazgos.length > 0) {
          throw new BadRequestException(
            `No se puede cambiar el tipo de servicio de "${actual.nombre}": todavía tiene ${hallazgos.join(", ")}. Desactivá o borrá eso primero.`,
          );
        }
      }
    }
    return this.repositorio.actualizar(id, datos);
  }
}
