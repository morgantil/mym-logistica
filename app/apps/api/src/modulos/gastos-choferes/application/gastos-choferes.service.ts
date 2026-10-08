import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TipoGastoChofer } from "@mym/shared-types";
import { LECTOR_EXCEL, LectorExcelPort } from "../../importadores/domain/lector-excel.port";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { DatosFiscalesCombustible, GastoChofer, ResumenImportacionGastos } from "../domain/gasto-chofer";
import {
  DatosActualizarGastoChofer,
  FiltroGastosChofer,
  GASTOS_CHOFERES_REPOSITORIO,
  GastosChoferesRepositorio,
} from "../domain/gastos-choferes.repositorio";
import { ChoferParaMatchear, VehiculoParaMatchear, matchearChofer } from "../domain/matchear-chofer";
import { parsearCombustible } from "../domain/parsear-combustible";
import { parsearPeajes } from "../domain/parsear-peajes";
import { generarGastosChoferesExcel } from "../infrastructure/gastos-choferes-excel.generador";

const HOJA_COMBUSTIBLE = "HWCompra-modelo";
const HOJA_PEAJES = "PEAJES";

// Peaje no trae comprobante fiscal (la hoja PEAJES solo tiene chofer+monto)
// — todos estos campos quedan null a propósito, nunca se inventan.
const SIN_DATOS_FISCALES: DatosFiscalesCombustible = {
  fechaRecepcion: null,
  comprobanteCodigo: null,
  comprobanteTipo: null,
  comprobanteSucursal: null,
  comprobanteNumero: null,
  tipoDocumento: null,
  cuit: null,
  domicilio: null,
  codigoPostal: null,
  provincia: null,
  condicionFiscal: null,
  codigoNeto: null,
  netoGravado: null,
  alicuota: null,
  ivaLiquidado: null,
  ivaCredito: null,
  codigoNgEx: null,
  conceptosNgEx: null,
  codigoPR: null,
  percepcionRetencion: null,
  provinciaPR: null,
};

@Injectable()
export class GastosChoferesService {
  constructor(
    @Inject(GASTOS_CHOFERES_REPOSITORIO) private readonly repositorio: GastosChoferesRepositorio,
    @Inject(LECTOR_EXCEL) private readonly lectorExcel: LectorExcelPort,
    private zonasChoferesService: ZonasChoferesService,
  ) {}

  // Importa el Excel real que manda la tarjeta de combustible, tal cual
  // viene (ítem desbloqueado 2026-10-05, Leonardo mandó el formato real) —
  // dos hojas: HWCompra-modelo (combustible, una fila por factura, con
  // fecha propia) y PEAJES (peajes del mes, sin fecha por fila — por eso
  // `mes`/`anio` son obligatorios acá, aplican a TODAS las líneas de esa
  // hoja, mismo criterio que `fechaEntrega` en ImportarExcelService).
  async importar(datos: {
    buffer: Buffer;
    nombreArchivo: string;
    mes: number;
    anio: number;
  }): Promise<ResumenImportacionGastos[]> {
    const [combustibleLeido, peajesLeido] = await Promise.all([
      this.lectorExcel.leer(datos.buffer, { nombreHoja: HOJA_COMBUSTIBLE }),
      this.lectorExcel.leer(datos.buffer, { nombreHoja: HOJA_PEAJES, sinEncabezado: true }),
    ]);

    const lineasCombustible = parsearCombustible(combustibleLeido.filas);
    const lineasPeajes = parsearPeajes(peajesLeido.filas);
    if (lineasCombustible.length === 0 && lineasPeajes.length === 0) {
      throw new BadRequestException(
        `No se encontró ninguna línea válida en las hojas "${HOJA_COMBUSTIBLE}" ni "${HOJA_PEAJES}".`,
      );
    }

    const [choferesCrudos, vehiculosCrudos] = await Promise.all([
      this.zonasChoferesService.listarChoferes(),
      this.zonasChoferesService.listarVehiculos(),
    ]);
    const choferes: ChoferParaMatchear[] = choferesCrudos.map((chofer) => ({
      id: String(chofer.id),
      nombre: chofer.nombre,
    }));
    const vehiculos: VehiculoParaMatchear[] = vehiculosCrudos.map((vehiculo) => ({
      patente: vehiculo.patente,
      choferPredeterminadoId:
        vehiculo.choferPredeterminadoId !== null ? String(vehiculo.choferPredeterminadoId) : null,
    }));

    const fechaPeajes = new Date(Date.UTC(datos.anio, datos.mes - 1, 1));

    const datosCombustible = lineasCombustible.map((linea) => {
      const { choferTexto, ...datosFiscales } = linea;
      const matcheado = matchearChofer(choferTexto, choferes, vehiculos);
      return {
        ...datosFiscales,
        tipo: TipoGastoChofer.COMBUSTIBLE,
        choferId: matcheado?.choferId ?? null,
        choferNombre: matcheado?.choferNombre ?? null,
        choferNombreOriginal: choferTexto,
        archivoOrigen: datos.nombreArchivo,
      };
    });
    const datosPeajes = lineasPeajes.map((linea) => {
      const matcheado = matchearChofer(linea.choferTexto, choferes, vehiculos);
      return {
        ...SIN_DATOS_FISCALES,
        tipo: TipoGastoChofer.PEAJE,
        fecha: fechaPeajes,
        monto: linea.monto,
        choferId: matcheado?.choferId ?? null,
        choferNombre: matcheado?.choferNombre ?? null,
        choferNombreOriginal: linea.choferTexto,
        proveedor: null,
        comprobante: null,
        archivoOrigen: datos.nombreArchivo,
      };
    });

    await this.repositorio.crearVarios([...datosCombustible, ...datosPeajes]);

    const resumir = (
      tipo: TipoGastoChofer,
      items: { choferId: string | null }[],
    ): ResumenImportacionGastos => ({
      tipo,
      totalFilas: items.length,
      matcheados: items.filter((item) => item.choferId !== null).length,
      sinMatchear: items.filter((item) => item.choferId === null).length,
    });

    return [
      resumir(TipoGastoChofer.COMBUSTIBLE, datosCombustible),
      resumir(TipoGastoChofer.PEAJE, datosPeajes),
    ];
  }

  listar(filtro: FiltroGastosChofer): Promise<GastoChofer[]> {
    return this.repositorio.listar(filtro);
  }

  // Resolución manual de un gasto que no matcheó ningún chofer al importar
  // (texto raro, patente sin vehículo, un par de choferes tipo
  // "LUCIA-MATIAS") — mismo criterio que resolverAlertaDireccion en Pedidos.
  async asignarChofer(id: string, choferId: string): Promise<GastoChofer> {
    const chofer = await this.resolverChoferOFallar(choferId);
    return this.repositorio.asignarChofer(id, chofer.id, chofer.nombre);
  }

  private async resolverChoferOFallar(choferId: string): Promise<{ id: string; nombre: string }> {
    const choferes = await this.zonasChoferesService.listarChoferes();
    const chofer = choferes.find((candidato) => String(candidato.id) === choferId);
    if (!chofer) throw new NotFoundException(`Chofer ${choferId} no encontrado.`);
    return { id: String(chofer.id), nombre: chofer.nombre };
  }

  // ABM manual (item 14.1 TEMAS_PENDIENTES.md, reunión 2026-10-06) — a
  // diferencia de `importar`, acá el chofer siempre se elige de un
  // desplegable (nunca texto libre), así que `choferNombreOriginal` no tiene
  // un "texto original" distinto que preservar: se completa igual que
  // `choferNombre`. `archivoOrigen` queda con un valor fijo que distingue
  // estas filas de las importadas, sin necesitar una columna nueva.
  private static readonly ORIGEN_MANUAL = "Carga manual";

  async crear(
    datos: {
      tipo: TipoGastoChofer;
      fecha: Date;
      monto: number;
      choferId: string;
      proveedor: string | null;
      comprobante: string | null;
    } & Partial<DatosFiscalesCombustible>,
  ): Promise<GastoChofer> {
    const chofer = await this.resolverChoferOFallar(datos.choferId);
    return this.repositorio.crear({
      ...SIN_DATOS_FISCALES,
      ...datos,
      choferId: chofer.id,
      choferNombre: chofer.nombre,
      choferNombreOriginal: chofer.nombre,
      archivoOrigen: GastosChoferesService.ORIGEN_MANUAL,
    });
  }

  async actualizar(
    id: string,
    datos: {
      tipo?: TipoGastoChofer;
      fecha?: Date;
      monto?: number;
      choferId?: string;
      proveedor?: string | null;
      comprobante?: string | null;
    } & Partial<DatosFiscalesCombustible>,
  ): Promise<GastoChofer> {
    const { choferId, ...resto } = datos;
    const cambios: DatosActualizarGastoChofer = { ...resto };
    if (choferId !== undefined) {
      const chofer = await this.resolverChoferOFallar(choferId);
      cambios.choferId = chofer.id;
      cambios.choferNombre = chofer.nombre;
    }
    return this.repositorio.actualizar(id, cambios);
  }

  eliminar(id: string): Promise<void> {
    return this.repositorio.eliminar(id);
  }

  async generarReporteExcel(filtro: FiltroGastosChofer): Promise<Buffer> {
    const gastos = await this.repositorio.listar(filtro);
    return generarGastosChoferesExcel(gastos);
  }
}
