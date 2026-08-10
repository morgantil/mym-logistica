import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";

// Sin regla de negocio propia todavía (a diferencia de clientes/destinatarios) —
// mapeo directo a Prisma sin separación domain/application/infrastructure.
// Si en algún momento "asignar chofer según zona" (§13 funcional) crece en
// complejidad, ahí sí se justifica partirlo siguiendo el patrón de clientes/.
@Injectable()
export class ZonasChoferesService {
  constructor(private prisma: PrismaService) {}

  listarZonas() {
    return this.prisma.zona.findMany({ orderBy: { nombre: "asc" } });
  }

  // Para la pantalla de administración: cada zona con su chofer activo
  // actual (si tiene) — misma noción de "chofer de la zona" que usa
  // choferPorZona más abajo, solo que para las N zonas de una.
  async listarZonasConChofer() {
    const zonas = await this.prisma.zona.findMany({
      orderBy: { nombre: "asc" },
      include: { choferes: { where: { activo: true }, include: { chofer: true }, take: 1 } },
    });
    return zonas.map(({ choferes, ...zona }) => ({
      ...zona,
      chofer: choferes[0]?.chofer ?? null,
    }));
  }

  async crearZona(nombre: string) {
    return this.prisma.zona.create({ data: { nombre } });
  }

  async actualizarZona(id: string, nombre: string) {
    await this.asegurarQueExisteZona(id);
    return this.prisma.zona.update({ where: { id }, data: { nombre } });
  }

  // §12-§13 funcional: asigna (o quita, si choferId es null) el chofer de una
  // zona. Una zona tiene un solo chofer "activo" a la vez en la práctica —
  // choferPorZona ya tomaba el primero, así que reasignar desactiva cualquier
  // relación previa en vez de acumularlas.
  async asignarChofer(zonaId: string, choferId: string | null) {
    await this.asegurarQueExisteZona(zonaId);

    await this.prisma.zonaChofer.updateMany({
      where: { zonaId, activo: true },
      data: { activo: false },
    });

    if (choferId) {
      await this.prisma.zonaChofer.upsert({
        where: { zonaId_choferId: { zonaId, choferId } },
        create: { zonaId, choferId, activo: true },
        update: { activo: true },
      });
    }

    return this.listarZonasConChofer().then((zonas) => zonas.find((z) => z.id === zonaId));
  }

  private async asegurarQueExisteZona(id: string) {
    const zona = await this.prisma.zona.findUnique({ where: { id } });
    if (!zona) throw new NotFoundException(`Zona ${id} no encontrada.`);
  }

  listarChoferes() {
    return this.prisma.chofer.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  }

  listarTodosLosChoferes() {
    return this.prisma.chofer.findMany({ orderBy: { nombre: "asc" } });
  }

  async crearChofer(nombre: string) {
    return this.prisma.chofer.create({ data: { nombre } });
  }

  async actualizarChofer(id: string, datos: { nombre?: string; activo?: boolean }) {
    const chofer = await this.prisma.chofer.findUnique({ where: { id } });
    if (!chofer) throw new NotFoundException(`Chofer ${id} no encontrado.`);
    return this.prisma.chofer.update({ where: { id }, data: datos });
  }

  // §13 funcional: "Se consulta la relación zona/chofer. Se asigna el chofer
  // correspondiente." — si no hay relación activa, el pedido queda "Chofer sin asignar".
  async choferPorZona(zonaId: string) {
    const relacion = await this.prisma.zonaChofer.findFirst({
      where: { zonaId, activo: true },
      include: { chofer: true },
    });
    return relacion?.chofer ?? null;
  }

  // §12-§13 funcional, orquestado: zona → chofer, en un solo paso para que lo
  // use el importador al crear pedidos.
  //
  // Orden de prioridad para la zona: (1) lo que sugiera SimpliRoute — hoy
  // siempre null, ver LogisticaProviderPort — (2) coincidencia por nombre
  // contra la localidad del pedido, como fallback débil y configurable
  // (cargando Zonas con el mismo nombre que las localidades reales). Si
  // ninguna de las dos resuelve algo, "Zona sin identificar" / "Chofer sin
  // asignar", tal cual pide el documento funcional — no se inventa una zona.
  async resolverZonaChofer(
    nombreZonaSugerida: string | null,
    localidadFallback: string,
  ): Promise<{ zonaId: string | null; choferId: string | null }> {
    const nombreABuscar = nombreZonaSugerida ?? localidadFallback;

    const zona = await this.prisma.zona.findFirst({
      where: { nombre: { equals: nombreABuscar, mode: "insensitive" } },
    });

    if (!zona) {
      return { zonaId: null, choferId: null };
    }

    const chofer = await this.choferPorZona(zona.id);
    return { zonaId: zona.id, choferId: chofer?.id ?? null };
  }
}
