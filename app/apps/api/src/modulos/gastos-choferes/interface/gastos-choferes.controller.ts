import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { GastosChoferesService } from "../application/gastos-choferes.service";
import { ActualizarGastoDto } from "./dto/actualizar-gasto.dto";
import { AsignarChoferDto } from "./dto/asignar-chofer.dto";
import { CrearGastoDto } from "./dto/crear-gasto.dto";
import { FiltroGastosDto } from "./dto/filtro-gastos.dto";

// ABM de combustible y peajes por chofer (ítem desbloqueado 2026-10-05) —
// mismos roles que el resto de Facturación: es plata real, no hay lecturas
// públicas para cualquier usuario autenticado.
@Roles(Rol.FACTURACION, Rol.ADMINISTRACION)
@Controller("gastos-choferes")
export class GastosChoferesController {
  constructor(private gastosChoferesService: GastosChoferesService) {}

  // `fechaHasta` inclusive tal como la elige el usuario — se lleva al día
  // siguiente para el `lt` de siempre (mismo criterio que Facturación).
  private extraerFiltro(query: FiltroGastosDto) {
    return {
      tipo: query.tipo,
      choferId: query.choferId,
      fechaDesde: query.fechaDesde ? new Date(`${query.fechaDesde}T00:00:00.000Z`) : undefined,
      fechaHasta: query.fechaHasta
        ? new Date(new Date(`${query.fechaHasta}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000)
        : undefined,
      soloSinAsignar: query.soloSinAsignar,
    };
  }

  // `mes`/`anio` obligatorios — ver comentario en GastosChoferesService.importar
  // (la hoja de peajes no trae fecha por fila).
  @Post("importar")
  @UseInterceptors(FileInterceptor("archivo"))
  importar(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body("mes") mesTexto: string | undefined,
    @Body("anio") anioTexto: string | undefined,
  ) {
    if (!archivo) {
      throw new BadRequestException("Falta el archivo Excel (campo 'archivo').");
    }
    const mes = Number(mesTexto);
    const anio = Number(anioTexto);
    if (!mesTexto || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      throw new BadRequestException("Falta 'mes' (1-12) — lo necesita la hoja de peajes, que no trae fecha propia.");
    }
    if (!anioTexto || !Number.isInteger(anio)) {
      throw new BadRequestException("Falta 'anio'.");
    }
    return this.gastosChoferesService.importar({
      buffer: archivo.buffer,
      nombreArchivo: archivo.originalname,
      mes,
      anio,
    });
  }

  @Get()
  listar(@Query() query: FiltroGastosDto) {
    return this.gastosChoferesService.listar(this.extraerFiltro(query));
  }

  // ABM manual (item 14.1 TEMAS_PENDIENTES.md, reunión 2026-10-06) — además
  // del import en bloque de arriba, un gasto suelto se puede cargar/editar/
  // borrar a mano.
  @Post()
  crear(@Body() dto: CrearGastoDto) {
    return this.gastosChoferesService.crear({
      tipo: dto.tipo,
      fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
      monto: dto.monto,
      choferId: dto.choferId,
      proveedor: dto.proveedor ?? null,
      comprobante: dto.comprobante ?? null,
    });
  }

  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarGastoDto) {
    return this.gastosChoferesService.actualizar(id, {
      tipo: dto.tipo,
      fecha: dto.fecha ? new Date(`${dto.fecha}T00:00:00.000Z`) : undefined,
      monto: dto.monto,
      choferId: dto.choferId,
      proveedor: dto.proveedor,
      comprobante: dto.comprobante,
    });
  }

  @Delete(":id")
  eliminar(@Param("id") id: string) {
    return this.gastosChoferesService.eliminar(id);
  }

  @Patch(":id/chofer")
  asignarChofer(@Param("id") id: string, @Body() dto: AsignarChoferDto) {
    return this.gastosChoferesService.asignarChofer(id, dto.choferId);
  }

  @Get("reporte-excel")
  @Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  async reporteExcel(@Query() query: FiltroGastosDto): Promise<StreamableFile> {
    const buffer = await this.gastosChoferesService.generarReporteExcel(this.extraerFiltro(query));
    return new StreamableFile(buffer, { disposition: 'attachment; filename="combustible-y-peajes.xlsx"' });
  }
}
