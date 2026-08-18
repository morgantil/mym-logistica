import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PermisosClienteService } from "../../../common/permisos/permisos-cliente.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { LOGISTICA_PROVIDER, LogisticaProviderPort } from "../../simpliroute/domain/logistica-provider.port";
import { generarEtiquetasPdf } from "../infrastructure/etiqueta-pdf.generador";
import {
  DatosCrearPedido,
  FiltroPedidos,
  FiltroPedidosFacturables,
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

  // La grilla principal (§14 funcional) y Embalaje y Despacho (§8.1, con
  // `clienteId` puntual además del filtro por estado/fecha) siempre pasan por
  // acá, así que el filtro de "permisos por cliente" queda aplicado en un
  // solo lugar para todo el sistema.
  async listarParaUsuario(
    usuarioId: string,
    filtro: Omit<FiltroPedidos, "clienteIds"> & { clienteId?: string },
    pagina: number,
    porPagina: number,
  ) {
    const { clienteId, ...resto } = filtro;
    const clientesPermitidos = await this.permisosCliente.clientesPermitidosPara(usuarioId);

    // Si se pide un cliente puntual, se cruza con los permitidos — nunca se
    // deja que el filtro puntual esquive la restricción de permisos.
    let clienteIds: string[] | undefined;
    if (clienteId) {
      if (clientesPermitidos && !clientesPermitidos.includes(clienteId)) {
        return { datos: [], total: 0 };
      }
      clienteIds = [clienteId];
    } else {
      clienteIds = clientesPermitidos ?? undefined;
    }

    return this.repositorio.listar({ ...resto, clienteIds }, pagina, porPagina);
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

  // Usado por FacturacionService (§30 funcional) — no aplica permisos por
  // cliente porque siempre se llama con un clienteId puntual ya autorizado
  // por el controller de facturación.
  listarFacturables(filtro: FiltroPedidosFacturables) {
    return this.repositorio.listarFacturables(filtro);
  }

  // §16 funcional: carga de bultos desde la grilla. Bloqueo optimista — ver
  // ConflictoVersionError, que el controller traduce a HTTP 409.
  async actualizarBultos(pedidoId: string, bultos: number, version: number) {
    return this.repositorio.actualizarBultos(pedidoId, bultos, version);
  }

  // §8.2 funcional v6: etiquetas de bulto. `numeroBulto` ausente = todas las
  // del pedido (1..bultos); presente = una puntual (reimpresión de una sola).
  // Exige que ya se haya cargado la cantidad de bultos — no tiene sentido
  // imprimir "Bulto 1/?" con un total desconocido.
  async generarEtiquetas(pedidoId: string, numeroBulto?: number): Promise<Buffer> {
    const pedido = await this.repositorio.obtenerListadoPorId(pedidoId);
    if (!pedido) {
      throw new NotFoundException(`Pedido ${pedidoId} no encontrado.`);
    }
    if (!pedido.bultos || pedido.bultos < 1) {
      throw new BadRequestException("Cargá la cantidad de bultos antes de imprimir etiquetas.");
    }
    if (numeroBulto !== undefined && (numeroBulto < 1 || numeroBulto > pedido.bultos)) {
      throw new BadRequestException(`El pedido tiene ${pedido.bultos} bulto(s) — no existe el bulto ${numeroBulto}.`);
    }

    const numerosBulto = numeroBulto !== undefined
      ? [numeroBulto]
      : Array.from({ length: pedido.bultos }, (_, i) => i + 1);

    const pdf = await generarEtiquetasPdf(pedido, numerosBulto);
    await this.repositorio.marcarEtiquetaImpresa(pedidoId);
    return pdf;
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
          destinatarioNombre: destinatario.nombre,
          destinatarioTelefono: destinatario.telefono,
          direccion: pedido.direccionUsada,
          fechaProgramada: pedido.fechaProgramada,
          bultos: pedido.bultos,
          observaciones: pedido.observaciones,
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
