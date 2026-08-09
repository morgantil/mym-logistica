import { Inject, Injectable } from "@nestjs/common";
import { ResolucionDireccion } from "@mym/shared-types";
import { Destinatario, compararDireccion, ResultadoComparacionDireccion } from "../domain/destinatario";
import {
  DESTINATARIOS_REPOSITORIO,
  DestinatariosRepositorio,
} from "../domain/destinatarios.repositorio";

export interface ResultadoProcesarDestinatario {
  destinatario: Destinatario;
  alertaDireccion: ResultadoComparacionDireccion | null;
}

@Injectable()
export class DestinatariosService {
  constructor(
    @Inject(DESTINATARIOS_REPOSITORIO) private readonly repositorio: DestinatariosRepositorio,
  ) {}

  // Llamado por el módulo de importadores por cada fila agrupada del Excel — §8, §11 funcional.
  // No decide nada por sí solo: si hay diferencia de dirección, la deja marcada para
  // que el usuario la resuelva (ver resolverDiferenciaDireccion).
  async procesarDesdeImportacion(datos: {
    clienteId: string;
    numeroAfiliado: string;
    nombre: string;
    direccionExcel: string;
    localidad: string;
    telefono: string | null;
  }): Promise<ResultadoProcesarDestinatario> {
    const existente = await this.repositorio.buscarPorClienteYAfiliado(
      datos.clienteId,
      datos.numeroAfiliado,
    );

    if (!existente) {
      const nuevo = await this.repositorio.crear({
        clienteId: datos.clienteId,
        numeroAfiliado: datos.numeroAfiliado,
        nombre: datos.nombre,
        direccion: datos.direccionExcel,
        direccionNormalizada: null,
        localidad: datos.localidad,
        telefono: datos.telefono,
      });
      return { destinatario: nuevo, alertaDireccion: null };
    }

    const comparacion = compararDireccion(existente.direccion, datos.direccionExcel);
    return {
      destinatario: existente,
      alertaDireccion: comparacion.coincide ? null : comparacion,
    };
  }

  // Aplica la decisión del usuario ante una "Dirección diferente a la registrada" (§11 funcional).
  // Devuelve la dirección que efectivamente hay que usar para ESTE pedido.
  async resolverDiferenciaDireccion(
    destinatarioId: string,
    resolucion: ResolucionDireccion,
    direccionExcel: string,
    direccionPadron: string,
  ): Promise<{ direccionAUsar: string }> {
    switch (resolucion) {
      case ResolucionDireccion.USAR_SOLO_ESTE_PEDIDO:
        return { direccionAUsar: direccionExcel };
      case ResolucionDireccion.ACTUALIZAR_PADRON:
        await this.repositorio.actualizarDireccion(destinatarioId, direccionExcel);
        return { direccionAUsar: direccionExcel };
      case ResolucionDireccion.MANTENER_EXISTENTE:
        return { direccionAUsar: direccionPadron };
    }
  }
}
