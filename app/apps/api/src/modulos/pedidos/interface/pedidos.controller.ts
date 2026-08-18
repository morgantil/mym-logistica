import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  Body,
} from "@nestjs/common";
import { Rol } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UsuarioActual, UsuarioAutenticado } from "../../../common/decorators/usuario-actual.decorator";
import { PedidosService } from "../application/pedidos.service";
import { ActualizarBultosDto } from "./dto/actualizar-bultos.dto";
import { EnviarSimpliRouteDto } from "./dto/enviar-simpliroute.dto";
import { ListarPedidosDto } from "./dto/listar-pedidos.dto";

@Controller("pedidos")
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  // Grilla principal (§14 funcional) y Embalaje y Despacho (§8.1 — filtra
  // además por clienteId/fechaDesde/fechaHasta).
  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Query() query: ListarPedidosDto) {
    return this.pedidosService.listarParaUsuario(
      usuario.id,
      {
        estado: query.estado,
        clienteId: query.clienteId,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      },
      query.pagina,
      query.porPagina,
    );
  }

  // §17 funcional: "Revisión antes de enviar" — cada pedido viene con sus
  // motivos bloqueantes (lista vacía = ya se puede enviar).
  @Get("revision")
  revisarPendientesDeEnvio(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.revisarPendientesDeEnvio(usuario.id);
  }

  // §16 funcional: carga de bultos desde la grilla — rol Logística.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/bultos")
  actualizarBultos(@Param("id") id: string, @Body() dto: ActualizarBultosDto) {
    return this.pedidosService.actualizarBultos(id, dto.bultos, dto.version);
  }

  // §18 funcional: envío a SimpliRoute — rol Operaciones. Un pedido inválido
  // no frena a los demás, ver PedidosService.enviarASimpliRoute.
  @Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
  @Post("enviar-simpliroute")
  enviarASimpliRoute(@Body() dto: EnviarSimpliRouteDto) {
    return this.pedidosService.enviarASimpliRoute(dto.pedidoIds);
  }

  // §8.2 funcional v6: todas las etiquetas del pedido (una por bulto) —
  // rol Logística, pantalla de Embalaje y Despacho.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Get(":id/etiquetas")
  @Header("Content-Type", "application/pdf")
  async etiquetas(@Param("id") id: string): Promise<StreamableFile> {
    const pdf = await this.pedidosService.generarEtiquetas(id);
    return new StreamableFile(pdf, { disposition: `inline; filename="etiquetas-pedido-${id}.pdf"` });
  }

  // Reimpresión de una etiqueta puntual — §8.2: "reimprimir todas las
  // etiquetas de un pedido o una etiqueta puntual".
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Get(":id/etiquetas/:numeroBulto")
  @Header("Content-Type", "application/pdf")
  async etiquetaPuntual(
    @Param("id") id: string,
    @Param("numeroBulto", ParseIntPipe) numeroBulto: number,
  ): Promise<StreamableFile> {
    const pdf = await this.pedidosService.generarEtiquetas(id, numeroBulto);
    return new StreamableFile(pdf, {
      disposition: `inline; filename="etiqueta-pedido-${id}-bulto-${numeroBulto}.pdf"`,
    });
  }
}
