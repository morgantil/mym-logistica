import { Inject, Injectable } from "@nestjs/common";
import { ResolucionDireccion } from "@mym/shared-types";
import { LOGISTICA_PROVIDER, LogisticaProviderPort } from "../../simpliroute/domain/logistica-provider.port";
import { Destinatario, compararDireccion, ResultadoComparacionDireccion } from "../domain/destinatario";
import {
  DESTINATARIOS_REPOSITORIO,
  DestinatariosRepositorio,
} from "../domain/destinatarios.repositorio";

export interface ResultadoProcesarDestinatario {
  destinatario: Destinatario;
  alertaDireccion: ResultadoComparacionDireccion | null;
}

export interface ResultadoSincronizarSimpliRoute {
  encontrado: boolean;
  destinatario: Destinatario;
}

@Injectable()
export class DestinatariosService {
  constructor(
    @Inject(DESTINATARIOS_REPOSITORIO) private readonly repositorio: DestinatariosRepositorio,
    @Inject(LOGISTICA_PROVIDER) private readonly logisticaProvider: LogisticaProviderPort,
  ) {}

  buscarPorId(id: string): Promise<Destinatario | null> {
    return this.repositorio.buscarPorId(id);
  }

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

    // Bug real 2026-10-07 (reunión con Leonardo): a diferencia de la
    // dirección (que sí se compara y se deja marcada para resolver), el
    // teléfono de un destinatario ya existente nunca se refrescaba al
    // reimportar — un pedido nuevo de un afiliado repetido se quedaba con el
    // teléfono viejo guardado la primera vez, aunque el Excel trajera uno
    // nuevo (o el mismo, ya pasado por normalizarTelefono con una versión
    // más nueva del parseo). Se refresca directo, sin alertar como la
    // dirección — el teléfono no tiene la misma ambigüedad ("¿cuál es la
    // dirección correcta?") que justifica pedirle al usuario que elija.
    let destinatario = existente;
    if (datos.telefono !== null && datos.telefono !== existente.telefono) {
      destinatario = await this.repositorio.actualizarTelefono(existente.id, datos.telefono);
    }

    const comparacion = compararDireccion(existente.direccion, datos.direccionExcel);
    return {
      destinatario,
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

  // §9, §10, §12 funcional: consulta si el destinatario existe en SimpliRoute.
  // Si existe, guarda coordenadas/id externo — necesarios para que
  // ZonasChoferesService.resolverZonaChofer pueda hacer el point-in-polygon
  // contra el catálogo de Zonas (ver DOCUMENTO TECNICO.md historial
  // 2026-08-25/26).
  async sincronizarConSimpliRoute(
    destinatario: Destinatario,
    numeroAfiliado: string,
  ): Promise<ResultadoSincronizarSimpliRoute> {
    const encontradoEnProveedor = await this.logisticaProvider.buscarDestinatarioPorAfiliado(
      numeroAfiliado,
    );

    if (!encontradoEnProveedor) {
      return { encontrado: false, destinatario };
    }

    const actualizado = await this.repositorio.actualizarDatosSimpliRoute(destinatario.id, {
      simplirouteId: encontradoEnProveedor.idExterno,
      latitud: encontradoEnProveedor.latitud,
      longitud: encontradoEnProveedor.longitud,
    });

    return { encontrado: true, destinatario: actualizado };
  }
}
