import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { ClientesService } from "../../clientes/application/clientes.service";
import { TODOS_LOS_CAMPOS_CANONICOS } from "../domain/campo-canonico";
import {
  DatosReglaImportacion,
  REGLA_IMPORTACION_REPOSITORIO,
  ReglaImportacionRepositorio,
} from "../domain/regla-importacion.repositorio";
import { CAMPOS_DESTINO_REGLA, esPrioridadValida } from "../domain/reglas-importacion";

// Reglas de importación editables (decisión 2026-09-24) — ver ReglaImportacion
// en schema.prisma. Acá se valida que una regla tenga sentido antes de
// guardarla: una regla mal armada fallaría en silencio en la importación
// (simplemente no aplicaría), mejor rechazarla al crearla.
@Injectable()
export class ReglaImportacionService {
  constructor(
    @Inject(REGLA_IMPORTACION_REPOSITORIO) private readonly repositorio: ReglaImportacionRepositorio,
    private clientesService: ClientesService,
  ) {}

  listar(filtro: { clienteId?: string; tipoServicio?: TipoServicio }) {
    return this.repositorio.listar(filtro);
  }

  listarActivas(clienteId: string, tipoServicio: TipoServicio) {
    return this.repositorio.listarActivas(clienteId, tipoServicio);
  }

  async crear(datos: DatosReglaImportacion, usuarioId: string) {
    return this.repositorio.crear(await this.validar(datos), usuarioId);
  }

  async actualizar(id: string, datos: DatosReglaImportacion, usuarioId: string) {
    return this.repositorio.actualizar(id, await this.validar(datos), usuarioId);
  }

  eliminar(id: string) {
    return this.repositorio.eliminar(id);
  }

  // Decisión 2026-09-29: mismo hallazgo que las tarifas — el cliente elegido
  // tiene que manejar realmente medicamentos, si no la regla nunca se
  // aplica (ese cliente no importa archivos de ese tipo).
  private async validar(datos: DatosReglaImportacion): Promise<DatosReglaImportacion> {
    if (datos.tipoServicio !== TipoServicio.MEDICAMENTO) {
      throw new BadRequestException("Las reglas de importación por ahora solo aplican a medicamentos.");
    }
    const cliente = await this.clientesService.buscarPorId(datos.clienteId);
    if (!cliente) throw new NotFoundException(`Cliente ${datos.clienteId} no encontrado.`);
    if (cliente.tipoServicio === TipoServicioCliente.PANAL) {
      throw new BadRequestException(
        `"${cliente.nombre}" está configurado como Pañales — no puede tener reglas de importación de Medicamentos.`,
      );
    }
    const valor = datos.valor.trim();
    if (!valor) throw new BadRequestException("Falta el texto de la condición.");
    if (!TODOS_LOS_CAMPOS_CANONICOS.includes(datos.campoOrigen)) {
      throw new BadRequestException(`"${datos.campoOrigen}" no es un campo válido para la condición.`);
    }
    if (!CAMPOS_DESTINO_REGLA.includes(datos.campoDestino)) {
      throw new BadRequestException(`"${datos.campoDestino}" no se puede modificar con una regla.`);
    }

    const valorDestino = datos.valorDestino.trim();
    if (datos.accion === "QUITAR_PREFIJO") {
      if (datos.campoDestino !== "numeroAfiliado") {
        throw new BadRequestException("Quitar un prefijo solo se puede aplicar al número de afiliado.");
      }
      return { ...datos, valor, valorDestino: "" };
    }

    if (datos.campoDestino === "numeroAfiliado") {
      throw new BadRequestException("El número de afiliado solo admite la acción \"quitar prefijo\".");
    }
    if (datos.campoDestino === "prioridad" && !esPrioridadValida(valorDestino)) {
      throw new BadRequestException("La prioridad tiene que ser NORMAL, URGENTE o CRITICA.");
    }
    if (!valorDestino) throw new BadRequestException("Falta el valor a asignar.");
    return { ...datos, valor, valorDestino };
  }
}
