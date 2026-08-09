import { Inject, Injectable } from "@nestjs/common";
import { Cliente, detectarClientePorNombreArchivo } from "../domain/cliente";
import { CLIENTES_REPOSITORIO, ClientesRepositorio } from "../domain/clientes.repositorio";

@Injectable()
export class ClientesService {
  constructor(
    @Inject(CLIENTES_REPOSITORIO) private readonly repositorio: ClientesRepositorio,
  ) {}

  listarActivos(): Promise<Cliente[]> {
    return this.repositorio.listarActivos();
  }

  buscarPorId(id: string): Promise<Cliente | null> {
    return this.repositorio.buscarPorId(id);
  }

  // Usado por el módulo de importadores al recibir un Excel — §5 funcional.
  // Devuelve null si no se pudo identificar ("Cliente sin identificar").
  async detectarDesdeNombreArchivo(nombreArchivo: string): Promise<Cliente | null> {
    const clientes = await this.repositorio.listarActivos();
    return detectarClientePorNombreArchivo(nombreArchivo, clientes);
  }

  crear(datos: { nombre: string; patronesDeteccion: string[] }): Promise<Cliente> {
    return this.repositorio.crear(datos);
  }
}
