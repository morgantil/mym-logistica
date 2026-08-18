import { Injectable, NotFoundException } from "@nestjs/common";
import { CabaProvincia } from "@mym/shared-types";
import { PrismaService } from "../../../common/prisma/prisma.service";

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
