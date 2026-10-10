import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Rol } from "@prisma/client";
import { TipoServicio } from "@mym/shared-types";
import { LIMITES_ARCHIVO_EXCEL } from "../../../common/constants/limites-archivo";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { ImportarExcelService } from "../application/importar-excel.service";
import { MapeoColumnas } from "../domain/campo-canonico";

// Sin DTO de class-validator a propósito: los campos de texto llegan mezclados
// con el archivo en un multipart/form-data, y la validación fina de cada uno
// ya la hacen el service (cliente inexistente, JSON de mapeo inválido, etc.)
// devolviendo errores claros. Se puede formalizar con un DTO más adelante si
// hace falta, no es la parte riesgosa de este módulo.
@Controller("importaciones")
export class ImportadoresController {
  constructor(private importarExcelService: ImportarExcelService) {}

  // Sin @Roles a propósito — mismo criterio que /choferes y /zonas: es un
  // lookup de solo lectura para el desplegable del filtro "Importado por"
  // en Pedidos, no expone nada sensible (solo id+nombre de quienes ya
  // importaron algo), no hace falta restringirlo a un rol puntual.
  @Get("usuarios")
  listarUsuariosImportadores() {
    return this.importarExcelService.listarUsuariosImportadores();
  }

  // `clienteId` es obligatorio — decisión 2026-09-16, ver comentario en
  // ImportarExcelService (se sacó la detección automática por nombre de
  // archivo, era un riesgo real de asignar el cliente equivocado en silencio).
  // `fechaEntrega` también es obligatoria — documento funcional v6 §4.1: se
  // informa antes de subir el archivo y se aplica a todo el lote, sin
  // importar qué traiga el Excel.
  @Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
  @Post()
  @UseInterceptors(FileInterceptor("archivo", { limits: LIMITES_ARCHIVO_EXCEL }))
  subir(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body("clienteId") clienteId: string | undefined,
    @Body("fechaEntrega") fechaEntrega: string | undefined,
    @Body("tipoServicio") tipoServicio: TipoServicio | undefined,
    @Body("nombreHoja") nombreHoja: string | undefined,
    @Body("sinEncabezado") sinEncabezado: string | undefined,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    if (!archivo) {
      throw new BadRequestException("Falta el archivo Excel (campo 'archivo').");
    }
    if (!clienteId) {
      throw new BadRequestException("Falta 'clienteId'.");
    }
    if (!fechaEntrega) {
      throw new BadRequestException("Falta 'fechaEntrega' (YYYY-MM-DD).");
    }
    return this.importarExcelService.procesarArchivo({
      buffer: archivo.buffer,
      nombreArchivo: archivo.originalname,
      usuarioId: usuario.id,
      fechaEntrega,
      clienteId,
      // Opcional — default PANAL, ver ImportarExcelService (retrocompatible
      // con clientes que todavía no distinguen tipo de importación en el front).
      tipoServicio: tipoServicio || undefined,
      // Opcional — hoja del libro a leer; se guarda en el perfil del cliente.
      nombreHoja: nombreHoja || undefined,
      // "true"/"false" del formulario; sin informar = lo guardado en el perfil.
      sinEncabezado: sinEncabezado === undefined || sinEncabezado === "" ? undefined : sinEncabezado === "true",
    });
  }

  // Segundo paso cuando /importaciones devolvió estado "requiereMapeoManual":
  // se reenvía el MISMO archivo + el mapeo que el usuario confirmó a mano +
  // la misma fecha de entrega ya informada en el primer paso.
  @Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
  @Post("confirmar-mapeo")
  @UseInterceptors(FileInterceptor("archivo", { limits: LIMITES_ARCHIVO_EXCEL }))
  confirmarMapeo(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body("clienteId") clienteId: string,
    @Body("mapeoManual") mapeoManualJson: string,
    @Body("fechaEntrega") fechaEntrega: string | undefined,
    @Body("tipoServicio") tipoServicio: TipoServicio | undefined,
    @Body("nombreHoja") nombreHoja: string | undefined,
    @Body("sinEncabezado") sinEncabezado: string | undefined,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    if (!archivo) {
      throw new BadRequestException("Falta el archivo Excel (campo 'archivo').");
    }
    if (!clienteId) {
      throw new BadRequestException("Falta 'clienteId'.");
    }
    if (!fechaEntrega) {
      throw new BadRequestException("Falta 'fechaEntrega' (YYYY-MM-DD).");
    }

    let mapeoManual: MapeoColumnas;
    try {
      mapeoManual = JSON.parse(mapeoManualJson);
    } catch {
      throw new BadRequestException(
        "'mapeoManual' debe ser un JSON válido, ej. {\"direccion\":\"Domicilio\"}.",
      );
    }

    return this.importarExcelService.procesarArchivoConMapeoManual({
      buffer: archivo.buffer,
      nombreArchivo: archivo.originalname,
      usuarioId: usuario.id,
      clienteId,
      mapeoManual,
      fechaEntrega,
      tipoServicio: tipoServicio || undefined,
      nombreHoja: nombreHoja || undefined,
      // "true"/"false" del formulario; sin informar = lo guardado en el perfil.
      sinEncabezado: sinEncabezado === undefined || sinEncabezado === "" ? undefined : sinEncabezado === "true",
    });
  }
}
