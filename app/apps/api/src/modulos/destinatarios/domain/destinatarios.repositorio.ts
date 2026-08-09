import { Destinatario } from "./destinatario";

export interface DestinatariosRepositorio {
  buscarPorClienteYAfiliado(clienteId: string, numeroAfiliado: string): Promise<Destinatario | null>;
  crear(datos: Omit<Destinatario, "id" | "simplirouteId">): Promise<Destinatario>;
  actualizarDireccion(id: string, direccion: string): Promise<Destinatario>;
}

export const DESTINATARIOS_REPOSITORIO = Symbol("DESTINATARIOS_REPOSITORIO");
