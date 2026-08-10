import { Injectable } from "@nestjs/common";
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

  listarChoferes() {
    return this.prisma.chofer.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
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
