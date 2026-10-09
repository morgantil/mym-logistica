import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  EstadoImportacion,
  EstadoSimpliroute,
  EstadoValidacion,
  ResolucionDireccion,
  TipoServicio,
  TipoServicioCliente,
} from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { DestinatariosService } from "../../destinatarios/application/destinatarios.service";
import { PedidosService } from "../../pedidos/application/pedidos.service";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { ZonasTarifariasService } from "../../zonas-tarifarias/application/zonas-tarifarias.service";
import { NORMALIZADOR_DIRECCIONES, NormalizadorDireccionesPort } from "../../geografia/domain/normalizador-direcciones.port";
import { agruparLineasEnPedidos, LineaExcelImportada } from "../../pedidos/domain/pedido";
import { CampoCanonico, MapeoColumnas } from "../domain/campo-canonico";
import {
  IMPORTACION_EXCEL_REPOSITORIO,
  ImportacionExcelRepositorio,
} from "../domain/importacion-excel.repositorio";
import { LECTOR_EXCEL, LectorExcelPort } from "../domain/lector-excel.port";
import { completarMapeoGuardado, intentarMapeoAutomatico } from "../domain/mapeo-columnas";
import {
  PERFIL_IMPORTACION_REPOSITORIO,
  PerfilImportacionRepositorio,
} from "../domain/perfil-importacion.repositorio";
import { transformarFila } from "../domain/transformar-fila";
import { transformarFilaMedicamento } from "../domain/transformar-fila-medicamento";
import { resolverAfiliadosIlegibles } from "../domain/afiliado-ilegible";
import { PerfilGuardado } from "../domain/perfil-importacion.repositorio";
import { ReglaImportacionService } from "./regla-importacion.service";
import { SinonimoRecetaService } from "./sinonimo-receta.service";

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

export type ResultadoImportacion = ResultadoImportacionCompleta | ResultadoRequiereMapeoManual;

@Injectable()
export class ImportarExcelService {
  constructor(
    @Inject(LECTOR_EXCEL) private readonly lectorExcel: LectorExcelPort,
    @Inject(PERFIL_IMPORTACION_REPOSITORIO)
    private readonly perfilesRepositorio: PerfilImportacionRepositorio,
    @Inject(IMPORTACION_EXCEL_REPOSITORIO)
    private readonly importacionesRepositorio: ImportacionExcelRepositorio,
    @Inject(NORMALIZADOR_DIRECCIONES) private readonly normalizadorDirecciones: NormalizadorDireccionesPort,
    private destinatariosService: DestinatariosService,
    private pedidosService: PedidosService,
    private zonasChoferesService: ZonasChoferesService,
    private zonasTarifariasService: ZonasTarifariasService,
    private sinonimoRecetaService: SinonimoRecetaService,
    private reglaImportacionService: ReglaImportacionService,
    private clientesService: ClientesService,
  ) {}

  listarUsuariosImportadores(): Promise<{ id: string; nombre: string }[]> {
    return this.importacionesRepositorio.listarUsuariosImportadores();
  }

  // Decisión 2026-09-29 (mismo hallazgo que las tarifas: nada impedía
  // importar un Excel de Medicamentos para un cliente de Pañales, o al
  // revés) — mismo criterio que FacturacionService.validarTipoServicioDeCliente.
  private async validarTipoServicioDeCliente(clienteId: string, tipoServicio: TipoServicio): Promise<void> {
    const cliente = await this.clientesService.buscarPorId(clienteId);
    if (!cliente) throw new BadRequestException(`Cliente ${clienteId} no encontrado.`);
    if (cliente.tipoServicio === TipoServicioCliente.AMBOS) return;
    const tipoDelCliente =
      cliente.tipoServicio === TipoServicioCliente.PANAL ? TipoServicio.PANAL : TipoServicio.MEDICAMENTO;
    if (tipoDelCliente !== tipoServicio) {
      const etiqueta = (t: TipoServicio) => (t === TipoServicio.PANAL ? "Pañales" : "Medicamentos");
      throw new BadRequestException(
        `"${cliente.nombre}" está configurado como ${etiqueta(tipoDelCliente)} — no se puede importar un archivo de ${etiqueta(tipoServicio)} para este cliente.`,
      );
    }
  }

  // Punto de entrada. Elegir el cliente es obligatorio siempre — decisión
  // 2026-09-16 (Leonardo, QA): la detección automática por nombre de archivo
  // (`detectarClientePorNombreArchivo`, eliminada) era un riesgo real, no solo
  // cosmético — un patrón corto y genérico como "BIO" (Biosíntesis) podía
  // matchear el nombre de cualquier archivo que contuviera esas letras y
  // asignar el cliente equivocado en silencio, sin ningún aviso.
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
    clienteId: string;
    tipoServicio?: TipoServicio;
    // Hoja del Excel a leer (decisión 2026-09-24). Si se informa, queda
    // guardada en el perfil del cliente; si no, se usa la del perfil o la primera.
    nombreHoja?: string;
    // El archivo no trae fila de encabezados (Farmaet) — columnas por letra.
    // Sin informar (undefined) se usa lo guardado en el perfil del cliente.
    sinEncabezado?: boolean;
  }): Promise<ResultadoImportacion> {
    const tipoServicio = params.tipoServicio ?? TipoServicio.PANAL;
    await this.validarTipoServicioDeCliente(params.clienteId, tipoServicio);
    const perfil = await this.perfilesRepositorio.buscarPorCliente(params.clienteId, tipoServicio);
    const informadas = { nombreHoja: params.nombreHoja?.trim() || undefined, sinEncabezado: params.sinEncabezado };
    const opciones = this.opcionesDeLectura(perfil, informadas);
    const { encabezados, filas } = await this.lectorExcel.leer(params.buffer, opciones);
    return this.resolverMapeoYProcesar(
      params.clienteId,
      encabezados,
      filas,
      params.nombreArchivo,
      params.usuarioId,
      params.fechaEntrega,
      tipoServicio,
      perfil,
      informadas,
      opciones.sinEncabezado ? 1 : 2,
    );
  }

  // Hoja y encabezados: lo que se informó ahora gana, si no lo guardado en el
  // perfil del cliente, si no los valores por defecto (primera hoja, con encabezados).
  private opcionesDeLectura(
    perfil: PerfilGuardado | null,
    informadas: { nombreHoja?: string; sinEncabezado?: boolean },
  ) {
    return {
      nombreHoja: informadas.nombreHoja ?? perfil?.nombreHoja ?? undefined,
      sinEncabezado: informadas.sinEncabezado ?? perfil?.sinEncabezado ?? false,
    };
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
    tipoServicio?: TipoServicio;
    nombreHoja?: string;
    sinEncabezado?: boolean;
  }): Promise<ResultadoImportacion> {
    const tipoServicio = params.tipoServicio ?? TipoServicio.PANAL;
    await this.validarTipoServicioDeCliente(params.clienteId, tipoServicio);
    const perfil = await this.perfilesRepositorio.buscarPorCliente(params.clienteId, tipoServicio);
    const informadas = { nombreHoja: params.nombreHoja?.trim() || undefined, sinEncabezado: params.sinEncabezado };
    const opciones = this.opcionesDeLectura(perfil, informadas);
    const { encabezados, filas } = await this.lectorExcel.leer(params.buffer, opciones);
    const { mapeo: automatico } = intentarMapeoAutomatico(encabezados, tipoServicio);
    const mapeoCompleto = { ...automatico, ...params.mapeoManual };

    await this.perfilesRepositorio.guardar(
      params.clienteId,
      tipoServicio,
      mapeoCompleto,
      params.usuarioId,
      informadas,
    );

    return this.ejecutarPipeline(
      params.clienteId,
      filas,
      mapeoCompleto,
      params.nombreArchivo,
      params.usuarioId,
      params.fechaEntrega,
      tipoServicio,
      opciones.sinEncabezado ? 1 : 2,
    );
  }

  private async resolverMapeoYProcesar(
    clienteId: string,
    encabezados: string[],
    filas: Record<string, unknown>[],
    nombreArchivo: string,
    usuarioId: string,
    fechaEntrega: string,
    tipoServicio: TipoServicio,
    perfil: PerfilGuardado | null,
    informadas: { nombreHoja?: string; sinEncabezado?: boolean },
    primeraFilaDatos: number,
  ): Promise<ResultadoImportacion> {
    if (perfil) {
      const cambioHoja = informadas.nombreHoja !== undefined && informadas.nombreHoja !== perfil.nombreHoja;
      const cambioEncabezado =
        informadas.sinEncabezado !== undefined && informadas.sinEncabezado !== perfil.sinEncabezado;
      if (cambioHoja || cambioEncabezado) {
        await this.perfilesRepositorio.actualizarOpcionesLectura(clienteId, tipoServicio, informadas, usuarioId);
      }
      // Suma columnas nuevas que este archivo trae y el perfil no tenía (ver
      // completarMapeoGuardado) y las deja guardadas.
      const mapeoCompleto = completarMapeoGuardado(perfil.mapeo, intentarMapeoAutomatico(encabezados, tipoServicio).mapeo);
      if (Object.keys(mapeoCompleto).length > Object.keys(perfil.mapeo).length) {
        await this.perfilesRepositorio.guardar(clienteId, tipoServicio, mapeoCompleto, usuarioId);
      }
      return this.ejecutarPipeline(
        clienteId,
        filas,
        mapeoCompleto,
        nombreArchivo,
        usuarioId,
        fechaEntrega,
        tipoServicio,
        primeraFilaDatos,
      );
    }

    const { mapeo, camposObligatoriosFaltantes } = intentarMapeoAutomatico(encabezados, tipoServicio);

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
    await this.perfilesRepositorio.guardar(clienteId, tipoServicio, mapeo, null, informadas);
    return this.ejecutarPipeline(
      clienteId,
      filas,
      mapeo,
      nombreArchivo,
      usuarioId,
      fechaEntrega,
      tipoServicio,
      primeraFilaDatos,
    );
  }

  private async ejecutarPipeline(
    clienteId: string,
    filas: Record<string, unknown>[],
    mapeo: MapeoColumnas,
    nombreArchivo: string,
    usuarioId: string,
    fechaEntrega: string,
    tipoServicio: TipoServicio,
    // Número de fila del Excel donde arrancan los datos (2 si hay encabezados,
    // 1 si no) — para indicar bien la fila en los errores.
    primeraFilaDatos = 2,
  ): Promise<ResultadoImportacionCompleta> {
    if (filas.length === 0) {
      throw new BadRequestException("El Excel no tiene filas de datos.");
    }

    // Para resolverParaPedido más abajo — decisión 2026-09-30, ver
    // Cliente.facturaPorCordon (schema.prisma).
    const cliente = await this.clientesService.buscarPorId(clienteId);
    if (!cliente) throw new BadRequestException(`Cliente ${clienteId} no encontrado.`);

    const { id: importacionId } = await this.importacionesRepositorio.crear({
      clienteId,
      nombreArchivo,
      usuarioId,
    });

    // Reglas editables del cliente (R-0011 → RR, URGENCIA → Urgente, quitar
    // "OSDE" del afiliado…) — por ahora solo las usa el importador de medicamentos.
    const reglas =
      tipoServicio === TipoServicio.MEDICAMENTO
        ? await this.reglaImportacionService.listarActivas(clienteId, tipoServicio)
        : [];

    const lineasValidas: LineaExcelImportada[] = [];
    const filasConError: { fila: number; errores: string[] }[] = [];

    // Farmaet/Bella Vista (transformarFilaMedicamento) devuelven 0-2 líneas
    // por fila (Bella Vista puede traer Bulto Y Bolsa a la vez, ver
    // TEMAS_PENDIENTES.md §13.19) — pañales (transformarFila) siempre 1.
    filas.forEach((filaCruda, indice) => {
      if (tipoServicio === TipoServicio.MEDICAMENTO) {
        const resultado = transformarFilaMedicamento(filaCruda, mapeo, clienteId, fechaEntrega, reglas);
        if (resultado.valida) {
          lineasValidas.push(...resultado.lineas);
        } else {
          filasConError.push({ fila: indice + primeraFilaDatos, errores: resultado.errores });
        }
        return;
      }

      const resultado = transformarFila(filaCruda, mapeo, clienteId, fechaEntrega);
      if (resultado.valida && resultado.linea) {
        lineasValidas.push(resultado.linea);
      } else {
        // +2: fila 1 es el encabezado, y las filas de datos arrancan visualmente en 2.
        filasConError.push({ fila: indice + primeraFilaDatos, errores: resultado.errores });
      }
    });

    // Afiliados truncados por Excel ("6.04E+14"): se recuperan desde el mismo
    // archivo o se reemplazan por un identificador por nombre (ver
    // afiliado-ilegible.ts). Solo medicamentos: es el caso real que se vio.
    const lineasParaAgrupar =
      tipoServicio === TipoServicio.MEDICAMENTO ? resolverAfiliadosIlegibles(lineasValidas) : lineasValidas;
    const grupos = agruparLineasEnPedidos(lineasParaAgrupar);
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
      // TECNICO.md. A partir de ahí, la zona tarifaria se resuelve en orden:
      // CABA siempre directo; si el cliente no factura por Cordón (decisión
      // 2026-09-30, Cliente.facturaPorCordon), va directo a la zona plana
      // "Provincia"; si factura por Cordón, por Partido (el más preciso,
      // decisión 2026-09-08 — las zonas de SimpliRoute cruzan varios
      // partidos reales cada una, se sacó ese mapeo del sistema); si no está
      // mapeado, fallback al mapeo configurable Localidad → ZonaTarifaria de
      // siempre. Nunca fija en código, nunca frena la importación si no se
      // puede resolver: el pedido queda sin zona tarifaria asignada, para
      // revisión manual.
      const clasificacionLocalidad = await this.normalizadorDirecciones.clasificarCabaProvincia(grupo.localidad);
      const zonaTarifariaId = await this.zonasTarifariasService.resolverParaPedido(
        clasificacionLocalidad?.clasificacion ?? null,
        grupo.localidad,
        clasificacionLocalidad?.partido ?? null,
        cliente.facturaPorCordon,
      );

      // Dos fuentes posibles de observación, pueden darse juntas: la nota que
      // venía pegada a la fecha en el Excel (grupo.notaFecha) y el/los
      // ticket(s) de las líneas agrupadas — ver LineaExcelImportada. La
      // alerta de dirección distinta al padrón ya NO va acá (decisión
      // 2026-09-22): tiene su propio campo bloqueante (alertaDireccionPendiente)
      // y dejarla en texto libre ensuciaba Observaciones. El ticket se guarda acá
      // (no en el campo `Pedido.ticket`, sin usar) para que salga impreso en
      // la etiqueta sin tocar el generador de PDF (decisión 2026-09-01).
      // Cada producto guarda su propio ticket (decisión 2026-09-07: si dos
      // líneas agrupadas vienen de órdenes de origen distintas, no se pierde
      // ninguna) — acá solo se resumen los valores *distintos* para no
      // repetir el mismo ticket una vez por producto cuando todos son iguales
      // (el caso más común).
      const ticketsDistintos = [...new Set(grupo.productos.map((producto) => producto.ticket).filter(Boolean))];
      const observacionesPartes = [
        grupo.notaFecha,
        grupo.entreCalles,
        grupo.afiliadoIlegible ? "Nº de afiliado ilegible en el archivo (Excel lo truncó)" : null,
        ticketsDistintos.length === 1
          ? `Ticket: ${ticketsDistintos[0]}`
          : ticketsDistintos.length > 1
            ? `Tickets: ${ticketsDistintos.join(", ")}`
            : null,
      ].filter((parte): parte is string => Boolean(parte));

      // Medicamentos (Bella Vista): una fila del Excel puede partirse en dos
      // líneas (Bulto+Bolsa) que comparten el mismo remito — contar tickets
      // distintos daría 1 en vez de la cantidad real entregada. Para
      // facturación (motor-facturacion.ts) lo que importa es cuántas unidades
      // originales se agruparon, no cuántos números de remito hay — ver
      // TEMAS_PENDIENTES.md §13.19 "Falta todavía". Pañales (Farmapal/Farmaet)
      // sigue con la fórmula de siempre: cada línea SÍ es un pedido de origen distinto.
      const cantidadPedidoOriginal =
        tipoServicio === TipoServicio.MEDICAMENTO ? grupo.totalUnidades : ticketsDistintos.length || 1;

      // Un pedido de Farmaet agrupa una línea por receta: cada valor distinto
      // ("ENV", "EV"…) se resuelve por separado contra el ABM y se unen los
      // resultados sin repetir.
      const canonicas: string[] = [];
      for (const valorReceta of grupo.receta ? grupo.receta.split(" / ") : []) {
        const resuelta = (await this.sinonimoRecetaService.resolver(valorReceta))?.valorCanonico;
        if (resuelta && !canonicas.includes(resuelta)) canonicas.push(resuelta);
      }
      const recetaResuelta = canonicas.length > 0 ? canonicas.join(" / ") : null;
      const esMedicamento = tipoServicio === TipoServicio.MEDICAMENTO;

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
        tipoServicio,
        observaciones: observacionesPartes.length > 0 ? observacionesPartes.join(" · ") : null,
        // Decisión 2026-09-16 (Leonardo, QA): antes esto solo quedaba en
        // `observaciones` (texto libre) y el pedido se podía enviar igual —
        // ahora bloquea el envío hasta resolverse (ver validar-envio.ts).
        alertaDireccionPendiente: Boolean(alertaDireccion),
        cantidadPedidoOriginal,
        zonaId,
        zonaNombre,
        choferId,
        choferNombre,
        estadoSimpliroute: encontrado ? EstadoSimpliroute.NO_ENVIADO : EstadoSimpliroute.NO_ENCONTRADO,
        // Ya pasó transformarFila/transformarFilaMedicamento (campos obligatorios
        // presentes) para llegar hasta acá.
        estadoValidacion: EstadoValidacion.VALIDO,
        productos: grupo.productos,
        receta: grupo.receta,
        recetaResuelta,
        tipoPedido: grupo.tipoPedido,
        retiroDeReceta: grupo.retiroDeReceta,
        tiempoDeEntrega: grupo.tiempoDeEntrega,
        horarioEntrega: grupo.horarioEntrega,
        prioridad: grupo.prioridad,
        // Medicamentos: el remito sale de las líneas y la cantidad de
        // bultos/etiquetas se calcula sola (una por Bolsa/Bulto, decisión
        // 2026-09-24) — sigue siendo editable a mano después. Pañales sigue
        // como siempre: sin bultos hasta que Logística los carga.
        remito: esMedicamento && ticketsDistintos.length > 0 ? ticketsDistintos.join(", ") : null,
        bultos: esMedicamento ? grupo.totalUnidades : null,
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
