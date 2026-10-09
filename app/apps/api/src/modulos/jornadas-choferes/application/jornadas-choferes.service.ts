import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ZonasChoferesService } from "../../zonas-choferes/application/zonas-choferes.service";
import { JornadaChofer } from "../domain/jornada-chofer";
import {
  FiltroJornadasChofer,
  JORNADAS_CHOFERES_REPOSITORIO,
  JornadasChoferesRepositorio,
} from "../domain/jornadas-choferes.repositorio";

@Injectable()
export class JornadasChoferesService {
  constructor(
    @Inject(JORNADAS_CHOFERES_REPOSITORIO) private readonly repositorio: JornadasChoferesRepositorio,
    private zonasChoferesService: ZonasChoferesService,
  ) {}

  async guardar(datos: {
    choferId: string;
    fecha: Date;
    horaInicio: string | null;
    horaFin: string | null;
  }): Promise<JornadaChofer> {
    const chofer = await this.resolverChoferOFallar(datos.choferId);
    return this.repositorio.guardar({
      choferId: chofer.id,
      choferNombre: chofer.nombre,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
    });
  }

  eliminar(id: string): Promise<void> {
    return this.repositorio.eliminar(id);
  }

  listar(filtro: FiltroJornadasChofer): Promise<JornadaChofer[]> {
    return this.repositorio.listar(filtro);
  }

  private async resolverChoferOFallar(choferId: string): Promise<{ id: string; nombre: string }> {
    const choferes = await this.zonasChoferesService.listarChoferes();
    const chofer = choferes.find((candidato) => String(candidato.id) === choferId);
    if (!chofer) throw new NotFoundException(`Chofer ${choferId} no encontrado.`);
    return { id: String(chofer.id), nombre: chofer.nombre };
  }
}
