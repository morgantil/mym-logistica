import { Destinatario } from "./destinatario";

export interface DatosSimpliRoute {
  simplirouteId: string;
  latitud: number | null;
  longitud: number | null;
}

export interface DestinatariosRepositorio {
  buscarPorId(id: string): Promise<Destinatario | null>;
  buscarPorClienteYAfiliado(clienteId: string, numeroAfiliado: string): Promise<Destinatario | null>;
  crear(
    datos: Omit<Destinatario, "id" | "simplirouteId" | "latitud" | "longitud">,
  ): Promise<Destinatario>;
  actualizarDireccion(id: string, direccion: string): Promise<Destinatario>;
  actualizarTelefono(id: string, telefono: string): Promise<Destinatario>;
  actualizarDatosSimpliRoute(id: string, datos: DatosSimpliRoute): Promise<Destinatario>;
}

export const DESTINATARIOS_REPOSITORIO = Symbol("DESTINATARIOS_REPOSITORIO");
