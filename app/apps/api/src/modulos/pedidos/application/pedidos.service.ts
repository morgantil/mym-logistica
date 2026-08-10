import { Inject, Injectable } from "@nestjs/common";
import { PermisosClienteService } from "../../../common/permisos/permisos-cliente.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { LOGISTICA_PROVIDER, LogisticaProviderPort } from "../../simpliroute/domain/logistica-provider.port";
import {
  DatosCrearPedido,
  FiltroPedidos,
  PEDIDOS_REPOSITORIO,
  PedidosRepositorio,
} from "../domain/pedidos.repositorio";
import { validarPedidoParaEnvio } from "../domain/validar-envio";

export interface PedidoConErrores {
  pedidoId: string;
  errores: string[];
}

export interface ResultadoEnvioMasivo {
  enviados: string[];
  errores: PedidoConErrores[];
}

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDOS_REPOSITORIO) private readonly repositorio: PedidosRepositorio,
    @Inject(LOGISTICA_PROVIDER) private readonly logisticaProvider: LogisticaProviderPort,
    private permisosCliente: PermisosClienteService,
    private destinatariosService: DestinatariosService,
  ) {}

  // La grilla principal (§14 funcional) siempre pasa por acá, así que el filtro de
  // "permisos por cliente" queda aplicado en un solo lugar para todo el sistema.
  async listarParaUsuario(
    usuarioId: string,
    filtro: Omit<FiltroPedidos, "clienteIds">,
    pagina: number,
    porPagina: number,
  ) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.listar(
      { ...filtro, clienteIds: clienteIds ?? undefined },
      pagina,
      porPagina,
    );
  }

  async contarPorEstadoParaUsuario(usuarioId: string) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.contarPorEstado(clienteIds ?? undefined);
  }

  // Usado por el módulo de importadores — un pedido nace siempre SIN_ASIGNAR
  // (estado por defecto en el schema) hasta que Etapa 2 (zona/chofer) lo procese.
  crear(datos: DatosCrearPedido) {
    return this.repositorio.crear(datos);
  }

  // §17 funcional: "Revisión antes de enviar" — trae los candidatos junto con
  // por qué NO se podrían enviar todavía (lista vacía = listo para enviar).
  async revisarPendientesDeEnvio(usuarioId: string) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    const pendientes = await this.repositorio.listarPendientesDeEnvio(clienteIds ?? undefined);
    return pendientes.map((pedido) => ({
      pedido,
      erroresBloqueantes: validarPedidoParaEnvio(pedido),
    }));
  }

  // §16 funcional: carga de bultos desde la grilla. Bloqueo optimista — ver
  // ConflictoVersionError, que el controller traduce a HTTP 409.
  async actualizarBultos(pedidoId: string, bultos: number, version: number) {
    return this.repositorio.actualizarBultos(pedidoId, bultos, version);
  }

  // §18 funcional: el usuario selecciona pedidos y el sistema intenta enviarlos.
  // Un pedido inválido o que falla NO frena a los demás — se acumulan errores
  // por pedido y se sigue con el resto.
  async enviarASimpliRoute(pedidoIds: string[]): Promise<ResultadoEnvioMasivo> {
    const resultado: ResultadoEnvioMasivo = { enviados: [], errores: [] };

    for (const pedidoId of pedidoIds) {
      const pedido = await this.repositorio.obtenerPorId(pedidoId);
      if (!pedido) {
        resultado.errores.push({ pedidoId, errores: ["Pedido no encontrado."] });
        continue;
      }

      const erroresValidacion = validarPedidoParaEnvio(pedido);
      if (erroresValidacion.length > 0) {
        resultado.errores.push({ pedidoId, errores: erroresValidacion });
        continue;
      }

      const destinatario = await this.destinatariosService.buscarPorId(pedido.destinatarioId);
      if (!destinatario?.simplirouteId) {
        resultado.errores.push({
          pedidoId,
          errores: ["El destinatario no tiene identificador de SimpliRoute."],
        });
        continue;
      }

      try {
        const envio = await this.logisticaProvider.enviarPedido({
          pedidoId: pedido.id,
          destinatarioIdExterno: destinatario.simplirouteId,
          direccion: pedido.direccionUsada,
          fechaProgramada: pedido.fechaProgramada,
          bultos: pedido.bultos,
          observaciones: null,
        });
        await this.repositorio.marcarEnviado(pedidoId, {
          simplirouteId: envio.idExterno,
          version: pedido.version,
        });
        resultado.enviados.push(pedidoId);
      } catch (error) {
        resultado.errores.push({
          pedidoId,
          errores: [error instanceof Error ? error.message : "Error desconocido al enviar."],
        });
      }
    }

    return resultado;
  }
}
