import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { TipoReporte } from "@mym/shared-types";
import {
  LimiteReporte,
  MAX_DIAS_PERMITIDO,
  MIN_DIAS_PERMITIDO,
} from "../domain/limite-reporte";
import {
  LIMITES_REPORTE_REPOSITORIO,
  LimitesReporteRepositorio,
} from "../domain/limites-reporte.repositorio";

// Default de respaldo si por lo que sea no hay fila para un reporte (no
// debería pasar, los 3 se siembran en la migración) — mismo valor pedido
// como default en la reunión 2026-10-10.
const DEFAULT_MAX_DIAS = 32;

@Injectable()
export class LimitesReporteService {
  constructor(
    @Inject(LIMITES_REPORTE_REPOSITORIO) private readonly repositorio: LimitesReporteRepositorio,
  ) {}

  listar(): Promise<LimiteReporte[]> {
    return this.repositorio.listar();
  }

  async obtenerMaxDias(reporte: TipoReporte): Promise<number> {
    const limite = await this.repositorio.obtener(reporte);
    return limite?.maxDias ?? DEFAULT_MAX_DIAS;
  }

  async actualizar(reporte: TipoReporte, maxDias: number, usuarioId: string): Promise<LimiteReporte> {
    if (!Number.isInteger(maxDias) || maxDias < MIN_DIAS_PERMITIDO || maxDias > MAX_DIAS_PERMITIDO) {
      throw new BadRequestException(
        `El tope tiene que ser un número entero entre ${MIN_DIAS_PERMITIDO} y ${MAX_DIAS_PERMITIDO} días.`,
      );
    }
    return this.repositorio.actualizar(reporte, maxDias, usuarioId);
  }
}
