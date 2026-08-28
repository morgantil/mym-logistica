import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { EstadoImportacion, EstadoSimpliroute, EstadoValidacion, ResolucionDireccion, TipoServicio } from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { PedidosService } from "../../pedidos/application/pedidos.service";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { ZonasTarifariasService } from "../../zonas-tarifarias/application/zonas-tarifarias.service";
import { NORMALIZADOR_DIRECCIONES, NormalizadorDireccionesPort } from "../../geografia/domain/normalizador-direcciones.port";
import { agruparLineasEnPedidos, LineaExcelPanales } from "../../pedidos/domain/pedido";
import { CampoCanonico, MapeoColumnas } from "../domain/campo-canonico";
import {
  IMPORTACION_EXCEL_REPOSITORIO,
  ImportacionExcelRepositorio,
} from "../domain/importacion-excel.repositorio";
import { LECTOR_EXCEL, LectorExcelPort } from "../domain/lector-excel.port";
import { intentarMapeoAutomatico } from "../domain/mapeo-columnas";
import {
  PERFIL_IMPORTACION_REPOSITORIO,
  PerfilImportacionRepositorio,
} from "../domain/perfil-importacion.repositorio";
import { transformarFila } from "../domain/transformar-fila";

export interface ResultadoImportacionCompleta {
  estado: "completada";
  importacionId: string;
  clienteId: string;
  pedidosCreados: number;
  filasConError: { fila: number; errores: string[] }[];
  alertasDireccion: number;
}

export interface ResultadoRequiereMapeoManual {
  estado: "requiereMapeoManual";
  clienteId: string;
  encabezadosDisponibles: string[];
  camposObligatoriosFaltantes: CampoCanonico[];
  mapeoAutomaticoParcial: MapeoColumnas;
}

export interface ResultadoRequiereSeleccionCliente {
  estado: "requiereSeleccionCliente";
  nombreArchivo: string;
}

export type ResultadoImportacion =
  | ResultadoImportacionCompleta
  | ResultadoRequiereMapeoManual
  | ResultadoRequiereSeleccionCliente;

@Injectable()
export class ImportarExcelService {
  constructor(
    @Inject(LECTOR_EXCEL) private readonly lectorExcel: LectorExcelPort,
    @Inject(PERFIL_IMPORTACION_REPOSITORIO)
    private readonly perfilesRepositorio: PerfilImportacionRepositorio,
    @Inject(IMPORTACION_EXCEL_REPOSITORIO)
    private readonly importacionesRepositorio: ImportacionExcelRepositorio,
    @Inject(NORMALIZADOR_DIRECCIONES) private readonly normalizadorDirecciones: NormalizadorDireccionesPort,
    private clientesService: ClientesService,
    private destinatariosService: DestinatariosService,
    private pedidosService: PedidosService,
    private zonasChoferesService: ZonasChoferesService,
    private zonasTarifariasService: ZonasTarifariasService,
  ) {}

  // Punto de entrada — DOCUMENTO FUNCIONAL.md §5: el usuario no está obligado a
  // elegir el cliente antes de importar. Si no se puede detectar ni vino
  // `clienteIdManual`, se corta acá y se le pide al front que lo pida.
  //
  // `fechaEntrega` (ISO YYYY-MM-DD) es obligatoria — documento funcional v6
  // §4.1: "Antes de seleccionar el archivo, el usuario deberá informar
  // obligatoriamente el cliente y la fecha de entrega." Se aplica a todo el
  // lote, sin importar qué traiga el Excel (ver transformarFila).
  async procesarArchivo(params: {
    buffer: Buffer;
    nombreArchivo: string;
    usuarioId: string;
    fechaEntrega: string;
    clienteIdManual?: string;
  }): Promise<ResultadoImportacion> {
    const clienteId =
      params.clienteIdManual ??
      (await this.clientesService.detectarDesdeNombreArchivo(params.nombreArchivo))?.id;

    if (!clienteId) {
      return { estado: "requiereSeleccionCliente", nombreArchivo: params.nombreArchivo };
    }

    const { encabezados, filas } = await this.lectorExcel.leer(params.buffer);
    return this.resolverMapeoYProcesar(
      clienteId,
      encabezados,
      filas,
      params.nombreArchivo,
      params.usuarioId,
      params.fechaEntrega,
    );
  }

  // Segundo paso cuando el primero devolvió "requiereMapeoManual": el front
  // reenvía el mismo archivo + el mapeo que el usuario confirmó a mano (y la
  // misma fecha de entrega que ya había informado en el primer paso).
  async procesarArchivoConMapeoManual(params: {
    buffer: Buffer;
    nombreArchivo: string;
    usuarioId: string;
    clienteId: string;
    mapeoManual: MapeoColumnas;
    fechaEntrega: string;
  }): Promise<ResultadoImportacion> {
    const { encabezados, filas } = await this.lectorExcel.leer(params.buffer);
    const { mapeo: automatico } = intentarMapeoAutomatico(encabezados);
    const mapeoCompleto = { ...automatico, ...params.mapeoManual };

    await this.perfilesRepositorio.guardar(params.clienteId, mapeoCompleto, params.usuarioId);

    return this.ejecutarPipeline(
      params.clienteId,
      filas,
      mapeoCompleto,
      params.nombreArchivo,
      params.usuarioId,
      params.fechaEntrega,
    );
  }

  private async resolverMapeoYProcesar(
    clienteId: string,
    encabezados: string[],
    filas: Record<string, unknown>[],
    nombreArchivo: string,
    usuarioId: string,
    fechaEntrega: string,
  ): Promise<ResultadoImportacion> {
    const mapeoGuardado = await this.perfilesRepositorio.buscarPorCliente(clienteId);
    if (mapeoGuardado) {
      return this.ejecutarPipeline(clienteId, filas, mapeoGuardado, nombreArchivo, usuarioId, fechaEntrega);
    }

    const { mapeo, camposObligatoriosFaltantes } = intentarMapeoAutomatico(encabezados);

    if (camposObligatoriosFaltantes.length > 0) {
      return {
        estado: "requiereMapeoManual",
        clienteId,
        encabezadosDisponibles: encabezados,
        camposObligatoriosFaltantes,
        mapeoAutomaticoParcial: mapeo,
      };
    }

    // El diccionario de sinónimos alcanzó para mapear todo solo — se guarda
    // igual como perfil confirmado, así la próxima importación de este cliente
    // ni siquiera vuelve a pasar por acá.
    await this.perfilesRepositorio.guardar(clienteId, mapeo, null);
    return this.ejecutarPipeline(clienteId, filas, mapeo, nombreArchivo, usuarioId, fechaEntrega);
  }

  private async ejecutarPipeline(
    clienteId: string,
    filas: Record<string, unknown>[],
    mapeo: MapeoColumnas,
    nombreArchivo: string,
    usuarioId: string,
    fechaEntrega: string,
  ): Promise<ResultadoImportacionCompleta> {
    if (filas.length === 0) {
      throw new BadRequestException("El Excel no tiene filas de datos.");
    }

    const { id: importacionId } = await this.importacionesRepositorio.crear({
      clienteId,
      nombreArchivo,
      usuarioId,
    });

    const lineasValidas: LineaExcelPanales[] = [];
    const filasConError: { fila: number; errores: string[] }[] = [];

    filas.forEach((filaCruda, indice) => {
      const resultado = transformarFila(filaCruda, mapeo, clienteId, fechaEntrega);
      if (resultado.valida && resultado.linea) {
        lineasValidas.push(resultado.linea);
      } else {
        // +2: fila 1 es el encabezado, y las filas de datos arrancan visualmente en 2.
        filasConError.push({ fila: indice + 2, errores: resultado.errores });
      }
    });

    const grupos = agruparLineasEnPedidos(lineasValidas);
    let pedidosCreados = 0;
    let alertasDireccion = 0;

    for (const grupo of grupos) {
      const { destinatario, alertaDireccion } = await this.destinatariosService.procesarDesdeImportacion({
        clienteId,
        numeroAfiliado: grupo.numeroAfiliado,
        nombre: grupo.destinatario,
        direccionExcel: grupo.direccion,
        localidad: grupo.localidad,
        telefono: grupo.telefono,
      });

      // Sin UI de resolución todavía (Etapa 2): por defecto NO se toca el padrón
      // y se usa la dirección del Excel solo para este pedido — la opción más
      // segura de las tres del §11 funcional. Queda marcado en observaciones
      // para que "Revisión antes de enviar" (§17) lo levante después.
      let direccionUsada = grupo.direccion;
      let destinatarioActual = destinatario;
      if (alertaDireccion) {
        alertasDireccion += 1;
        const resuelto = await this.destinatariosService.resolverDiferenciaDireccion(
          destinatario.id,
          ResolucionDireccion.USAR_SOLO_ESTE_PEDIDO,
          alertaDireccion.direccionExcel,
          alertaDireccion.direccionPadron,
        );
        direccionUsada = resuelto.direccionAUsar;
      }

      // §9-§10 funcional: consulta a SimpliRoute (trae lat/lon geocodificadas
      // si el destinatario ya existe ahí). §12-§13: zona → chofer resuelto por
      // point-in-polygon contra el catálogo de Zonas de SimpliRoute, con
      // fallback a coincidencia por localidad si no hay coordenadas o no
      // matchea ninguna zona. Si no resuelve nada, queda "sin identificar"/
      // "sin asignar" tal cual pide el documento — no se inventa un valor.
      const { encontrado, destinatario: destinatarioSincronizado } =
        await this.destinatariosService.sincronizarConSimpliRoute(destinatarioActual, grupo.numeroAfiliado);
      destinatarioActual = destinatarioSincronizado;

      const { zonaId, zonaNombre, choferId, choferNombre } = await this.zonasChoferesService.resolverZonaChofer(
        destinatarioActual.latitud,
        destinatarioActual.longitud,
        grupo.localidad,
      );

      // §23 funcional + v6 §10.2: la clasificación CABA/Provincia se resuelve
      // con la API oficial de datos.gob.ar (georef-ar-api) — ver DOCUMENTO
      // TECNICO.md. A partir de ahí, la zona tarifaria (CABA o el Cordón que
      // corresponda) se resuelve en orden: CABA siempre directo; si no, por
      // la Zona de SimpliRoute ya resuelta arriba (más precisa, viene de
      // coordenadas reales — decisión 2026-08-26); si no está mapeada,
      // fallback al mapeo configurable Localidad → ZonaTarifaria de
      // siempre. Nunca fija en código, nunca frena la importación si no se
      // puede resolver: el pedido queda sin zona tarifaria asignada, para
      // revisión manual.
      const clasificacionCabaProvincia = await this.normalizadorDirecciones.clasificarCabaProvincia(
        direccionUsada,
        grupo.localidad,
      );
      const zonaTarifariaId = await this.zonasTarifariasService.resolverParaPedido(
        clasificacionCabaProvincia,
        grupo.localidad,
        zonaId,
      );

      // Dos fuentes posibles de observación, pueden darse juntas: la alerta de
      // dirección (arriba) y la nota que venía pegada a la fecha en el Excel
      // (grupo.notaFecha — ver LineaExcelPanales). Ninguna se pisa a la otra.
      const observacionesPartes = [
        alertaDireccion
          ? `Dirección diferente a la registrada en el padrón (padrón: "${alertaDireccion.direccionPadron}"). Pendiente de revisión.`
          : null,
        grupo.notaFecha,
      ].filter((parte): parte is string => Boolean(parte));

      await this.pedidosService.crear({
        clienteId,
        destinatarioId: destinatarioActual.id,
        importacionId,
        numeroAfiliado: grupo.numeroAfiliado,
        direccionOriginal: grupo.direccion,
        direccionUsada,
        localidad: grupo.localidad,
        zonaTarifariaId,
        fechaProgramada: new Date(grupo.fechaEntrega),
        tipoServicio: TipoServicio.PANAL,
        observaciones: observacionesPartes.length > 0 ? observacionesPartes.join(" · ") : null,
        zonaId,
        zonaNombre,
        choferId,
        choferNombre,
        estadoSimpliroute: encontrado ? EstadoSimpliroute.NO_ENVIADO : EstadoSimpliroute.NO_ENCONTRADO,
        // Ya pasó transformarFila (campos obligatorios presentes) para llegar hasta acá.
        estadoValidacion: EstadoValidacion.VALIDO,
        productos: grupo.productos,
      });
      pedidosCreados += 1;
    }

    const estadoFinal =
      filasConError.length > 0 ? EstadoImportacion.COMPLETADA_CON_ERRORES : EstadoImportacion.COMPLETADA;

    await this.importacionesRepositorio.actualizarEstado(importacionId, {
      estado: estadoFinal,
      totalFilas: filas.length,
      filasConError: filasConError.length,
    });

    return {
      estado: "completada",
      importacionId,
      clienteId,
      pedidosCreados,
      filasConError,
      alertasDireccion,
    };
  }
}
