import { Injectable, Logger } from "@nestjs/common";
import {
  ChoferProveedor,
  DatosChofer,
  DatosVehiculo,
  DestinatarioEnProveedor,
  LogisticaProviderPort,
  PedidoParaEnviar,
  ResultadoEnvio,
  VehiculoProveedor,
  ZonaProveedor,
} from "../domain/logistica-provider.port";

// Adapter mock: se usa mientras SIMPLIROUTE_MOCK=true (default hasta que se
// gestione el acceso real — DOCUMENTO TECNICO.md sección 4). No pega a ninguna
// red, simula respuestas plausibles para poder desarrollar y probar el resto
// del flujo (destinatarios, pedidos, estados, zonas/choferes/vehículos) sin
// quedar bloqueados.
@Injectable()
export class SimplirouteMockAdapter implements LogisticaProviderPort {
  private readonly logger = new Logger(SimplirouteMockAdapter.name);

  async buscarDestinatarioPorAfiliado(numeroAfiliado: string): Promise<DestinatarioEnProveedor | null> {
    this.logger.warn(
      `[MOCK] buscarDestinatarioPorAfiliado(${numeroAfiliado}) — sin API real configurada.`,
    );
    return null; // por defecto simula "No encontrado en SimpliRoute" (§10 funcional)
  }

  async enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoEnvio> {
    this.logger.warn(`[MOCK] enviarPedido(${pedido.pedidoId}) — sin API real configurada.`);
    return { idExterno: `mock-${pedido.pedidoId}` };
  }

  async consultarEstado(idExterno: string): Promise<string> {
    this.logger.warn(`[MOCK] consultarEstado(${idExterno}) — sin API real configurada.`);
    return "desconocido";
  }

  // Una zona de ejemplo con un polígono real (mismo formato que devuelve
  // SimpliRoute) para poder probar el point-in-polygon en desarrollo sin
  // pegarle a la cuenta real.
  async listarZonas(): Promise<ZonaProveedor[]> {
    this.logger.warn("[MOCK] listarZonas() — sin API real configurada, devolviendo zona de ejemplo.");
    return [
      {
        id: 1,
        nombre: "Zona de ejemplo (mock)",
        habilitada: true,
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        poligono: [
          { lat: -34.55, lng: -58.5 },
          { lat: -34.55, lng: -58.35 },
          { lat: -34.65, lng: -58.35 },
          { lat: -34.65, lng: -58.5 },
        ],
        vehiculosIds: [1],
      },
    ];
  }

  async listarChoferes(): Promise<ChoferProveedor[]> {
    this.logger.warn("[MOCK] listarChoferes() — sin API real configurada.");
    return [
      { id: 1, nombre: "Chofer de ejemplo (mock)", username: "mock-driver", telefono: null, email: null, activo: true },
    ];
  }

  async crearChofer(datos: DatosChofer): Promise<ChoferProveedor> {
    this.logger.warn(`[MOCK] crearChofer(${datos.nombre}) — sin API real configurada.`);
    return {
      id: Math.floor(Math.random() * 1_000_000),
      nombre: datos.nombre,
      username: datos.username,
      telefono: datos.telefono ?? null,
      email: datos.email ?? null,
      activo: true,
    };
  }

  async actualizarChofer(id: number, datos: DatosChofer): Promise<ChoferProveedor> {
    this.logger.warn(`[MOCK] actualizarChofer(${id}) — sin API real configurada.`);
    return {
      id,
      nombre: datos.nombre,
      username: datos.username,
      telefono: datos.telefono ?? null,
      email: datos.email ?? null,
      activo: true,
    };
  }

  async eliminarChofer(id: number): Promise<void> {
    this.logger.warn(`[MOCK] eliminarChofer(${id}) — sin API real configurada.`);
  }

  async listarVehiculos(): Promise<VehiculoProveedor[]> {
    this.logger.warn("[MOCK] listarVehiculos() — sin API real configurada.");
    return [{ id: 1, nombre: "Vehículo de ejemplo (mock)", patente: null, choferPredeterminadoId: 1, estado: "active" }];
  }

  async crearVehiculo(datos: DatosVehiculo): Promise<VehiculoProveedor> {
    this.logger.warn(`[MOCK] crearVehiculo(${datos.nombre}) — sin API real configurada.`);
    return {
      id: Math.floor(Math.random() * 1_000_000),
      nombre: datos.nombre,
      patente: datos.patente ?? null,
      choferPredeterminadoId: datos.choferPredeterminadoId ?? null,
      estado: "active",
    };
  }

  async actualizarVehiculo(id: number, datos: DatosVehiculo): Promise<VehiculoProveedor> {
    this.logger.warn(`[MOCK] actualizarVehiculo(${id}) — sin API real configurada.`);
    return {
      id,
      nombre: datos.nombre,
      patente: datos.patente ?? null,
      choferPredeterminadoId: datos.choferPredeterminadoId ?? null,
      estado: "active",
    };
  }

  async eliminarVehiculo(id: number): Promise<void> {
    this.logger.warn(`[MOCK] eliminarVehiculo(${id}) — sin API real configurada.`);
  }
}
