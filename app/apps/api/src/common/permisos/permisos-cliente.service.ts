import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Implementa la regla "Permisos por cliente" de DOCUMENTO TECNICO.md sección 2:
// si un usuario no tiene ninguna fila en usuarios_clientes, ve todos los clientes.
// Si tiene al menos una, queda restringido a esos.
//
// Los módulos de negocio (pedidos, destinatarios, facturación, etc.) usan
// `filtroClientesPermitidos()` para acotar sus queries — no es un guard de ruta
// porque la restricción es sobre QUÉ FILAS ve el usuario, no sobre si puede
// entrar al endpoint.
@Injectable()
export class PermisosClienteService {
  constructor(private prisma: PrismaService) {}

  async clientesPermitidosPara(usuarioId: string): Promise<string[] | null> {
    const asignaciones = await this.prisma.usuarioCliente.findMany({
      where: { usuarioId },
      select: { clienteId: true },
    });

    if (asignaciones.length === 0) {
      return null; // null = sin restricción, ve todos los clientes
    }
    return asignaciones.map((a) => a.clienteId);
  }

  // Devuelve un filtro Prisma `where` listo para spreadear: `{ ...where, clienteId }`
  async filtroClientesPermitidos(usuarioId: string): Promise<{ clienteId?: { in: string[] } }> {
    const permitidos = await this.clientesPermitidosPara(usuarioId);
    return permitidos ? { clienteId: { in: permitidos } } : {};
  }
}
