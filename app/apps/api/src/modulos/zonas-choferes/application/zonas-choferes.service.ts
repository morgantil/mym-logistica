import { Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DatosChofer,
  DatosVehiculo,
  LOGISTICA_PROVIDER,
  LogisticaProviderPort,
} from "../../simpliroute/domain/logistica-provider.port";
import { Coordenada, encontrarZona } from "../domain/punto-en-poligono";

export interface ResultadoZonaChofer {
  zonaId: string | null;
  zonaNombre: string | null;
  choferId: string | null;
  choferNombre: string | null;
  // Decisión 2026-10-04: Id de SimpliRoute del vehículo del chofer resuelto
  // — necesario para asignar la Visit a Conductor/Vehículo al enviarla (ver
  // PedidosService.enviarASimpliRoute). Null si no se resolvió chofer.
  vehiculoId: string | null;
}

// Cache de solo lectura de Zonas/Choferes/Vehículos de SimpliRoute — decisión
// 2026-08-25/26 (ver DOCUMENTO TECNICO.md historial): SimpliRoute es la
// fuente de verdad, acá solo se guarda una copia sincronizada para que las
// pantallas no dependan de pegarle a la API en cada request. Sin BullMQ/Redis
// (nunca se llegó a usar en este proyecto — ver historial): el refresco es
// perezoso (si el cache está vencido, se refresca antes de responder la
// próxima lectura) más un botón explícito de "sincronizar ahora" en el
// frontend. Con 11 zonas / 12 vehículos / 17 choferes reales, esto alcanza —
// si el catálogo creciera mucho, ahí sí valdría la pena un job real.
@Injectable()
export class ZonasChoferesService {
  private readonly logger = new Logger(ZonasChoferesService.name);
  private static readonly TTL_CACHE_MS = 15 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    @Inject(LOGISTICA_PROVIDER) private readonly logisticaProvider: LogisticaProviderPort,
  ) {}

  // El "chofer asignado" que se muestra por zona es informativo (mismo
  // criterio que resolverZonaChofer: primer vehículo de la zona → su chofer
  // predeterminado) — no es una relación editable acá, solo refleja lo que
  // ya está configurado en SimpliRoute.
  async listarZonas() {
    await this.asegurarCacheFresca();
    const [zonas, vehiculos, choferes] = await Promise.all([
      this.prisma.zonaSimpliRouteCache.findMany({ orderBy: { nombre: "asc" } }),
      this.prisma.vehiculoSimpliRouteCache.findMany(),
      this.prisma.choferSimpliRouteCache.findMany(),
    ]);
    const vehiculoPorId = new Map(vehiculos.map((v) => [v.id, v]));
    const choferPorId = new Map(choferes.map((c) => [c.id, c]));

    return zonas.map((zona) => {
      const vehiculo = zona.vehiculosIds[0] !== undefined ? vehiculoPorId.get(zona.vehiculosIds[0]) : undefined;
      const chofer =
        vehiculo?.choferPredeterminadoId !== null && vehiculo?.choferPredeterminadoId !== undefined
          ? choferPorId.get(vehiculo.choferPredeterminadoId)
          : undefined;

      return {
        id: zona.id,
        nombre: zona.nombre,
        habilitada: zona.habilitada,
        dias: zona.dias,
        vehiculosIds: zona.vehiculosIds,
        chofer: chofer ? { id: chofer.id, nombre: chofer.nombre } : null,
      };
    });
  }

  async listarChoferes() {
    await this.asegurarCacheFresca();
    return this.prisma.choferSimpliRouteCache.findMany({ orderBy: { nombre: "asc" } });
  }

  async listarVehiculos() {
    await this.asegurarCacheFresca();
    return this.prisma.vehiculoSimpliRouteCache.findMany({ orderBy: { nombre: "asc" } });
  }

  async crearChofer(datos: DatosChofer) {
    const creado = await this.logisticaProvider.crearChofer(datos);
    await this.sincronizar();
    return creado;
  }

  async actualizarChofer(id: number, datos: DatosChofer) {
    const actualizado = await this.logisticaProvider.actualizarChofer(id, datos);
    await this.sincronizar();
    return actualizado;
  }

  async eliminarChofer(id: number) {
    await this.logisticaProvider.eliminarChofer(id);
    await this.sincronizar();
  }

  async crearVehiculo(datos: DatosVehiculo) {
    const creado = await this.logisticaProvider.crearVehiculo(datos);
    await this.sincronizar();
    return creado;
  }

  async actualizarVehiculo(id: number, datos: DatosVehiculo) {
    const actualizado = await this.logisticaProvider.actualizarVehiculo(id, datos);
    await this.sincronizar();
    return actualizado;
  }

  async eliminarVehiculo(id: number) {
    await this.logisticaProvider.eliminarVehiculo(id);
    await this.sincronizar();
  }

  // Refresco completo y explícito — botón "Sincronizar ahora" del frontend,
  // y también lo que dispara internamente cada alta/edición/baja de arriba
  // para que el cache nunca quede desactualizado respecto de lo que se
  // acaba de escribir en SimpliRoute.
  async sincronizar() {
    const [zonas, choferes, vehiculos] = await Promise.all([
      this.logisticaProvider.listarZonas(),
      this.logisticaProvider.listarChoferes(),
      this.logisticaProvider.listarVehiculos(),
    ]);

    await this.prisma.$transaction([
      this.prisma.zonaSimpliRouteCache.deleteMany({}),
      this.prisma.choferSimpliRouteCache.deleteMany({}),
      this.prisma.vehiculoSimpliRouteCache.deleteMany({}),
      ...zonas.map((zona) =>
        this.prisma.zonaSimpliRouteCache.create({
          data: {
            id: zona.id,
            nombre: zona.nombre,
            habilitada: zona.habilitada,
            dias: zona.dias,
            poligono: zona.poligono as unknown as Prisma.InputJsonValue,
            vehiculosIds: zona.vehiculosIds,
          },
        }),
      ),
      ...choferes.map((chofer) =>
        this.prisma.choferSimpliRouteCache.create({
          data: {
            id: chofer.id,
            nombre: chofer.nombre,
            username: chofer.username,
            telefono: chofer.telefono,
            email: chofer.email,
            activo: chofer.activo,
          },
        }),
      ),
      ...vehiculos.map((vehiculo) =>
        this.prisma.vehiculoSimpliRouteCache.create({
          data: {
            id: vehiculo.id,
            nombre: vehiculo.nombre,
            patente: vehiculo.patente,
            choferPredeterminadoId: vehiculo.choferPredeterminadoId,
            estado: vehiculo.estado,
          },
        }),
      ),
    ]);

    this.logger.log(
      `Sincronizado con SimpliRoute: ${zonas.length} zonas, ${choferes.length} choferes, ${vehiculos.length} vehículos.`,
    );
    return { zonas: zonas.length, choferes: choferes.length, vehiculos: vehiculos.length };
  }

  private async asegurarCacheFresca() {
    const masReciente = await this.prisma.zonaSimpliRouteCache.findFirst({
      orderBy: { sincronizadoEn: "desc" },
      select: { sincronizadoEn: true },
    });

    const vencido =
      !masReciente || Date.now() - masReciente.sincronizadoEn.getTime() > ZonasChoferesService.TTL_CACHE_MS;

    if (!vencido) return;

    try {
      await this.sincronizar();
    } catch (error) {
      // Si SimpliRoute está caído, seguimos con lo que haya en cache
      // (aunque esté vencido) en vez de romper toda la pantalla — mismo
      // criterio que el resto de la integración (nunca frenar el resto de
      // la app por un problema puntual de red con SimpliRoute).
      this.logger.warn(
        `No se pudo refrescar el cache de SimpliRoute, se sigue usando el último conocido: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // §12-§13 funcional, orquestado: zona → chofer, en un solo paso para que lo
  // use el importador al crear pedidos.
  //
  // Prioridad para resolver la zona: (1) point-in-polygon contra las
  // coordenadas del destinatario, si SimpliRoute ya las tiene geocodificadas
  // (2) fallback débil por coincidencia de nombre contra la localidad, igual
  // que antes. Si ninguna resuelve algo, "Zona sin identificar" / "Chofer sin
  // asignar" tal cual pide el documento funcional — no se inventa una zona.
  // El chofer sale de mirar el primer vehículo asignado a la zona en
  // SimpliRoute y su conductor predeterminado — si la zona no tiene ningún
  // vehículo asignado (o el vehículo no tiene chofer predeterminado), queda
  // "Chofer sin asignar" igual aunque la zona sí se haya identificado.
  async resolverZonaChofer(
    latitud: number | null,
    longitud: number | null,
    localidadFallback: string,
  ): Promise<ResultadoZonaChofer> {
    await this.asegurarCacheFresca();

    const zonasHabilitadas = await this.prisma.zonaSimpliRouteCache.findMany({
      where: { habilitada: true },
    });
    const candidatas = zonasHabilitadas.map((zona) => ({
      ...zona,
      poligono: zona.poligono as unknown as Coordenada[],
    }));

    let zonaEncontrada: (typeof candidatas)[number] | null = null;

    if (latitud !== null && longitud !== null) {
      zonaEncontrada = encontrarZona({ lat: latitud, lng: longitud }, candidatas);
    }

    if (!zonaEncontrada) {
      zonaEncontrada =
        candidatas.find((zona) => zona.nombre.toLowerCase() === localidadFallback.toLowerCase()) ?? null;
    }

    if (!zonaEncontrada) {
      return { zonaId: null, zonaNombre: null, choferId: null, choferNombre: null, vehiculoId: null };
    }

    const vehiculoId = zonaEncontrada.vehiculosIds[0] ?? null;
    let choferId: number | null = null;
    let choferNombre: string | null = null;

    if (vehiculoId !== null) {
      const vehiculo = await this.prisma.vehiculoSimpliRouteCache.findUnique({ where: { id: vehiculoId } });
      if (vehiculo?.choferPredeterminadoId !== null && vehiculo?.choferPredeterminadoId !== undefined) {
        const chofer = await this.prisma.choferSimpliRouteCache.findUnique({
          where: { id: vehiculo.choferPredeterminadoId },
        });
        if (chofer) {
          choferId = chofer.id;
          choferNombre = chofer.nombre;
        }
      }
    }

    return {
      zonaId: String(zonaEncontrada.id),
      zonaNombre: zonaEncontrada.nombre,
      choferId: choferId !== null ? String(choferId) : null,
      choferNombre,
      vehiculoId: vehiculoId !== null ? String(vehiculoId) : null,
    };
  }

  // Camino inverso a resolverZonaChofer: a partir de un chofer (ej. el
  // `driver` real de la Visit en SimpliRoute, que puede haber cambiado
  // después de enviada) encuentra su zona — el vehículo que lo tiene como
  // predeterminado, y la zona a la que está asignado ese vehículo. Decisión
  // 2026-10-04: así la grilla de Pedidos puede reflejar sola una
  // reasignación hecha a mano en SimpliRoute (ver
  // PedidosService.sincronizarEstados), sin tener que volver a geocodificar
  // la dirección del pedido.
  async resolverZonaPorChofer(choferIdExterno: number): Promise<ResultadoZonaChofer> {
    await this.asegurarCacheFresca();

    const chofer = await this.prisma.choferSimpliRouteCache.findUnique({ where: { id: choferIdExterno } });
    if (!chofer) {
      return {
        zonaId: null,
        zonaNombre: null,
        choferId: String(choferIdExterno),
        choferNombre: null,
        vehiculoId: null,
      };
    }

    const vehiculo = await this.prisma.vehiculoSimpliRouteCache.findFirst({
      where: { choferPredeterminadoId: choferIdExterno },
    });
    if (!vehiculo) {
      return {
        zonaId: null,
        zonaNombre: null,
        choferId: String(chofer.id),
        choferNombre: chofer.nombre,
        vehiculoId: null,
      };
    }

    const zona = await this.prisma.zonaSimpliRouteCache.findFirst({
      where: { vehiculosIds: { has: vehiculo.id } },
    });

    return {
      zonaId: zona ? String(zona.id) : null,
      zonaNombre: zona?.nombre ?? null,
      choferId: String(chofer.id),
      choferNombre: chofer.nombre,
      vehiculoId: String(vehiculo.id),
    };
  }
}
