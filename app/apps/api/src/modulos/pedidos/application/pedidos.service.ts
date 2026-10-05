import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrioridadPedido, ResolucionDireccion, TipoServicio } from "@mym/shared-types";
import { PermisosClienteService } from "../../../common/permisos/permisos-cliente.service";
import { ClientesService } from "../../clientes/application/clientes.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { LOGISTICA_PROVIDER, LogisticaProviderPort } from "../../simpliroute/domain/logistica-provider.port";
import {
  NORMALIZADOR_DIRECCIONES,
  NormalizadorDireccionesPort,
} from "../../geografia/domain/normalizador-direcciones.port";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { generarEtiquetasPdf } from "../infrastructure/etiqueta-pdf.generador";
import { generarPedidosExcel } from "../infrastructure/pedidos-excel.generador";
import { generarRemitoPdf } from "../infrastructure/remito-pdf.generador";
import { mapearEstadoSimpliRoute } from "../domain/mapear-estado-simpliroute";
import { estaDentroDeBuenosAires } from "../domain/validar-coordenada-buenos-aires";
import { armarDireccionParaSimpliRoute } from "../domain/armar-direccion-para-simpliroute";
import {
  DatosCrearPedido,
  FiltroPedidos,
  FiltroPedidosFacturables,
  OrdenPedidos,
  PEDIDOS_REPOSITORIO,
  PedidosRepositorio,
} from "../domain/pedidos.repositorio";
import { validarPedidoParaEliminar } from "../domain/validar-eliminacion";
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

export interface ResultadoEliminacionMasiva {
  eliminados: string[];
  errores: PedidoConErrores[];
}

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    @Inject(PEDIDOS_REPOSITORIO) private readonly repositorio: PedidosRepositorio,
    @Inject(LOGISTICA_PROVIDER) private readonly logisticaProvider: LogisticaProviderPort,
    private permisosCliente: PermisosClienteService,
    private destinatariosService: DestinatariosService,
    private zonasChoferesService: ZonasChoferesService,
    @Inject(NORMALIZADOR_DIRECCIONES) private readonly normalizadorDirecciones: NormalizadorDireccionesPort,
    private clientesService: ClientesService,
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

  // Decisión 2026-10-04 (reunión con el cliente): "Exportar a Excel" respeta
  // los mismos filtros Y los mismos permisos por cliente que la grilla.
  async exportarParaUsuario(
    usuarioId: string,
    filtro: Omit<FiltroPedidos, "clienteIds"> & { clienteId?: string },
    orden?: OrdenPedidos,
  ): Promise<Buffer> {
    const { clienteId, ...resto } = filtro;
    const clientesPermitidos = await this.permisosCliente.clientesPermitidosPara(usuarioId);

    let clienteIds: string[] | undefined;
    if (clienteId) {
      if (clientesPermitidos && !clientesPermitidos.includes(clienteId)) {
        return generarPedidosExcel([]);
      }
      clienteIds = [clienteId];
    } else {
      clienteIds = clientesPermitidos ?? undefined;
    }

    const pedidos = await this.repositorio.listarTodosParaExportar({ ...resto, clienteIds }, orden);
    return generarPedidosExcel(pedidos);
  }

  async contarPorEstadoParaUsuario(usuarioId: string) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.contarPorEstado(clienteIds ?? undefined);
  }

  // Dropdown del filtro de Localidad en la grilla de Pedidos (decisión
  // 2026-09-16) — mismo criterio de permisos que el resto de los listados.
  async listarLocalidadesParaUsuario(usuarioId: string) {
    const clienteIds = await this.permisosCliente.clientesPermitidosPara(usuarioId);
    return this.repositorio.listarLocalidades(clienteIds ?? undefined);
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

  listarEntregadosEnPeriodo(filtro: FiltroPedidosFacturables) {
    return this.repositorio.listarEntregadosEnPeriodo(filtro);
  }

  // §16 funcional: carga de bultos desde la grilla. Bloqueo optimista — ver
  // ConflictoVersionError, que el controller traduce a HTTP 409.
  async actualizarBultos(pedidoId: string, bultos: number, version: number) {
    return this.repositorio.actualizarBultos(pedidoId, bultos, version);
  }

  // Decisión 2026-10-04: campo libre, editable en cualquier momento (ej.
  // motivo de una entrega fallida) — mismo bloqueo optimista que bultos.
  async actualizarComentario(pedidoId: string, comentario: string | null, version: number) {
    return this.repositorio.actualizarComentario(pedidoId, comentario?.trim() || null, version);
  }

  // Decisión 2026-10-04: qué ruta de SimpliRoute (ej. "Ruta 1") le
  // corresponde — campo libre cargado a mano, ver comentario en pedido.ts.
  async actualizarRuta(pedidoId: string, ruta: string | null, version: number) {
    return this.repositorio.actualizarRuta(pedidoId, ruta?.trim() || null, version);
  }

  // Decisión 2026-09-16 (Leonardo, QA): la "Etapa 2" del §11 funcional que
  // había quedado pendiente — resolver una dirección distinta a la
  // registrada en el padrón ya no es solo una nota en observaciones, ahora
  // desbloquea el envío (ver validar-envio.ts). Reusa
  // DestinatariosService.resolverDiferenciaDireccion (backend ya existente
  // desde el importador, nunca antes expuesto por su cuenta).
  async resolverAlertaDireccion(pedidoId: string, resolucion: ResolucionDireccion, version: number) {
    const pedido = await this.repositorio.obtenerPorId(pedidoId);
    if (!pedido) throw new NotFoundException(`Pedido ${pedidoId} no encontrado.`);

    const destinatario = await this.destinatariosService.buscarPorId(pedido.destinatarioId);
    if (!destinatario) throw new NotFoundException(`Destinatario ${pedido.destinatarioId} no encontrado.`);

    const { direccionAUsar } = await this.destinatariosService.resolverDiferenciaDireccion(
      destinatario.id,
      resolucion,
      pedido.direccionOriginal,
      destinatario.direccion,
    );

    return this.repositorio.resolverAlertaDireccion(pedidoId, direccionAUsar, version);
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

  // Ítem "remitos preimpresos" (reunión 02/10/2026, Pablo Renzo): imprime
  // los datos variables del pedido sobre el papel preimpreso del cliente —
  // ver remito-pdf.generador.ts. Sin formatoRemito configurado no hay en qué
  // coordenadas imprimir, así que no se puede generar.
  async generarRemito(pedidoId: string): Promise<Buffer> {
    const pedido = await this.repositorio.obtenerListadoPorId(pedidoId);
    if (!pedido) {
      throw new NotFoundException(`Pedido ${pedidoId} no encontrado.`);
    }
    if (!pedido.clienteFormatoRemito) {
      throw new BadRequestException(
        `${pedido.clienteNombre} todavía no tiene un formato de remito configurado (pantalla Clientes).`,
      );
    }
    return generarRemitoPdf(pedido, pedido.clienteFormatoRemito);
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
        // La localidad sola no siempre alcanza para que SimpliRoute
        // desambigüe bien (caso real 2026-09-04: "Balcarce 594, Monserrat"
        // igual geocodificó en San Luis) — se reutiliza la clasificación
        // CABA/Provincia que ya resuelve GeorefArAdapter (la misma que usa
        // la zona tarifaria) para agregar "CABA, Argentina" o "Provincia de
        // Buenos Aires, Argentina" según corresponda. Ver DOCUMENTO
        // TECNICO.md y armar-direccion-para-simpliroute.ts.
        const clasificacion = await this.normalizadorDirecciones.clasificarCabaProvincia(pedido.localidad);
        const cliente = await this.clientesService.buscarPorId(pedido.clienteId);
        const envio = await this.logisticaProvider.enviarPedido({
          pedidoId: pedido.id,
          destinatarioIdExterno: destinatario.simplirouteId,
          destinatarioNombre: destinatario.nombre,
          destinatarioTelefono: destinatario.telefono,
          direccion: armarDireccionParaSimpliRoute(pedido.direccionUsada, pedido.localidad, clasificacion),
          fechaProgramada: pedido.fechaProgramada,
          bultos: pedido.bultos,
          observaciones: pedido.observaciones,
          cargaPanal: pedido.tipoServicio === TipoServicio.PANAL,
          cargaEspecial: cliente?.usaCarga3 ?? false,
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

          // Decisión 2026-10-04: además de guardarlo acá, se lo decimos a
          // SimpliRoute (campos driver/vehicle de la Visit) — hasta ahora
          // resolvíamos chofer/zona solo para uso interno, nunca se lo
          // comunicábamos al proveedor. Si esto falla, no se pierde el
          // envío (la Visit ya existe y quedó marcada abajo) — se loguea y
          // se sigue, igual que un pedido puede quedar sin asignación
          // automática en SimpliRoute hoy.
          if (resuelto.choferId !== null && resuelto.vehiculoId !== null) {
            try {
              await this.logisticaProvider.asignarChoferVehiculo(
                envio.idExterno,
                Number(resuelto.choferId),
                Number(resuelto.vehiculoId),
              );
            } catch (error) {
              this.logger.warn(
                `No se pudo asignar chofer/vehículo a la Visita ${envio.idExterno} (pedido ${pedidoId}): ${
                  error instanceof Error ? error.message : "error desconocido"
                }`,
              );
            }
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
  //
  // Decisión 2026-10-04: de paso, si el `driver` real de la Visit ya no
  // coincide con el choferId guardado (un despachante reasignó la Visit a
  // mano en SimpliRoute después de enviada), recalcula zona/chofer y los
  // actualiza acá mismo — hoy la única forma de reflejar eso era borrar el
  // pedido, esto lo hace solo en cada sincronización.
  async sincronizarEstados(): Promise<ResultadoSincronizacion> {
    const pendientes = await this.repositorio.listarPendientesDeSincronizar();
    const resultado: ResultadoSincronizacion = { actualizados: 0, sinCambios: 0, errores: [] };

    for (const pedido of pendientes) {
      try {
        const { estado: estadoCrudo, fechaEntrega, choferIdExterno } = await this.logisticaProvider.consultarEstado(
          pedido.simplirouteId,
        );
        const estadoMapeado = mapearEstadoSimpliRoute(estadoCrudo);
        if (estadoMapeado === null) {
          resultado.sinCambios++;
          continue;
        }

        const actualizacionChofer =
          choferIdExterno !== null && String(choferIdExterno) !== pedido.choferId
            ? await this.zonasChoferesService.resolverZonaPorChofer(choferIdExterno)
            : undefined;

        await this.repositorio.actualizarEstadoDesdeProveedor(pedido.id, {
          estado: estadoMapeado,
          fechaEntregaEfectiva: fechaEntrega,
          version: pedido.version,
          actualizacionChofer,
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

  // Decisión 2026-09-11: borrado lógico de pedidos mal cargados/duplicados/de
  // prueba, sin depender de un script contra la base (ver DOCUMENTO
  // TECNICO.md — surgió del incidente de datos del mismo día). Solo permitido
  // si el pedido todavía no se mandó a SimpliRoute (validarPedidoParaEliminar).
  async eliminarPedido(id: string): Promise<void> {
    const pedido = await this.repositorio.obtenerPorId(id);
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} no encontrado.`);
    }
    const error = validarPedidoParaEliminar(pedido);
    if (error) {
      throw new BadRequestException(error);
    }
    await this.repositorio.eliminar(id);
  }

  // Decisión 2026-09-24: Normal/Urgente/Crítica a mano, uno o varios pedidos.
  // Vale para cualquier estado (un pedido ya enviado también puede volverse
  // urgente para el seguimiento interno — no toca SimpliRoute).
  async actualizarPrioridad(pedidoIds: string[], prioridad: PrioridadPedido, usuarioId: string) {
    const actualizados = await this.repositorio.actualizarPrioridad(pedidoIds, prioridad, usuarioId);
    return { actualizados };
  }

  // Selección múltiple desde Grilla/Revisión — un pedido que no se puede
  // borrar (ya enviado, o no encontrado) no frena a los demás, mismo criterio
  // que enviarASimpliRoute.
  async eliminarPedidos(pedidoIds: string[]): Promise<ResultadoEliminacionMasiva> {
    const resultado: ResultadoEliminacionMasiva = { eliminados: [], errores: [] };

    for (const pedidoId of pedidoIds) {
      const pedido = await this.repositorio.obtenerPorId(pedidoId);
      if (!pedido) {
        resultado.errores.push({ pedidoId, errores: ["Pedido no encontrado."] });
        continue;
      }
      const error = validarPedidoParaEliminar(pedido);
      if (error) {
        resultado.errores.push({ pedidoId, errores: [error] });
        continue;
      }
      await this.repositorio.eliminar(pedidoId);
      resultado.eliminados.push(pedidoId);
    }

    return resultado;
  }
}
