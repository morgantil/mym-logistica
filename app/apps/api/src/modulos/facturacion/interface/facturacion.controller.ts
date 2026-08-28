import { Body, Controller, Get, Header, Post, Query, StreamableFile } from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { FacturacionService } from "../application/facturacion.service";
import { CrearPorcentajeDto } from "./dto/crear-porcentaje.dto";
import { CrearTarifaDto } from "./dto/crear-tarifa.dto";
import { CrearTarifaTransportistaDto } from "./dto/crear-tarifa-transportista.dto";
import { MesAnioDto } from "./dto/mes-anio.dto";
import { PeriodoDto } from "./dto/periodo.dto";

// Todo el módulo queda detrás de Rol.FACTURACION/ADMINISTRACION — a
// diferencia de otras pantallas (Clientes, Pedidos), acá no hay lecturas
// públicas para cualquier usuario autenticado: es plata real (§21-§32 funcional).
@Roles(Rol.FACTURACION, Rol.ADMINISTRACION)
@Controller("facturacion")
export class FacturacionController {
  constructor(private facturacionService: FacturacionService) {}

  @Get("tarifas")
  listarTarifas(@Query("clienteId") clienteId: string) {
    return this.facturacionService.listarTarifas(clienteId);
  }

  @Post("tarifas")
  crearTarifa(@Body() dto: CrearTarifaDto) {
    return this.facturacionService.crearTarifa(dto.clienteId, dto.zonaTarifariaId, dto.monto, dto.vigenciaDesde);
  }

  @Get("porcentaje-segundo-servicio")
  listarPorcentajes(@Query("clienteId") clienteId: string) {
    return this.facturacionService.listarPorcentajes(clienteId);
  }

  @Post("porcentaje-segundo-servicio")
  crearPorcentaje(@Body() dto: CrearPorcentajeDto) {
    return this.facturacionService.crearPorcentaje(dto.clienteId, dto.porcentaje, dto.vigenciaDesde);
  }

  // Liquidación a transportistas — §4 TEMAS_PENDIENTES.md: monto por viaje
  // configurable, sin clienteId.
  @Get("tarifa-transportista")
  listarTarifasTransportista() {
    return this.facturacionService.listarTarifasTransportista();
  }

  @Post("tarifa-transportista")
  crearTarifaTransportista(@Body() dto: CrearTarifaTransportistaDto) {
    return this.facturacionService.crearTarifaTransportista(dto.monto, dto.vigenciaDesde);
  }

  // §4.2 TEMAS_PENDIENTES.md: cuántos viajes hizo cada chofer en el mes y
  // cuánto se le debe pagar — sincroniza estados reales de SimpliRoute antes
  // de calcular (ver FacturacionService.liquidacionTransportistas).
  @Get("liquidacion-transportistas")
  liquidacionTransportistas(@Query() query: MesAnioDto) {
    return this.facturacionService.liquidacionTransportistas(query.mes, query.anio);
  }

  // §21 funcional ("al cierre de cada mes, por cliente"): trae los grupos ya
  // generados (BORRADOR o CONFIRMADO) para ese cliente/mes/año.
  @Get("grupos")
  listarGrupos(@Query() query: PeriodoDto) {
    return this.facturacionService.listarGrupos(query.clienteId, query.mes, query.anio);
  }

  // Corre el motor de reglas y deja el resultado en BORRADOR — se puede
  // llamar de nuevo para recalcular mientras no esté confirmado.
  @Post("vista-previa")
  generarVistaPrevia(@Body() dto: PeriodoDto) {
    return this.facturacionService.generarVistaPrevia(dto.clienteId, dto.mes, dto.anio);
  }

  @Post("confirmar")
  confirmar(@Body() dto: PeriodoDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.facturacionService.confirmar(dto.clienteId, dto.mes, dto.anio, usuario.id);
  }

  // §31 funcional: descarga directa del reporte mensual en Excel. StreamableFile
  // es la forma correcta en Nest de devolver binario — un `Buffer` devuelto
  // directo (incluso con @Res({passthrough:true})) pasa por el serializador
  // JSON de Nest y llega al navegador como `{"type":"Buffer","data":[...]}`
  // en vez del .xlsx real (bug real encontrado en QA el 2026-08-11).
  @Get("reporte-mensual")
  @Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  async descargarReporteMensual(@Query() query: PeriodoDto): Promise<StreamableFile> {
    const buffer = await this.facturacionService.generarReporteMensual(query.clienteId, query.mes, query.anio);
    const nombreArchivo = `facturacion-${query.anio}-${String(query.mes).padStart(2, "0")}.xlsx`;
    return new StreamableFile(buffer, { disposition: `attachment; filename="${nombreArchivo}"` });
  }
}
