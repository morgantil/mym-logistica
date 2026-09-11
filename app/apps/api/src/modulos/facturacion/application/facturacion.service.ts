import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TipoEnvase, TipoServicio } from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { PedidoFacturable } from "../../pedidos/domain/pedido";
import { PedidosService } from "../../pedidos/application/pedidos.service";
import { ZonasTarifariasService } from "../../zonas-tarifarias/application/zonas-tarifarias.service";
import { determinarClasificacionMedicamento } from "../domain/clasificacion-medicamento";
import {
  FACTURACION_REPOSITORIO,
  FacturacionRepositorio,
} from "../domain/facturacion.repositorio";
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
import { calcularUnificacionesEntreClientes } from "../domain/unificacion-cruzada";
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

  crearPorcentaje(clienteId: string, porcentajePanal: number, porcentajeMedicamento: number) {
    return this.repositorio.crearPorcentaje({ clienteId, porcentajePanal, porcentajeMedicamento });
  }

  actualizarPorcentaje(
    id: string,
    datos: { porcentajePanal?: number; porcentajeMedicamento?: number; activa?: boolean },
  ) {
    return this.repositorio.actualizarPorcentaje(id, datos);
  }

  listarCombinaciones() {
    return this.repositorio.listarCombinaciones();
  }

  crearCombinacion(clienteMedicamentoId: string, clientePanalId: string) {
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
      });
    }

    return { pedidosParaFacturar, excluidos };
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
      const { viajes, propiosRestantes: sinUnificar } = calcularUnificacionesEntreClientes(
        propiosPanal,
        socios,
        tarifas,
        porcentajeActivoCliente?.porcentajePanal ?? 0,
      );
      viajesCruzados.push(...viajes);
      pedidosRestantes = [...otros, ...sinUnificar];
    }

    if (combosComoMedicamento.length > 0) {
      const propiosMedicamento = pedidosRestantes.filter((p) => p.tipoServicio === TipoServicio.MEDICAMENTO);
      const otros = pedidosRestantes.filter((p) => p.tipoServicio !== TipoServicio.MEDICAMENTO);
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
      const { viajes, propiosRestantes: sinUnificar } = calcularUnificacionesEntreClientes(
        propiosMedicamento,
        socios,
        tarifas,
        porcentajeActivoCliente?.porcentajeMedicamento ?? 0,
      );
      viajesCruzados.push(...viajes);
      pedidosRestantes = [...otros, ...sinUnificar];
    }

    const viajesPropios = calcularFacturacionCliente(pedidosRestantes, tarifas, {
      panal: porcentajeActivoCliente?.porcentajePanal ?? 0,
      medicamento: porcentajeActivoCliente?.porcentajeMedicamento ?? 0,
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
        porcentajeMedicamentoAplicado: viaje.detalleUnificacion?.porcentajeMedicamento ?? null,
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
    return this.repositorio.confirmar(clienteId, mes, anio, usuarioId);
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
