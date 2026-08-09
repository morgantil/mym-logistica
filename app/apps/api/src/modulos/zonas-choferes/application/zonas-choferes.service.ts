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
}
