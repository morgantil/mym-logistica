import { Injectable, NotFoundException } from "@nestjs/common";
import { CabaProvincia } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";

// Partidos del conurbano bonaerense (AMBA) — geografía oficial fija, no
// cambia (a diferencia de la tarifa/Cordón que le corresponde a cada uno,
// eso sí es configurable). Nombres exactos tal cual los devuelve
// georef-ar-api (`/departamentos?provincia=Buenos Aires`), verificado a
// mano 2026-09-08 antes de cargar el mapeo real que dio el cliente final.
// "La Matanza" queda afuera a propósito: el cliente aclaró que cruza los
// 3 Cordones de forma transversal (partes distintas del partido van a
// Cordones distintos) — no se puede resolver a nivel de partido entero,
// queda pendiente de una definición más fina (por localidad) y mientras
// tanto sin asignar en vez de adivinar un valor.
const PARTIDOS_CONOCIDOS = [
  "Vicente López",
  "San Isidro",
  "General San Martín",
  "Tres de Febrero",
  "Morón",
  "Hurlingham",
  "Ituzaingó",
  "Avellaneda",
  "Lanús",
  "Lomas de Zamora",
  "San Fernando",
  "Tigre",
  "San Miguel",
  "Malvinas Argentinas",
  "José C. Paz",
  "Moreno",
  "Merlo",
  "Quilmes",
  "Berazategui",
  "Florencio Varela",
  "Almirante Brown",
  "Esteban Echeverría",
  "Ezeiza",
  "Pilar",
  "Escobar",
  "General Rodríguez",
  "Marcos Paz",
  "Presidente Perón",
  "San Vicente",
  "Cañuelas",
  "La Plata",
  "Berisso",
  "Ensenada",
  "La Matanza",
];

// Sin regla de negocio propia — mismo criterio que ZonasChoferesService
// (CRUD directo sobre Prisma, sin separación domain/infrastructure). Si
// "zona tarifaria" gana complejidad propia (ej. reglas de vigencia), ahí sí
// se justifica partirlo siguiendo el patrón de clientes/.
@Injectable()
export class ZonasTarifariasService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.zonaTarifaria.findMany({ orderBy: { nombre: "asc" } });
  }

  async crear(nombre: string) {
    return this.prisma.zonaTarifaria.create({ data: { nombre } });
  }

  async actualizar(id: string, datos: { nombre?: string; activa?: boolean }) {
    await this.asegurarQueExiste(id);
    return this.prisma.zonaTarifaria.update({ where: { id }, data: datos });
  }

  private async asegurarQueExiste(id: string) {
    const zona = await this.prisma.zonaTarifaria.findUnique({ where: { id } });
    if (!zona) throw new NotFoundException(`Zona tarifaria ${id} no encontrada.`);
  }

  // Mapeo Localidad → ZonaTarifaria, configurable por Administración —
  // documento funcional v6 §10.2: "El sistema deberá determinar el cordón a
  // partir de la localidad. La relación Localidad → Cordón deberá ser
  // configurable y no quedar fija en código."
  listarMapeoLocalidades() {
    return this.prisma.localidadZonaTarifaria.findMany({
      orderBy: { localidad: "asc" },
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
  }

  async asignarLocalidad(localidad: string, zonaTarifariaId: string) {
    await this.asegurarQueExiste(zonaTarifariaId);
    const localidadNormalizada = localidad.trim().toUpperCase();
    return this.prisma.localidadZonaTarifaria.upsert({
      where: { localidad: localidadNormalizada },
      create: { localidad: localidadNormalizada, zonaTarifariaId },
      update: { zonaTarifariaId },
    });
  }

  async quitarLocalidad(id: string) {
    const fila = await this.prisma.localidadZonaTarifaria.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException(`Mapeo de localidad ${id} no encontrado.`);
    await this.prisma.localidadZonaTarifaria.delete({ where: { id } });
  }

  // Mapeo Partido/Municipio → ZonaTarifaria (Cordón) — el más preciso de los
  // dos que quedan (el mapeo por Zona de SimpliRoute se sacó del sistema el
  // 2026-09-08, ver DOCUMENTO TECNICO.md historial: esas zonas cruzan varios
  // partidos reales cada una, daban resultados imprecisos). `PARTIDOS_CONOCIDOS` es la lista
  // fija de partidos del conurbano (no cambia, es geografía oficial) — se
  // usa para mostrar todos en la pantalla aunque todavía no tengan Cordón
  // asignado (mismo criterio que zonas de SimpliRoute).
  async listarMapeoPartidos() {
    const asignados = await this.prisma.partidoZonaTarifaria.findMany({
      include: { zonaTarifaria: { select: { nombre: true } } },
    });
    const porPartido = new Map(asignados.map((a) => [a.partido, a]));

    return PARTIDOS_CONOCIDOS.map((partido) => {
      const asignado = porPartido.get(partido);
      return {
        partido,
        zonaTarifariaId: asignado?.zonaTarifariaId ?? null,
        zonaTarifaria: asignado?.zonaTarifaria ?? null,
      };
    });
  }

  async asignarPartido(partido: string, zonaTarifariaId: string) {
    await this.asegurarQueExiste(zonaTarifariaId);
    return this.prisma.partidoZonaTarifaria.upsert({
      where: { partido },
      create: { partido, zonaTarifariaId },
      update: { zonaTarifariaId },
    });
  }

  async quitarPartido(partido: string) {
    const fila = await this.prisma.partidoZonaTarifaria.findUnique({ where: { partido } });
    if (!fila) throw new NotFoundException(`Mapeo del partido "${partido}" no encontrado.`);
    await this.prisma.partidoZonaTarifaria.delete({ where: { partido } });
  }

  // Resuelve la ZonaTarifaria del pedido considerando, en orden: (1) CABA
  // siempre resuelve directo (ver resolverPorLocalidad); (2) si se conoce el
  // partido (viene de GeorefArAdapter, es un límite administrativo exacto) y
  // está mapeado, se usa ese; (3) si no, fallback al mapeo por localidad de
  // siempre. Nunca inventa un cordón. (Se sacó el fallback intermedio por
  // Zona de SimpliRoute el 2026-09-08 — ver DOCUMENTO TECNICO.md historial:
  // esas zonas cruzan varios partidos reales cada una, el mapeo por partido
  // ya las reemplaza con mejor precisión.)
  async resolverParaPedido(
    clasificacion: CabaProvincia | null,
    localidad: string,
    partido: string | null = null,
  ): Promise<string | null> {
    if (clasificacion === CabaProvincia.CABA) {
      return this.resolverPorLocalidad(clasificacion, localidad);
    }

    if (partido !== null) {
      const mapeoPartido = await this.prisma.partidoZonaTarifaria.findUnique({ where: { partido } });
      if (mapeoPartido) return mapeoPartido.zonaTarifariaId;
    }

    return this.resolverPorLocalidad(clasificacion, localidad);
  }

  // Resuelve la ZonaTarifaria de un pedido a partir de la clasificación
  // CABA/Provincia de GeorefArAdapter + la localidad. CABA siempre resuelve
  // a la zona "CABA" (no necesita mapeo, hay una sola). Provincia depende del
  // mapeo Localidad → Cordón configurado — si la localidad todavía no fue
  // mapeada, se devuelve null ("sin zona tarifaria asignada"), nunca se
  // inventa un cordón (mismo criterio que resolverZonaChofer para logística).
  async resolverPorLocalidad(
    clasificacion: CabaProvincia | null,
    localidad: string,
  ): Promise<string | null> {
    if (clasificacion === null) return null;

    if (clasificacion === CabaProvincia.CABA) {
      const zonaCaba = await this.prisma.zonaTarifaria.findUnique({ where: { nombre: "CABA" } });
      return zonaCaba?.id ?? null;
    }

    const mapeo = await this.prisma.localidadZonaTarifaria.findUnique({
      where: { localidad: localidad.trim().toUpperCase() },
    });
    return mapeo?.zonaTarifariaId ?? null;
  }
}
