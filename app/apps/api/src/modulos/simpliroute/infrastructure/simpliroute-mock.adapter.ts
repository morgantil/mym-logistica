import { Injectable, Logger } from "@nestjs/common";
import {
  DestinatarioEnProveedor,
  LogisticaProviderPort,
  PedidoParaEnviar,
  ResultadoEnvio,
} from "../domain/logistica-provider.port";

// Adapter mock: se usa mientras SIMPLIROUTE_MOCK=true (default hasta que se
// gestione el acceso real — DOCUMENTO TECNICO.md sección 4). No pega a ninguna
// red, simula respuestas plausibles para poder desarrollar y probar el resto
// del flujo (destinatarios, pedidos, estados) sin quedar bloqueados.
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
}
