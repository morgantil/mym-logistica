import {
  Controller,
  Delete,
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
import { ActualizarPrioridadDto } from "./dto/actualizar-prioridad.dto";
import { ActualizarBultosDto } from "./dto/actualizar-bultos.dto";
import { ActualizarComentarioDto } from "./dto/actualizar-comentario.dto";
import { ActualizarRutaDto } from "./dto/actualizar-ruta.dto";
import { EliminarPedidosDto } from "./dto/eliminar-pedidos.dto";
import { EnviarSimpliRouteDto } from "./dto/enviar-simpliroute.dto";
import { ListarPedidosDto } from "./dto/listar-pedidos.dto";
import { ResolverAlertaDireccionDto } from "./dto/resolver-alerta-direccion.dto";

@Controller("pedidos")
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  // Filtros compartidos por `listar` y `exportar` — mismo criterio para que
  // "Exportar a Excel" nunca pueda quedar desalineado de lo que se ve en la grilla.
  private extraerFiltro(query: ListarPedidosDto) {
    return {
      estado: query.estado,
      clienteId: query.clienteId,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      bultosDesde: query.bultosDesde,
      bultosHasta: query.bultosHasta,
      busqueda: query.busqueda,
      tipoServicio: query.tipoServicio,
      zonaId: query.zonaId,
      choferId: query.choferId,
      tipoEnvase: query.tipoEnvase,
      estadoSimpliroute: query.estadoSimpliroute,
      prioridad: query.prioridad,
      localidad: query.localidad,
      sinEtiquetaImpresa: query.sinEtiquetaImpresa,
    };
  }

  private extraerOrden(query: ListarPedidosDto) {
    return query.ordenarPor ? { campo: query.ordenarPor, direccion: query.direccionOrden ?? "asc" } : undefined;
  }

  // Grilla principal (§14 funcional) y Embalaje y Despacho (§8.1 — filtra
  // además por clienteId/fechaDesde/fechaHasta).
  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado, @Query() query: ListarPedidosDto) {
    return this.pedidosService.listarParaUsuario(
      usuario.id,
      this.extraerFiltro(query),
      query.pagina,
      query.porPagina,
      this.extraerOrden(query),
    );
  }

  // Decisión 2026-10-04 (reunión con el cliente): "descarga de pedidos a
  // Excel usando los filtros seleccionados" — mismos filtros y mismos
  // permisos por cliente que la grilla, sin paginar.
  @Get("exportar")
  @Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  async exportar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Query() query: ListarPedidosDto,
  ): Promise<StreamableFile> {
    const buffer = await this.pedidosService.exportarParaUsuario(
      usuario.id,
      this.extraerFiltro(query),
      this.extraerOrden(query),
    );
    const fecha = new Date().toISOString().slice(0, 10);
    return new StreamableFile(buffer, { disposition: `attachment; filename="pedidos-${fecha}.xlsx"` });
  }

  // Dropdown del filtro de Localidad (decisión 2026-09-16) — valores reales
  // ya cargados, no una lista fija.
  @Get("localidades")
  listarLocalidades(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.listarLocalidadesParaUsuario(usuario.id);
  }

  // §17 funcional: "Revisión antes de enviar" — cada pedido viene con sus
  // motivos bloqueantes (lista vacía = ya se puede enviar).
  @Get("revision")
  revisarPendientesDeEnvio(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.revisarPendientesDeEnvio(usuario.id);
  }

  // Decisión 2026-09-24: marcar pedidos como Normal/Urgente/Crítica, uno o
  // varios a la vez — mismos roles que operan pedidos día a día.
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch("prioridad")
  actualizarPrioridad(@Body() dto: ActualizarPrioridadDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidosService.actualizarPrioridad(dto.pedidoIds, dto.prioridad, usuario.id);
  }

  // §16 funcional: carga de bultos desde la grilla — rol Logística.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/bultos")
  actualizarBultos(@Param("id") id: string, @Body() dto: ActualizarBultosDto) {
    return this.pedidosService.actualizarBultos(id, dto.bultos, dto.version);
  }

  // Decisión 2026-10-04 (reunión con el cliente): comentario libre por
  // pedido, editable en cualquier momento — mismos roles que ya operan
  // pedidos día a día (no es exclusivo de Logística, a diferencia de bultos).
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/comentario")
  actualizarComentario(@Param("id") id: string, @Body() dto: ActualizarComentarioDto) {
    return this.pedidosService.actualizarComentario(id, dto.comentario ?? null, dto.version);
  }

  // Decisión 2026-10-04: qué ruta de SimpliRoute (ej. "Ruta 1") le
  // corresponde — campo libre cargado a mano, mismos roles que comentario.
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/ruta")
  actualizarRuta(@Param("id") id: string, @Body() dto: ActualizarRutaDto) {
    return this.pedidosService.actualizarRuta(id, dto.ruta ?? null, dto.version);
  }

  // Decisión 2026-09-16: resuelve una "dirección distinta a la registrada en
  // el padrón" y desbloquea el envío — mismos roles que ya operan pedidos
  // día a día (ver validar-envio.ts).
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Patch(":id/resolver-direccion")
  resolverAlertaDireccion(@Param("id") id: string, @Body() dto: ResolverAlertaDireccionDto) {
    return this.pedidosService.resolverAlertaDireccion(id, dto.resolucion, dto.version);
  }

  // §18 funcional: envío a SimpliRoute — rol Operaciones. Un pedido inválido
  // no frena a los demás, ver PedidosService.enviarASimpliRoute.
  @Roles(Rol.OPERACIONES, Rol.ADMINISTRACION)
  @Post("enviar-simpliroute")
  enviarASimpliRoute(@Body() dto: EnviarSimpliRouteDto) {
    return this.pedidosService.enviarASimpliRoute(dto.pedidoIds);
  }

  // §19 funcional: trae de SimpliRoute el estado real de los pedidos en
  // curso y los refleja en EstadoPedido (única forma de llegar a ENTREGADO/
  // ENTREGA_FALLIDA) — mismos roles que pueden enviar, más Logística porque
  // también dispara esto antes de calcular la liquidación a transportistas.
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("sincronizar-estados")
  sincronizarEstados() {
    return this.pedidosService.sincronizarEstados();
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

  // Remito preimpreso del pedido — desde el detalle del pedido o desde
  // Embalaje y Despacho, mismos roles que ya imprimen etiquetas.
  @Roles(Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Get(":id/remito")
  @Header("Content-Type", "application/pdf")
  async remito(@Param("id") id: string): Promise<StreamableFile> {
    const pdf = await this.pedidosService.generarRemito(id);
    return new StreamableFile(pdf, { disposition: `inline; filename="remito-pedido-${id}.pdf"` });
  }

  // Borrado lógico — solo pedidos que todavía no se mandaron a SimpliRoute
  // (ver validar-eliminacion.ts). Mismos roles que ya pueden operar sobre
  // pedidos día a día.
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Delete(":id")
  eliminarPedido(@Param("id") id: string) {
    return this.pedidosService.eliminarPedido(id);
  }

  // Selección múltiple desde Grilla/Revisión — un pedido no eliminable no
  // frena a los demás, mismo criterio que enviar-simpliroute.
  @Roles(Rol.OPERACIONES, Rol.LOGISTICA, Rol.ADMINISTRACION)
  @Post("eliminar")
  eliminarPedidos(@Body() dto: EliminarPedidosDto) {
    return this.pedidosService.eliminarPedidos(dto.pedidoIds);
  }
}
