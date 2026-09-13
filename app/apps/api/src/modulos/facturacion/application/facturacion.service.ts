import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TipoEnvase, TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { PedidoFacturable } from "../../pedidos/domain/pedido";
import { PedidosService } from "../../pedidos/application/pedidos.service";
import { ZonasTarifariasService } from "../../zonas-tarifarias/application/zonas-tarifarias.service";
import { determinarClasificacionMedicamento } from "../domain/clasificacion-medicamento";
import {
  FACTURACION_REPOSITORIO,
  FacturacionRepositorio,
} from "../domain/facturacion.repositorio";
import { GrupoFacturacion } from "../domain/grupo-facturacion";
import {
  PedidoParaFacturar,
  TarifasPorTipo,
  ViajeFacturable,
  calcularFacturacionCliente,
  claveTarifaDePedido,
} from "../domain/motor-facturacion";
import {
  ResumenChofer,
  calcularLiquidacionTransportistas,
} from "../domain/motor-liquidacion-transportistas";
import {
  buscarUnificacionesEntreClientes,
  construirViajeUnificacionCruzadaMedicamento,
  construirViajeUnificacionCruzadaPanal,
} from "../domain/unificacion-cruzada";
import { generarReporteMensualExcel } from "../infrastructure/reporte-mensual-excel.generador";

export interface PedidoExcluido {
  pedidoId: string;
  motivo: string;
}

export interface ResultadoVistaPrevia {
  grupos: Awaited<ReturnType<FacturacionRepositorio["reemplazarBorrador"]>>;
  excluidos: PedidoExcluido[];
}

function rangoDelMes(mes: number, anio: number): { fechaDesde: Date; fechaHasta: Date } {
  return {
    fechaDesde: new Date(Date.UTC(anio, mes - 1, 1)),
    fechaHasta: new Date(Date.UTC(anio, mes, 1)), // exclusiva
  };
}

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);

  constructor(
    @Inject(FACTURACION_REPOSITORIO) private readonly repositorio: FacturacionRepositorio,
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
    private zonasTarifariasService: ZonasTarifariasService,
  ) {}

  listarTarifas(clienteId: string) {
    return this.repositorio.listarTarifas(clienteId);
  }

  crearTarifa(
    clienteId: string,
    zonaTarifariaId: string,
    tipoServicio: TipoServicio,
    tipoEnvase: TipoEnvase | null,
    monto: number,
  ) {
    return this.repositorio.crearTarifa({ clienteId, zonaTarifariaId, tipoServicio, tipoEnvase, monto });
  }

  actualizarTarifa(id: string, datos: { monto?: number; activa?: boolean }) {
    return this.repositorio.actualizarTarifa(id, datos);
  }

  listarPorcentajes(clienteId: string) {
    return this.repositorio.listarPorcentajes(clienteId);
  }

  crearPorcentaje(clienteId: string, porcentajePanal: number) {
    return this.repositorio.crearPorcentaje({ clienteId, porcentajePanal });
  }

  actualizarPorcentaje(id: string, datos: { porcentajePanal?: number; activa?: boolean }) {
    return this.repositorio.actualizarPorcentaje(id, datos);
  }

  listarMontosUnificadoMedicamento(clienteId: string) {
    return this.repositorio.listarMontosUnificadoMedicamento(clienteId);
  }

  crearMontoUnificadoMedicamento(
    clienteId: string,
    zonaTarifariaId: string,
    tipoEnvase: TipoEnvase | null,
    monto: number,
  ) {
    return this.repositorio.crearMontoUnificadoMedicamento({ clienteId, zonaTarifariaId, tipoEnvase, monto });
  }

  actualizarMontoUnificadoMedicamento(id: string, datos: { monto?: number; activa?: boolean }) {
    return this.repositorio.actualizarMontoUnificadoMedicamento(id, datos);
  }

  listarCombinaciones() {
    return this.repositorio.listarCombinaciones();
  }

  // Decisión 2026-09-11 (riesgo #3 charlado con Leonardo): antes no se
  // validaba nada al crear una combinación — un error de tipeo (clientes al
  // revés, o un cliente que en realidad no maneja ese tipo de servicio)
  // rompía en silencio todo el emparejamiento de unificación cruzada.
  async crearCombinacion(clienteMedicamentoId: string, clientePanalId: string) {
    if (clienteMedicamentoId === clientePanalId) {
      throw new BadRequestException("No se puede combinar un cliente consigo mismo.");
    }
    const [clienteMedicamento, clientePanal] = await Promise.all([
      this.clientesService.buscarPorId(clienteMedicamentoId),
      this.clientesService.buscarPorId(clientePanalId),
    ]);
    if (!clienteMedicamento) throw new NotFoundException(`Cliente ${clienteMedicamentoId} no encontrado.`);
    if (!clientePanal) throw new NotFoundException(`Cliente ${clientePanalId} no encontrado.`);
    if (clienteMedicamento.tipoServicio === TipoServicioCliente.PANAL) {
      throw new BadRequestException(
        `"${clienteMedicamento.nombre}" está configurado como Pañal — no puede ser el lado Medicamento de una combinación.`,
      );
    }
    if (clientePanal.tipoServicio === TipoServicioCliente.MEDICAMENTO) {
      throw new BadRequestException(
        `"${clientePanal.nombre}" está configurado como Medicamento — no puede ser el lado Pañal de una combinación.`,
      );
    }
    return this.repositorio.crearCombinacion({ clienteMedicamentoId, clientePanalId });
  }

  eliminarCombinacion(id: string) {
    return this.repositorio.eliminarCombinacion(id);
  }

  listarTarifasTransportista() {
    return this.repositorio.listarTarifasTransportista();
  }

  crearTarifaTransportista(monto: number) {
    return this.repositorio.crearTarifaTransportista({ monto });
  }

  actualizarTarifaTransportista(id: string, datos: { monto?: number; activa?: boolean }) {
    return this.repositorio.actualizarTarifaTransportista(id, datos);
  }

  listarGrupos(clienteId: string, mes: number, anio: number) {
    return this.repositorio.listarGrupos(clienteId, mes, anio);
  }

  // Decisión 2026-09-11: mismo detalle por pedido que ya se arma para el
  // Excel (§31), pero expuesto como JSON para mostrarlo directo en la
  // pantalla de Liquidación — Leonardo pidió más información visible para
  // quien hace la liquidación (Nº de pedido, Nº de afiliado, destinatario…).
  listarPedidosFacturados(clienteId: string, mes: number, anio: number) {
    return this.repositorio.listarPedidosFacturados(clienteId, mes, anio);
  }

  // Convierte los PedidoFacturable de un cliente (§30 funcional) en
  // PedidoParaFacturar para el motor — clasifica Bolsa/Bulto (Guia Arbet paso
  // 2) y excluye lo que no se puede facturar sin inventar un dato (zona
  // tarifaria faltante, o medicamento sin ninguna línea clasificada todavía).
  private construirPedidosParaFacturar(pedidos: PedidoFacturable[]): {
    pedidosParaFacturar: PedidoParaFacturar[];
    excluidos: PedidoExcluido[];
  } {
    const excluidos: PedidoExcluido[] = [];
    const pedidosParaFacturar: PedidoParaFacturar[] = [];

    for (const pedido of pedidos) {
      if (!pedido.zonaTarifariaId) {
        // No debería pasar en la práctica (la zona tarifaria se resuelve
        // antes de poder marcar un pedido como ENTREGADO) — se excluye en vez
        // de asumir una tarifa, porque es plata real. Ver §36 funcional.
        excluidos.push({ pedidoId: pedido.id, motivo: "Sin zona tarifaria asignada." });
        continue;
      }

      let tipoEnvase: TipoEnvase | null = null;
      if (pedido.tipoServicio === TipoServicio.MEDICAMENTO) {
        tipoEnvase = determinarClasificacionMedicamento(pedido.productos.map((p) => p.tipoEnvase));
        if (tipoEnvase === null) {
          excluidos.push({
            pedidoId: pedido.id,
            motivo: "Pedido de medicamentos sin ninguna línea clasificada como Bolsa o Bulto.",
          });
          continue;
        }
      }

      pedidosParaFacturar.push({
        id: pedido.id,
        clienteId: pedido.clienteId,
        tipoServicio: pedido.tipoServicio,
        tipoEnvase,
        cantidadPedidoOriginal: pedido.cantidadPedidoOriginal,
        fechaProgramada: pedido.fechaProgramada.toISOString().slice(0, 10),
        direccionUsada: pedido.direccionUsada,
        zonaTarifariaId: pedido.zonaTarifariaId,
        latitudEntrega: pedido.latitudEntrega,
        longitudEntrega: pedido.longitudEntrega,
      });
    }

    return { pedidosParaFacturar, excluidos };
  }

  // Guia Arbet paso 4, riesgo #2 charlado con Leonardo (ver
  // UnificacionCruzadaPar en schema.prisma): antes de buscar un match nuevo
  // por fecha/ubicación, hay que respetar cualquier par YA decidido en una
  // confirmación anterior (de cualquiera de los dos clientes) — si no, dos
  // clientes que comparten un viaje pueden terminar con reglas distintas
  // según en qué momento del mes confirmó cada uno. Los candidatos socio que
  // ya están comprometidos con otro pedido, o que su cliente ya los facturó
  // en firme con otra regla (confirmados sin par), quedan afuera del
  // emparejamiento nuevo — unificarlos ahora los dejaría inconsistentes con
  // lo que ya cerró ese cliente.
  // `construirViaje` decide cómo se calcula la porción propia — pañal (tarifa
  // × %) y medicamento (monto fijo por zona, decisión 2026-09-12) ya no
  // comparten la misma fórmula, así que el llamador (que sabe de qué lado
  // está parado) arma el viaje, esta función solo resuelve CON QUIÉN.
  private async resolverUnificacionesCruzadas(
    propios: PedidoParaFacturar[],
    obtenerSocios: () => Promise<PedidoParaFacturar[]>,
    construirViaje: (propio: PedidoParaFacturar, socio: PedidoParaFacturar) => ViajeFacturable,
  ): Promise<{ viajes: ViajeFacturable[]; propiosRestantes: PedidoParaFacturar[] }> {
    if (propios.length === 0) return { viajes: [], propiosRestantes: [] };

    const socios = await obtenerSocios();
    const sociosPorId = new Map(socios.map((socio) => [socio.id, socio]));
    const pares = await this.repositorio.obtenerParesPorPedidos([
      ...propios.map((propio) => propio.id),
      ...socios.map((socio) => socio.id),
    ]);

    const viajes: ViajeFacturable[] = [];
    const propiosSinResolver: PedidoParaFacturar[] = [];
    for (const propio of propios) {
      const idSocio = pares.get(propio.id);
      const socio = idSocio ? sociosPorId.get(idSocio) : undefined;
      if (socio) {
        viajes.push(construirViaje(propio, socio));
      } else {
        propiosSinResolver.push(propio);
      }
    }

    const sociosSinPar = socios.filter((socio) => !pares.has(socio.id));
    const confirmadosSinPar = await this.repositorio.listarPedidosConGrupoConfirmado(
      sociosSinPar.map((socio) => socio.id),
    );
    const sociosDisponibles = sociosSinPar.filter((socio) => !confirmadosSinPar.has(socio.id));

    const { unificaciones, propiosRestantes } = buscarUnificacionesEntreClientes(
      propiosSinResolver,
      sociosDisponibles,
    );
    for (const { propio, socio } of unificaciones) {
      viajes.push(construirViaje(propio, socio));
    }

    return { viajes, propiosRestantes };
  }

  // §27 funcional: corre el motor de reglas sobre los pedidos ENTREGADOS del
  // cliente en el mes/año pedido y deja el resultado como GrupoFacturacion en
  // BORRADOR — el usuario de Facturación lo revisa y puede volver a llamar a
  // este método las veces que haga falta (recalcula desde cero) hasta que
  // confirme. Un mes ya CONFIRMADO no se puede recalcular.
  async generarVistaPrevia(clienteId: string, mes: number, anio: number): Promise<ResultadoVistaPrevia> {
    if (await this.repositorio.existeGrupoConfirmado(clienteId, mes, anio)) {
      throw new BadRequestException("Este mes ya fue confirmado para este cliente, no se puede recalcular.");
    }

    // Un pedido solo llega a ENTREGADO (lo único que listarFacturables trae)
    // vía sincronización con SimpliRoute — se dispara acá para que la vista
    // previa refleje entregas reales recientes sin que el usuario tenga que
    // acordarse de sincronizar antes por su cuenta (ver PedidosService.sincronizarEstados).
    await this.pedidosService.sincronizarEstados();

    // Limpiar el BORRADOR anterior ANTES de listar — si no, un pedido que ya
    // quedó vinculado a un cálculo previo de este mismo cliente/mes/año no
    // aparece en listarFacturables (excluye grupoFacturacionId no nulo) y
    // "Volver a calcular" nunca lo vuelve a levantar (bug real encontrado
    // 2026-09-11, ver DOCUMENTO TECNICO.md historial).
    await this.repositorio.limpiarBorrador(clienteId, mes, anio);

    const { fechaDesde, fechaHasta } = rangoDelMes(mes, anio);
    const pedidosCrudos = await this.pedidosService.listarFacturables({ clienteId, fechaDesde, fechaHasta });
    const { pedidosParaFacturar: propios, excluidos } = this.construirPedidosParaFacturar(pedidosCrudos);

    // Tarifas: solo se exigen las combinaciones zona+tipoServicio+tipoEnvase
    // que realmente aparecen entre los pedidos propios a facturar — un
    // cliente que solo entrega pañales en CABA no debería tener que cargar
    // una tarifa de medicamentos que nunca va a usar. Las tarifas del/de los
    // "socio" en una unificación entre clientes NUNCA hacen falta acá: cada
    // cliente se factura con su PROPIA tarifa (ver unificacion-cruzada.ts).
    const todasLasZonas = await this.zonasTarifariasService.listar();
    const nombreDeZona = (id: string) => todasLasZonas.find((z) => z.id === id)?.nombre ?? id;
    const tarifas: TarifasPorTipo = {};
    const clavesUsadas = new Map<string, PedidoParaFacturar>();
    for (const pedido of propios) clavesUsadas.set(claveTarifaDePedido(pedido), pedido);
    for (const [clave, pedido] of clavesUsadas) {
      const tarifa = await this.repositorio.tarifaActiva(
        clienteId,
        pedido.zonaTarifariaId,
        pedido.tipoServicio,
        pedido.tipoEnvase,
      );
      if (!tarifa) {
        const descripcionTipo =
          pedido.tipoServicio === TipoServicio.PANAL
            ? "Pañales"
            : `Medicamentos / ${pedido.tipoEnvase === TipoEnvase.BULTO ? "Bulto" : "Bolsa"}`;
        throw new BadRequestException(
          `Falta una tarifa activa de "${nombreDeZona(pedido.zonaTarifariaId)}" (${descripcionTipo}) para este cliente — cargala antes de generar la facturación.`,
        );
      }
      tarifas[clave] = tarifa.monto;
    }

    // El porcentaje de unificados solo hace falta si hay una entrega
    // unificada real (interna del propio cliente, o entre clientes por una
    // combinación habilitada) — con solo pañales y sin combinaciones nunca se
    // usa, así que no se exige configurarlo de antemano.
    const combinaciones = await this.repositorio.listarCombinacionesDeCliente(clienteId);
    const combosComoPanal = combinaciones.filter((c) => c.clientePanalId === clienteId);
    const combosComoMedicamento = combinaciones.filter((c) => c.clienteMedicamentoId === clienteId);
    const hayMedicamentos = propios.some((p) => p.tipoServicio === TipoServicio.MEDICAMENTO);
    const necesitaPorcentaje = hayMedicamentos || combosComoPanal.length > 0 || combosComoMedicamento.length > 0;

    const porcentajeActivoCliente = await this.repositorio.porcentajeActivo(clienteId);
    if (necesitaPorcentaje && porcentajeActivoCliente === null) {
      throw new BadRequestException(
        "Hay pedidos de medicamentos o combinaciones de unificación habilitadas pero no hay un porcentaje configurado para este cliente.",
      );
    }

    // Montos fijos del lado medicamento en un unificado (decisión 2026-09-12
    // — ver MontoUnificadoMedicamento en tarifa.ts): se prefetchean para las
    // zonas/envases que efectivamente aparecen entre los pedidos de
    // medicamentos de este cliente, igual criterio que `tarifas`. No se exige
    // de antemano (a diferencia de la tarifa normal): un pedido de
    // medicamentos que nunca termina unificado no lo necesita.
    const montosUnificadoMedicamento: TarifasPorTipo = {};
    const clavesMedicamentoUsadas = new Map<string, PedidoParaFacturar>();
    for (const pedido of propios) {
      if (pedido.tipoServicio === TipoServicio.MEDICAMENTO) {
        clavesMedicamentoUsadas.set(claveTarifaDePedido(pedido), pedido);
      }
    }
    for (const [clave, pedido] of clavesMedicamentoUsadas) {
      const monto = await this.repositorio.montoUnificadoMedicamentoActivo(
        clienteId,
        pedido.zonaTarifariaId,
        pedido.tipoEnvase,
      );
      if (monto) montosUnificadoMedicamento[clave] = monto.monto;
    }

    // Unificación ENTRE clientes distintos (Guia Arbet paso 4) — antes del
    // motor de un solo cliente, que sigue resolviendo la unificación INTERNA
    // de un cliente AMBOS (ej. Bella Vista, que no usa combinaciones porque
    // ya se unifica sola). Los pedidos que se resuelven acá quedan afuera del
    // pool que ve calcularFacturacionCliente, para no facturarlos dos veces.
    const viajesCruzados: ViajeFacturable[] = [];
    let pedidosRestantes = propios;

    if (combosComoPanal.length > 0) {
      const propiosPanal = pedidosRestantes.filter((p) => p.tipoServicio === TipoServicio.PANAL);
      const otros = pedidosRestantes.filter((p) => p.tipoServicio !== TipoServicio.PANAL);
      const { viajes, propiosRestantes: sinUnificar } = await this.resolverUnificacionesCruzadas(
        propiosPanal,
        async () => {
          const socios: PedidoParaFacturar[] = [];
          for (const combo of combosComoPanal) {
            const pedidosSocioCrudos = await this.pedidosService.listarEntregadosEnPeriodo({
              clienteId: combo.clienteMedicamentoId,
              fechaDesde,
              fechaHasta,
            });
            const { pedidosParaFacturar } = this.construirPedidosParaFacturar(pedidosSocioCrudos);
            socios.push(...pedidosParaFacturar.filter((p) => p.tipoServicio === TipoServicio.MEDICAMENTO));
          }
          return socios;
        },
        (propio, socio) =>
          construirViajeUnificacionCruzadaPanal(propio, socio, tarifas, porcentajeActivoCliente?.porcentajePanal ?? 0),
      );
      viajesCruzados.push(...viajes);
      pedidosRestantes = [...otros, ...sinUnificar];
    }

    if (combosComoMedicamento.length > 0) {
      const propiosMedicamento = pedidosRestantes.filter((p) => p.tipoServicio === TipoServicio.MEDICAMENTO);
      const otros = pedidosRestantes.filter((p) => p.tipoServicio !== TipoServicio.MEDICAMENTO);
      const { viajes, propiosRestantes: sinUnificar } = await this.resolverUnificacionesCruzadas(
        propiosMedicamento,
        async () => {
          const socios: PedidoParaFacturar[] = [];
          for (const combo of combosComoMedicamento) {
            const pedidosSocioCrudos = await this.pedidosService.listarEntregadosEnPeriodo({
              clienteId: combo.clientePanalId,
              fechaDesde,
              fechaHasta,
            });
            const { pedidosParaFacturar } = this.construirPedidosParaFacturar(pedidosSocioCrudos);
            socios.push(...pedidosParaFacturar.filter((p) => p.tipoServicio === TipoServicio.PANAL));
          }
          return socios;
        },
        (propio, socio) => construirViajeUnificacionCruzadaMedicamento(propio, socio, montosUnificadoMedicamento),
      );
      viajesCruzados.push(...viajes);
      pedidosRestantes = [...otros, ...sinUnificar];
    }

    const viajesPropios = calcularFacturacionCliente(pedidosRestantes, tarifas, {
      porcentajePanal: porcentajeActivoCliente?.porcentajePanal ?? 0,
      montosUnificadoMedicamento,
    });

    const viajes = [...viajesCruzados, ...viajesPropios];

    const grupos = await this.repositorio.reemplazarBorrador(
      clienteId,
      mes,
      anio,
      viajes.map((viaje) => ({
        clienteId,
        mes,
        anio,
        reglaAplicada: viaje.reglaAplicada,
        tarifaUtilizada: viaje.tarifaUtilizada,
        porcentajeAplicado: viaje.porcentajeAplicado,
        porcentajePanalAplicado: viaje.detalleUnificacion?.porcentajePanal ?? null,
        montoFijoMedicamentoAplicado: viaje.detalleUnificacion?.montoFijoMedicamento ?? viaje.montoFijoMedicamentoAplicado ?? null,
        pedidoSocioId: viaje.socioEntreClientes?.pedidoId ?? null,
        clienteSocioId: viaje.socioEntreClientes?.clienteId ?? null,
        cantidadViajes: viaje.cantidadViajes,
        importeCalculado: viaje.importeCalculado,
        pedidoIds: viaje.pedidoIds,
      })),
    );

    return { grupos, excluidos };
  }

  // Pasa los BORRADOR de ese cliente/mes/año a CONFIRMADO — a partir de acá
  // quedan en firme y auditados (DOCUMENTO TECNICO.md sección 2).
  async confirmar(clienteId: string, mes: number, anio: number, usuarioId: string) {
    const grupos = await this.repositorio.listarGrupos(clienteId, mes, anio);
    if (grupos.length === 0) {
      throw new BadRequestException("No hay una vista previa generada para este cliente/mes/año todavía.");
    }
    if (grupos.every((grupo) => grupo.estado !== "BORRADOR")) {
      throw new BadRequestException("Este mes ya está confirmado.");
    }
    const confirmados = await this.repositorio.confirmar(clienteId, mes, anio, usuarioId);
    await this.grabarParesDeUnificacionCruzada(confirmados);
    return confirmados;
  }

  // Guia Arbet paso 4, riesgo #2 (ver UnificacionCruzadaPar en schema.prisma):
  // la primera vez que una unificación cruzada queda CONFIRMADA, se graba el
  // par pañal/medicamento para siempre. Cuando el otro cliente de la
  // combinación corra su propia vista previa (antes o después, no importa el
  // orden), `resolverUnificacionesCruzadas` va a encontrar este par y
  // respetarlo en vez de volver a adivinar por fecha/ubicación — así los dos
  // lados quedan garantizados consistentes. Si grabar un par falla (debería
  // ser rarísimo: significaría que otro pedido ya se adelantó y se quedó con
  // el mismo socio en el instante entre calcular y confirmar), no se bloquea
  // la confirmación por esto — el peor caso es quedar sin la red de
  // seguridad para ESE par puntual, no perder la confirmación ya hecha.
  private async grabarParesDeUnificacionCruzada(grupos: GrupoFacturacion[]): Promise<void> {
    for (const grupo of grupos) {
      if (grupo.reglaAplicada !== "UNIFICADA" || !grupo.pedidoSocioId || !grupo.clienteSocioId) continue;
      try {
        const combinacion = await this.repositorio.buscarCombinacionEntreClientes(
          grupo.clienteId,
          grupo.clienteSocioId,
        );
        if (!combinacion) continue;
        const propioEsMedicamento = combinacion.clienteMedicamentoId === grupo.clienteId;
        await this.repositorio.crearParUnificacion({
          combinacionId: combinacion.id,
          pedidoPanalId: propioEsMedicamento ? grupo.pedidoSocioId : grupo.pedidoIds[0],
          pedidoMedicamentoId: propioEsMedicamento ? grupo.pedidoIds[0] : grupo.pedidoSocioId,
        });
      } catch (error) {
        // Ver comentario de arriba — no se propaga, la confirmación ya se
        // hizo. Se loguea sí o sí: sin esto, un conflicto real quedaba sin
        // ningún rastro (encontrado charlando riesgos con Leonardo).
        this.logger.warn(
          `No se pudo grabar el par de unificación cruzada para el grupo ${grupo.id} (cliente ${grupo.clienteId}): ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  }

  // §31 funcional: reporte mensual por cliente, exportable a Excel. Sirve
  // tanto para BORRADOR (simulación) como CONFIRMADO — cada fila del resumen
  // trae su propio estado, así que no hace falta separar el endpoint.
  async generarReporteMensual(clienteId: string, mes: number, anio: number): Promise<Buffer> {
    const cliente = await this.clientesService.buscarPorId(clienteId);
    if (!cliente) {
      throw new NotFoundException(`Cliente ${clienteId} no encontrado.`);
    }

    const [pedidos, grupos] = await Promise.all([
      this.repositorio.listarPedidosFacturados(clienteId, mes, anio),
      this.repositorio.listarGrupos(clienteId, mes, anio),
    ]);

    return generarReporteMensualExcel({ clienteNombre: cliente.nombre, mes, anio, pedidos, grupos });
  }

  // §4.2 TEMAS_PENDIENTES.md: cuántos viajes hizo cada chofer en el mes y
  // cuánto se le debe pagar. Sincroniza estados primero (mismo motivo que
  // generarVistaPrevia) para no calcular sobre datos viejos. Distinto de la
  // facturación a clientes: acá no hay clienteId (un chofer reparte para
  // todos) y la tarifa es un único monto global, no por zona.
  async liquidacionTransportistas(mes: number, anio: number): Promise<ResumenChofer[]> {
    await this.pedidosService.sincronizarEstados();

    const { fechaDesde, fechaHasta } = rangoDelMes(mes, anio);
    const [pedidos, tarifa] = await Promise.all([
      this.repositorio.listarEntregadosPorChoferEnPeriodo(fechaDesde, fechaHasta),
      this.repositorio.tarifaTransportistaActiva(),
    ]);

    if (pedidos.length === 0) return [];
    if (!tarifa) {
      throw new BadRequestException(
        "No hay una tarifa por viaje configurada — cargala en Facturación → Transportistas antes de calcular la liquidación.",
      );
    }

    return calcularLiquidacionTransportistas(pedidos, tarifa.monto);
  }
}
