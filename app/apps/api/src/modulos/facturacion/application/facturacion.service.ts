import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TipoServicio } from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { PedidosService } from "../../pedidos/application/pedidos.service";
import { ZonasTarifariasService } from "../../zonas-tarifarias/application/zonas-tarifarias.service";
import {
  FACTURACION_REPOSITORIO,
  FacturacionRepositorio,
} from "../domain/facturacion.repositorio";
import { PedidoParaFacturar, TarifasPorTipo, calcularFacturacionCliente } from "../domain/motor-facturacion";
import {
  ResumenChofer,
  calcularLiquidacionTransportistas,
} from "../domain/motor-liquidacion-transportistas";
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

  crearTarifa(clienteId: string, zonaTarifariaId: string, monto: number, vigenciaDesde: Date) {
    return this.repositorio.crearTarifa({ clienteId, zonaTarifariaId, monto, vigenciaDesde });
  }

  listarPorcentajes(clienteId: string) {
    return this.repositorio.listarPorcentajes(clienteId);
  }

  crearPorcentaje(clienteId: string, porcentaje: number, vigenciaDesde: Date) {
    return this.repositorio.crearPorcentaje({ clienteId, porcentaje, vigenciaDesde });
  }

  listarTarifasTransportista() {
    return this.repositorio.listarTarifasTransportista();
  }

  crearTarifaTransportista(monto: number, vigenciaDesde: Date) {
    return this.repositorio.crearTarifaTransportista({ monto, vigenciaDesde });
  }

  listarGrupos(clienteId: string, mes: number, anio: number) {
    return this.repositorio.listarGrupos(clienteId, mes, anio);
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

    const { fechaDesde, fechaHasta } = rangoDelMes(mes, anio);
    const pedidos = await this.pedidosService.listarFacturables({ clienteId, fechaDesde, fechaHasta });

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
      pedidosParaFacturar.push({
        id: pedido.id,
        clienteId: pedido.clienteId,
        tipoServicio: pedido.tipoServicio,
        fechaProgramada: pedido.fechaProgramada.toISOString().slice(0, 10),
        direccionUsada: pedido.direccionUsada,
        zonaTarifariaId: pedido.zonaTarifariaId,
      });
    }

    // Solo se exige la tarifa de la zona que realmente aparece entre los
    // pedidos a facturar — un cliente que solo entrega en CABA no debería
    // tener que cargar una tarifa de Cordón 1 que nunca va a usar.
    const hoy = new Date();
    const zonasUsadas = new Set(pedidosParaFacturar.map((p) => p.zonaTarifariaId));
    const todasLasZonas = await this.zonasTarifariasService.listar();
    const nombreDeZona = (id: string) => todasLasZonas.find((z) => z.id === id)?.nombre ?? id;
    const tarifas: TarifasPorTipo = {};
    for (const zonaTarifariaId of zonasUsadas) {
      const tarifa = await this.repositorio.tarifaVigente(clienteId, zonaTarifariaId, hoy);
      if (!tarifa) {
        throw new BadRequestException(
          `Falta una tarifa vigente de "${nombreDeZona(zonaTarifariaId)}" para este cliente — cargala antes de generar la facturación.`,
        );
      }
      tarifas[zonaTarifariaId] = tarifa.monto;
    }

    // El porcentaje del segundo servicio solo hace falta si hay una entrega
    // unificada real (pañales + medicamentos) — con solo pañales (única
    // etapa en alcance hoy) nunca se usa, así que no se exige configurarlo
    // de antemano. Ver DOCUMENTO FUNCIONAL.md §37 (medicamentos, Etapa 2).
    const hayMedicamentos = pedidosParaFacturar.some((p) => p.tipoServicio === TipoServicio.MEDICAMENTO);
    const porcentajeVigente = await this.repositorio.porcentajeVigente(clienteId, hoy);
    if (hayMedicamentos && porcentajeVigente === null) {
      throw new BadRequestException(
        "Hay pedidos de medicamentos para unificar pero no hay un porcentaje del segundo servicio configurado.",
      );
    }

    const viajes = calcularFacturacionCliente(
      pedidosParaFacturar,
      tarifas,
      porcentajeVigente?.porcentaje ?? 0,
    );

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
      this.repositorio.tarifaTransportistaVigente(new Date()),
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
