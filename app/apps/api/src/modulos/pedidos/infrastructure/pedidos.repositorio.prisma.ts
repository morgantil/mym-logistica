import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { EstadoPedido, PrioridadPedido } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ConflictoVersionError } from "../domain/conflicto-version.error";
import { Pedido, PedidoFacturable, PedidoListado } from "../domain/pedido";
import {
  DatosCrearPedido,
  FiltroPedidos,
  FiltroPedidosFacturables,
  OrdenPedidos,
  PaginaPedidos,
  PedidoParaSincronizar,
  PedidosRepositorio,
} from "../domain/pedidos.repositorio";

// Include compartido por listar() y listarPendientesDeEnvio(): son los únicos
// dos métodos que devuelven PedidoListado (ver domain/pedido.ts) en vez del
// Pedido base.
// Zona/Chofer ya no son relaciones (ver schema.prisma) — `zonaNombre` y
// `choferNombre` son columnas planas del propio Pedido (snapshot al momento
// de resolverlas, ver DOCUMENTO TECNICO.md historial 2026-08-26), no hace
// falta joinearlas.
const INCLUDE_LISTADO = {
  cliente: { select: { nombre: true, formatoRemito: true } },
  destinatario: { select: { nombre: true, telefono: true } },
  productos: { select: { codigo: true, descripcion: true, cantidad: true, ticket: true, tipoEnvase: true } },
} satisfies Prisma.PedidoInclude;

type FilaPedidoListado = Prisma.PedidoGetPayload<{ include: typeof INCLUDE_LISTADO }>;

function mapearListado(fila: FilaPedidoListado): PedidoListado {
  const { cliente, destinatario, ...resto } = fila;
  return {
    ...(resto as unknown as Pedido),
    clienteNombre: cliente.nombre,
    clienteFormatoRemito: cliente.formatoRemito as unknown as PedidoListado["clienteFormatoRemito"],
    destinatarioNombre: destinatario.nombre,
    destinatarioTelefono: destinatario.telefono,
    productos: fila.productos as unknown as PedidoListado["productos"],
  };
}

@Injectable()
export class PedidosRepositorioPrisma implements PedidosRepositorio {
  constructor(private prisma: PrismaService) {}

  private armarWhere(filtro: FiltroPedidos): Prisma.PedidoWhereInput {
    return {
      ...(filtro.clienteIds ? { clienteId: { in: filtro.clienteIds } } : {}),
      // El dominio usa el enum de @mym/shared-types (no depende de Prisma); acá en
      // el adapter de infra es donde corresponde traducirlo al enum generado por
      // Prisma — mismos valores string, tipos nominalmente distintos.
      ...(filtro.estado ? { estado: filtro.estado as unknown as Prisma.EnumEstadoPedidoFilter } : {}),
      ...(filtro.fechaDesde || filtro.fechaHasta
        ? {
            fechaProgramada: {
              ...(filtro.fechaDesde ? { gte: filtro.fechaDesde } : {}),
              ...(filtro.fechaHasta ? { lte: filtro.fechaHasta } : {}),
            },
          }
        : {}),
      ...(filtro.bultosDesde !== undefined || filtro.bultosHasta !== undefined
        ? {
            bultos: {
              ...(filtro.bultosDesde !== undefined ? { gte: filtro.bultosDesde } : {}),
              ...(filtro.bultosHasta !== undefined ? { lte: filtro.bultosHasta } : {}),
            },
          }
        : {}),
      ...(filtro.busqueda
        ? {
            OR: [
              { numeroAfiliado: { contains: filtro.busqueda, mode: "insensitive" } },
              { direccionUsada: { contains: filtro.busqueda, mode: "insensitive" } },
              { destinatario: { nombre: { contains: filtro.busqueda, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filtro.tipoServicio
        ? { tipoServicio: filtro.tipoServicio as unknown as Prisma.EnumTipoServicioFilter }
        : {}),
      ...(filtro.zonaId ? { zonaId: filtro.zonaId } : {}),
      ...(filtro.choferId ? { choferId: filtro.choferId } : {}),
      ...(filtro.estadoSimpliroute
        ? { estadoSimpliroute: filtro.estadoSimpliroute as unknown as Prisma.EnumEstadoSimplirouteFilter }
        : {}),
      ...(filtro.prioridad
        ? { prioridad: filtro.prioridad as unknown as Prisma.EnumPrioridadPedidoFilter }
        : {}),
      ...(filtro.localidad ? { localidad: filtro.localidad } : {}),
      ...(filtro.sinEtiquetaImpresa ? { etiquetaImpresaEn: null } : {}),
      // Bolsa/Bulto vive en Producto — matchea pedidos con al menos una línea
      // de ese envase. El propio middleware de borrado lógico no intercepta
      // relaciones anidadas (solo operaciones directas sobre el modelo
      // Producto), así que `eliminadoEn: null` se agrega acá a mano.
      ...(filtro.tipoEnvase
        ? {
            productos: {
              some: {
                eliminadoEn: null,
                tipoEnvase: filtro.tipoEnvase as unknown as Prisma.EnumTipoEnvaseNullableFilter,
              },
            },
          }
        : {}),
    };
  }

  // Whitelist campo → orderBy de Prisma (nunca un string libre, ver
  // CampoOrdenPedido). cliente/destinatario/telefono ordenan por un campo de
  // la relación — Prisma lo soporta anidando el orderBy.
  private armarOrderBy(orden: OrdenPedidos | undefined): Prisma.PedidoOrderByWithRelationInput {
    if (!orden) return { fechaProgramada: "desc" };
    const { campo, direccion } = orden;
    switch (campo) {
      case "cliente":
        return { cliente: { nombre: direccion } };
      case "destinatario":
        return { destinatario: { nombre: direccion } };
      case "telefono":
        return { destinatario: { telefono: direccion } };
      case "estado":
        return { estado: direccion };
      case "numero":
        return { numero: direccion };
      case "afiliado":
        return { numeroAfiliado: direccion };
      case "direccion":
        return { direccionUsada: direccion };
      case "localidad":
        return { localidad: direccion };
      case "fecha":
        return { fechaProgramada: direccion };
      case "fechaSubida":
        return { creadoEn: direccion };
      case "bultos":
        return { bultos: direccion };
      case "zona":
        return { zonaNombre: direccion };
      case "chofer":
        return { choferNombre: direccion };
      case "validacion":
        return { estadoValidacion: direccion };
      case "simpliroute":
        return { estadoSimpliroute: direccion };
      case "observaciones":
        return { observaciones: direccion };
      case "remito":
        return { remito: direccion };
      case "receta":
        return { receta: direccion };
      case "tipoPedido":
        return { tipoPedido: direccion };
      case "tiempoDeEntrega":
        return { tiempoDeEntrega: direccion };
      case "retiroDeReceta":
        return { retiroDeReceta: direccion };
      case "horarioEntrega":
        return { horarioEntrega: direccion };
      case "prioridad":
        return { prioridad: direccion };
    }
  }

  async listar(
    filtro: FiltroPedidos,
    pagina: number,
    porPagina: number,
    orden?: OrdenPedidos,
  ): Promise<PaginaPedidos> {
    const where = this.armarWhere(filtro);
    const [datos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        orderBy: this.armarOrderBy(orden),
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: INCLUDE_LISTADO,
      }),
      this.prisma.pedido.count({ where }),
    ]);
    return { datos: datos.map(mapearListado), total };
  }

  // Decisión 2026-10-04: "Exportar a Excel" respeta los mismos filtros que
  // la grilla (reusa armarWhere/armarOrderBy) pero trae TODO lo que matchea,
  // sin paginar — es un archivo para descargar, no una página para scrollear.
  async listarTodosParaExportar(filtro: FiltroPedidos, orden?: OrdenPedidos): Promise<PedidoListado[]> {
    const datos = await this.prisma.pedido.findMany({
      where: this.armarWhere(filtro),
      orderBy: this.armarOrderBy(orden),
      include: INCLUDE_LISTADO,
    });
    return datos.map(mapearListado);
  }

  // Base de los endpoints de dashboard/KPIs (DOCUMENTO TECNICO.md, ítem confirmado
  // "endpoints ahora, pantalla después").
  async contarPorEstado(clienteIds?: string[]): Promise<Record<string, number>> {
    const resultado = await this.prisma.pedido.groupBy({
      by: ["estado"],
      where: clienteIds ? { clienteId: { in: clienteIds } } : undefined,
      _count: true,
    });
    return Object.fromEntries(resultado.map((fila) => [fila.estado, fila._count]));
  }

  async crear(datos: DatosCrearPedido): Promise<Pedido> {
    const creado = await this.prisma.pedido.create({
      data: {
        clienteId: datos.clienteId,
        destinatarioId: datos.destinatarioId,
        importacionId: datos.importacionId,
        numeroAfiliado: datos.numeroAfiliado,
        direccionOriginal: datos.direccionOriginal,
        direccionUsada: datos.direccionUsada,
        localidad: datos.localidad,
        zonaTarifariaId: datos.zonaTarifariaId,
        fechaProgramada: datos.fechaProgramada,
        tipoServicio: datos.tipoServicio as unknown as Prisma.PedidoCreateInput["tipoServicio"],
        observaciones: datos.observaciones,
        alertaDireccionPendiente: datos.alertaDireccionPendiente,
        cantidadPedidoOriginal: datos.cantidadPedidoOriginal,
        zonaId: datos.zonaId,
        zonaNombre: datos.zonaNombre,
        choferId: datos.choferId,
        choferNombre: datos.choferNombre,
        estadoSimpliroute:
          datos.estadoSimpliroute as unknown as Prisma.PedidoCreateInput["estadoSimpliroute"],
        estadoValidacion:
          datos.estadoValidacion as unknown as Prisma.PedidoCreateInput["estadoValidacion"],
        receta: datos.receta,
        recetaResuelta: datos.recetaResuelta,
        tipoPedido: datos.tipoPedido,
        retiroDeReceta: datos.retiroDeReceta,
        tiempoDeEntrega: datos.tiempoDeEntrega,
        horarioEntrega: datos.horarioEntrega,
        prioridad: datos.prioridad as unknown as Prisma.PedidoCreateInput["prioridad"],
        remito: datos.remito,
        bultos: datos.bultos,
        productos: {
          create: datos.productos.map((producto) => ({
            codigo: producto.codigo,
            descripcion: producto.descripcion,
            cantidad: producto.cantidad,
            ticket: producto.ticket,
            tipoEnvase: producto.tipoEnvase as unknown as Prisma.ProductoCreateWithoutPedidoInput["tipoEnvase"],
          })),
        },
      },
    });
    return creado as unknown as Pedido;
  }

  async obtenerPorId(id: string): Promise<Pedido | null> {
    const encontrado = await this.prisma.pedido.findUnique({ where: { id } });
    return encontrado as unknown as Pedido | null;
  }

  async obtenerListadoPorId(id: string): Promise<PedidoListado | null> {
    const encontrado = await this.prisma.pedido.findUnique({ where: { id }, include: INCLUDE_LISTADO });
    return encontrado ? mapearListado(encontrado) : null;
  }

  async listarPendientesDeEnvio(clienteIds?: string[]): Promise<PedidoListado[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estado: "SIN_ASIGNAR",
        ...(clienteIds ? { clienteId: { in: clienteIds } } : {}),
      },
      orderBy: { fechaProgramada: "asc" },
      include: INCLUDE_LISTADO,
    });
    return pedidos.map(mapearListado);
  }

  async listarLocalidades(clienteIds?: string[]): Promise<string[]> {
    const filas = await this.prisma.pedido.findMany({
      where: clienteIds ? { clienteId: { in: clienteIds } } : undefined,
      distinct: ["localidad"],
      select: { localidad: true },
      orderBy: { localidad: "asc" },
    });
    return filas.map((fila) => fila.localidad);
  }

  // Decisión 2026-10-04 (reunión con el cliente): una entrega fallida
  // (ausencia en el domicilio, "visita fallida" en SimpliRoute) también se
  // factura — el viaje se hizo igual. Mismo criterio para el cliente acá y
  // para el chofer en listarEntregadosPorChoferEnPeriodo (facturación).
  async listarFacturables(filtro: FiltroPedidosFacturables): Promise<PedidoFacturable[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        clienteId: filtro.clienteId,
        estado: { in: ["ENTREGADO", "ENTREGA_FALLIDA"] },
        grupoFacturacionId: null,
        fechaProgramada: { gte: filtro.fechaDesde, lt: filtro.fechaHasta },
      },
      include: { productos: { select: { tipoEnvase: true } } },
      orderBy: { fechaProgramada: "asc" },
    });
    return pedidos as unknown as PedidoFacturable[];
  }

  async listarEntregadosEnPeriodo(filtro: FiltroPedidosFacturables): Promise<PedidoFacturable[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        clienteId: filtro.clienteId,
        estado: { in: ["ENTREGADO", "ENTREGA_FALLIDA"] },
        fechaProgramada: { gte: filtro.fechaDesde, lt: filtro.fechaHasta },
      },
      include: { productos: { select: { tipoEnvase: true } } },
      orderBy: { fechaProgramada: "asc" },
    });
    return pedidos as unknown as PedidoFacturable[];
  }

  // count===0 en el updateMany puede significar "no existe" o "cambió la
  // versión" — son errores distintos (404 vs 409), así que se distingue acá
  // antes de decidir cuál tirar.
  private async fallarSiNoExiste(id: string): Promise<never> {
    const existe = await this.prisma.pedido.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException(`Pedido ${id} no encontrado.`);
    throw new ConflictoVersionError(id);
  }

  async actualizarBultos(id: string, bultos: number, version: number): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version },
      data: { bultos, version: { increment: 1 } },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async actualizarComentario(id: string, comentario: string | null, version: number): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version },
      data: { comentario, version: { increment: 1 } },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async actualizarRuta(id: string, ruta: string | null, version: number): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version },
      data: { ruta, version: { increment: 1 } },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async resolverAlertaDireccion(id: string, direccionUsada: string, version: number): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version },
      data: { direccionUsada, alertaDireccionPendiente: false, version: { increment: 1 } },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async marcarEnviado(
    id: string,
    datos: {
      simplirouteId: string;
      version: number;
      latitudEntrega: number | null;
      longitudEntrega: number | null;
      geocodeAlert: string | null;
      correccionZonaChofer?: {
        zonaId: string | null;
        zonaNombre: string | null;
        choferId: string | null;
        choferNombre: string | null;
        zonaPreEnvioId: string | null;
        zonaPreEnvioNombre: string | null;
        choferPreEnvioId: string | null;
        choferPreEnvioNombre: string | null;
      };
    },
  ): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version: datos.version },
      data: {
        simplirouteId: datos.simplirouteId,
        estadoSimpliroute: "ENVIADO",
        estado: "COORDINADO",
        latitudEntrega: datos.latitudEntrega,
        longitudEntrega: datos.longitudEntrega,
        geocodeAlert: datos.geocodeAlert,
        ...(datos.correccionZonaChofer ?? {}),
        version: { increment: 1 },
      },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async marcarErrorGeocodificacion(
    id: string,
    datos: {
      simplirouteId: string;
      version: number;
      latitudEntrega: number | null;
      longitudEntrega: number | null;
      geocodeAlert: string | null;
    },
  ): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version: datos.version },
      data: {
        simplirouteId: datos.simplirouteId,
        estadoSimpliroute: "ERROR",
        latitudEntrega: datos.latitudEntrega,
        longitudEntrega: datos.longitudEntrega,
        geocodeAlert: datos.geocodeAlert,
        version: { increment: 1 },
      },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }

  async marcarEtiquetaImpresa(id: string): Promise<void> {
    await this.prisma.pedido.update({ where: { id }, data: { etiquetaImpresaEn: new Date() } });
  }

  async eliminar(id: string): Promise<void> {
    // El middleware de borrado lógico reescribe esto como un update seteando
    // eliminadoEn — nunca borra la fila físicamente (ver soft-delete.middleware.ts).
    await this.prisma.pedido.delete({ where: { id } });
  }

  async actualizarPrioridad(pedidoIds: string[], prioridad: PrioridadPedido, usuarioId: string): Promise<number> {
    const { count } = await this.prisma.pedido.updateMany({
      where: { id: { in: pedidoIds }, eliminadoEn: null },
      data: {
        prioridad: prioridad as unknown as Prisma.PedidoUpdateManyMutationInput["prioridad"],
        actualizadoPorId: usuarioId,
        version: { increment: 1 },
      },
    });
    return count;
  }

  async listarPendientesDeSincronizar(): Promise<PedidoParaSincronizar[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        estadoSimpliroute: "ENVIADO",
        estado: { in: ["COORDINADO", "EN_TRANSITO"] },
        simplirouteId: { not: null },
      },
      select: { id: true, simplirouteId: true, choferId: true, choferNombre: true, version: true },
    });
    return pedidos.map((p) => ({
      id: p.id,
      simplirouteId: p.simplirouteId as string,
      choferId: p.choferId,
      choferNombre: p.choferNombre,
      version: p.version,
    }));
  }

  async actualizarEstadoDesdeProveedor(
    id: string,
    datos: {
      estado: EstadoPedido;
      fechaEntregaEfectiva: Date | null;
      version: number;
      actualizacionChofer?: {
        zonaId: string | null;
        zonaNombre: string | null;
        choferId: string | null;
        choferNombre: string | null;
      };
    },
  ): Promise<Pedido> {
    const resultado = await this.prisma.pedido.updateMany({
      where: { id, version: datos.version },
      data: {
        estado: datos.estado,
        fechaEntregaEfectiva: datos.fechaEntregaEfectiva,
        ...(datos.actualizacionChofer ?? {}),
        version: { increment: 1 },
      },
    });
    if (resultado.count === 0) {
      return this.fallarSiNoExiste(id);
    }
    return this.obtenerPorId(id) as Promise<Pedido>;
  }
}
