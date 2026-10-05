import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TipoServicioCliente } from "@mym/shared-types";
import { obtenerUsuarioActual } from "../../../common/contexto/contexto-solicitud";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { Cliente } from "../domain/cliente";
import { ClientesRepositorio, DatosActualizarCliente } from "../domain/clientes.repositorio";

@Injectable()
export class ClientesRepositorioPrisma implements ClientesRepositorio {
  constructor(private prisma: PrismaService) {}

  async listarActivos(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
    return clientes as unknown as Cliente[];
  }

  async listarTodos(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
    return clientes as unknown as Cliente[];
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const encontrado = await this.prisma.cliente.findUnique({ where: { id } });
    return encontrado as unknown as Cliente | null;
  }

  async crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente> {
    const creado = await this.prisma.cliente.create({
      data: {
        ...datos,
        tipoServicio: datos.tipoServicio as unknown as Prisma.ClienteCreateInput["tipoServicio"],
        formatoRemito: datos.formatoRemito as unknown as Prisma.ClienteCreateInput["formatoRemito"],
      },
    });
    return creado as unknown as Cliente;
  }

  // Ver comentario en ClientesRepositorio — solo lee, no cambia nada acá; el
  // que decide si bloquea el actualizar es ClientesService. `activa: true`
  // en las tablas que la tienen: una fila inactiva ya está "apagada", no
  // amerita frenar el cambio de tipo por algo que nadie está usando.
  async buscarConfiguracionIncompatible(clienteId: string, nuevoTipo: TipoServicioCliente): Promise<string[]> {
    if (nuevoTipo === TipoServicioCliente.AMBOS) return [];
    const tipoQueSeSaca = nuevoTipo === TipoServicioCliente.PANAL ? "MEDICAMENTO" : "PANAL";
    const etiqueta = tipoQueSeSaca === "PANAL" ? "Pañales" : "Medicamentos";
    const hallazgos: string[] = [];

    const pedidos = await this.prisma.pedido.count({
      where: { clienteId, tipoServicio: tipoQueSeSaca as unknown as Prisma.EnumTipoServicioFilter },
    });
    if (pedidos > 0) hallazgos.push(`${pedidos} pedido(s) de ${etiqueta}`);

    const tarifas = await this.prisma.tarifaCliente.count({
      where: { clienteId, activa: true, tipoServicio: tipoQueSeSaca as unknown as Prisma.EnumTipoServicioFilter },
    });
    if (tarifas > 0) hallazgos.push(`${tarifas} tarifa(s) de ${etiqueta}`);

    const perfiles = await this.prisma.perfilImportacion.count({
      where: { clienteId, tipoServicio: tipoQueSeSaca as unknown as Prisma.EnumTipoServicioFilter },
    });
    if (perfiles > 0) hallazgos.push(`${perfiles} perfil(es) de importación de ${etiqueta}`);

    if (tipoQueSeSaca === "MEDICAMENTO") {
      const montos = await this.prisma.montoUnificadoMedicamento.count({
        where: { clienteId, activa: true, eliminadoEn: null },
      });
      if (montos > 0) hallazgos.push(`${montos} monto(s) de medicamento en unificado`);

      const reglas = await this.prisma.reglaImportacion.count({
        where: { clienteId, activa: true, eliminadoEn: null },
      });
      if (reglas > 0) hallazgos.push(`${reglas} regla(s) de importación`);

      const combos = await this.prisma.combinacionUnificacionClientes.count({
        where: { clienteMedicamentoId: clienteId, activa: true, eliminadoEn: null },
      });
      if (combos > 0) hallazgos.push(`${combos} combinación(es) de unificación entre clientes (como lado Medicamento)`);
    } else {
      const combos = await this.prisma.combinacionUnificacionClientes.count({
        where: { clientePanalId: clienteId, activa: true, eliminadoEn: null },
      });
      if (combos > 0) hallazgos.push(`${combos} combinación(es) de unificación entre clientes (como lado Pañal)`);
    }

    return hallazgos;
  }

  async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    const actualizado = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...datos,
        tipoServicio: datos.tipoServicio as unknown as Prisma.ClienteUpdateInput["tipoServicio"],
        formatoRemito: datos.formatoRemito as unknown as Prisma.ClienteUpdateInput["formatoRemito"],
        actualizadoPorId: obtenerUsuarioActual()?.usuarioId ?? null,
      },
    });
    return actualizado as unknown as Cliente;
  }
}
