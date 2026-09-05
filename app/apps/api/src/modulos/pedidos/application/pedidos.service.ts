import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PermisosClienteService } from "../../../common/permisos/permisos-cliente.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { LOGISTICA_PROVIDER, LogisticaProviderPort } from "../../simpliroute/domain/logistica-provider.port";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { generarEtiquetasPdf } from "../infrastructure/etiqueta-pdf.generador";
import { mapearEstadoSimpliRoute } from "../domain/mapear-estado-simpliroute";
import { estaDentroDeBuenosAires } from "../domain/validar-coordenada-buenos-aires";
import {
  DatosCrearPedido,
  FiltroPedidos,
  FiltroPedidosFacturables,
  OrdenPedidos,
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

export interface ResultadoSincronizacion {
  actualizados: number;
  sinCambios: number;
  errores: PedidoConErrores[];
}

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDOS_REPOSITORIO) private readonly repositorio: PedidosRepositorio,
    @Inject(LOGISTICA_PROVIDER) private readonly logisticaProvider: LogisticaProviderPort,
    private permisosCliente: PermisosClienteService,
    private destinatariosService: DestinatariosService,
    private zonasChoferesService: ZonasChoferesService,
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
    orden?: OrdenPedidos,
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

    return this.repositorio.listar({ ...resto, clienteIds }, pagina, porPagina, orden);
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
        // La localidad va concatenada a la dirección para que SimpliRoute
        // tenga contexto al geocodificar — sin ella, una calle que existe en
        // más de una ciudad (ej. "Balcarce", que es una calle real de CABA
        // Y de San Luis) puede geocodificar en cualquier lugar del país con
        // confianza alta ("no alert") pese a estar completamente mal. Caso
        // real 2026-09-04, ver DOCUMENTO TECNICO.md.
        const envio = await this.logisticaProvider.enviarPedido({
          pedidoId: pedido.id,
          destinatarioIdExterno: destinatario.simplirouteId,
          destinatarioNombre: destinatario.nombre,
          destinatarioTelefono: destinatario.telefono,
          direccion: `${pedido.direccionUsada}, ${pedido.localidad}`,
          fechaProgramada: pedido.fechaProgramada,
          bultos: pedido.bultos,
          observaciones: pedido.observaciones,
        });

        // El cliente confirmó que ninguna entrega sale nunca de Buenos Aires
        // — cualquier coordenada afuera es un error de geocodificación
        // garantizado (SimpliRoute no tiene forma de saber esto, solo
        // nosotros). La Visit ya quedó creada en SimpliRoute (no se puede
        // evitar, geocodifica al crearla) pero acá no se la trata como un
        // envío exitoso: queda en ERROR para revisión manual, sin recalcular
        // zona/chofer con una coordenada que ya sabemos que está mal.
        if (
          envio.latitud !== null &&
          envio.longitud !== null &&
          !estaDentroDeBuenosAires(envio.latitud, envio.longitud)
        ) {
          await this.repositorio.marcarErrorGeocodificacion(pedidoId, {
            simplirouteId: envio.idExterno,
            version: pedido.version,
            latitudEntrega: envio.latitud,
            longitudEntrega: envio.longitud,
            geocodeAlert: envio.geocodeAlert,
          });
          resultado.errores.push({
            pedidoId,
            errores: [
              `Geocodificación fuera de Buenos Aires (lat ${envio.latitud}, lon ${envio.longitud}) — revisar la dirección. Se creó la Visita ${envio.idExterno} en SimpliRoute, requiere revisión manual.`,
            ],
          });
          continue;
        }

        // SimpliRoute geocodifica la Visit con la dirección real (la del
        // Excel) recién al crearla — antes de esto, la zona/chofer del
        // pedido se había resuelto con la coordenada que el Client tenía
        // guardada en SimpliRoute, que puede estar desactualizada. Acá se
        // recalcula con la coordenada real y, si da distinto, se corrige
        // (impacta directo en la liquidación a transportistas, que agrupa
        // por choferId) dejando el valor anterior como snapshot para poder
        // medir cuántas veces pasó esto — ver DOCUMENTO TECNICO.md.
        let correccionZonaChofer: Parameters<PedidosRepositorio["marcarEnviado"]>[1]["correccionZonaChofer"];
        if (envio.latitud !== null && envio.longitud !== null) {
          const resuelto = await this.zonasChoferesService.resolverZonaChofer(
            envio.latitud,
            envio.longitud,
            pedido.localidad,
          );
          if (resuelto.zonaId !== pedido.zonaId || resuelto.choferId !== pedido.choferId) {
            correccionZonaChofer = {
              zonaId: resuelto.zonaId,
              zonaNombre: resuelto.zonaNombre,
              choferId: resuelto.choferId,
              choferNombre: resuelto.choferNombre,
              zonaPreEnvioId: pedido.zonaId,
              zonaPreEnvioNombre: pedido.zonaNombre,
              choferPreEnvioId: pedido.choferId,
              choferPreEnvioNombre: pedido.choferNombre,
            };
          }
        }

        await this.repositorio.marcarEnviado(pedidoId, {
          simplirouteId: envio.idExterno,
          version: pedido.version,
          latitudEntrega: envio.latitud,
          longitudEntrega: envio.longitud,
          geocodeAlert: envio.geocodeAlert,
          correccionZonaChofer,
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

  // §19 funcional: trae el estado real de cada pedido ya enviado y todavía en
  // curso (COORDINADO/EN_TRANSITO) desde SimpliRoute, y lo refleja en
  // EstadoPedido — es lo único que permite que un pedido llegue a ENTREGADO
  // o ENTREGA_FALLIDA (nada más en el sistema los setea). Un status crudo sin
  // mapeo conocido o un error de red en un pedido puntual no frena al resto
  // (mismo criterio que enviarASimpliRoute). Se llama antes de calcular
  // cualquier facturación (ver FacturacionService) además de estar disponible
  // como acción manual.
  async sincronizarEstados(): Promise<ResultadoSincronizacion> {
    const pendientes = await this.repositorio.listarPendientesDeSincronizar();
    const resultado: ResultadoSincronizacion = { actualizados: 0, sinCambios: 0, errores: [] };

    for (const pedido of pendientes) {
      try {
        const { estado: estadoCrudo, fechaEntrega } = await this.logisticaProvider.consultarEstado(
          pedido.simplirouteId,
        );
        const estadoMapeado = mapearEstadoSimpliRoute(estadoCrudo);
        if (estadoMapeado === null) {
          resultado.sinCambios++;
          continue;
        }
        await this.repositorio.actualizarEstadoDesdeProveedor(pedido.id, {
          estado: estadoMapeado,
          fechaEntregaEfectiva: fechaEntrega,
          version: pedido.version,
        });
        resultado.actualizados++;
      } catch (error) {
        resultado.errores.push({
          pedidoId: pedido.id,
          errores: [error instanceof Error ? error.message : "Error desconocido al sincronizar."],
        });
      }
    }

    return resultado;
  }
}
