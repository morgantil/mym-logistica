import { Inject, Injectable } from "@nestjs/common";
import { normalizarEncabezado } from "../domain/mapeo-columnas";
import { TipoCoincidenciaRegla } from "../domain/reglas-importacion";
import {
  SINONIMO_RECETA_REPOSITORIO,
  SinonimoReceta,
  SinonimoRecetaRepositorio,
} from "../domain/sinonimo-receta.repositorio";

// ABM de sinónimos de "Receta" — decisión 2026-09-13 (Leonardo: "es parte
// del ABM, lo define el usuario"). Ver SinonimoReceta en schema.prisma.
@Injectable()
export class SinonimoRecetaService {
  constructor(
    @Inject(SINONIMO_RECETA_REPOSITORIO) private readonly repositorio: SinonimoRecetaRepositorio,
  ) {}

  listar(): Promise<SinonimoReceta[]> {
    return this.repositorio.listar();
  }

  // Usado por el importador de medicamentos (una vez construido, ver
  // TEMAS_PENDIENTES.md §13.14) para resolver el valor crudo de la columna
  // Receta contra el ABM — null si todavía no hay ningún sinónimo cargado
  // para ese valor (no se inventa uno).
  resolver(valorCrudo: string): Promise<SinonimoReceta | null> {
    return this.repositorio.resolver(normalizarEncabezado(valorCrudo));
  }

  crear(
    valorOrigen: string,
    valorCanonico: string,
    tipoCoincidencia: TipoCoincidenciaRegla,
    orden: number,
    usuarioId: string,
  ) {
    return this.repositorio.crear({
      valorOrigen: normalizarEncabezado(valorOrigen),
      valorCanonico: valorCanonico.trim(),
      tipoCoincidencia,
      orden,
      usuarioId,
    });
  }

  actualizar(
    id: string,
    valorCanonico: string,
    tipoCoincidencia: TipoCoincidenciaRegla | undefined,
    orden: number | undefined,
    usuarioId: string,
  ) {
    return this.repositorio.actualizar(id, {
      valorCanonico: valorCanonico.trim(),
      tipoCoincidencia,
      orden,
      usuarioId,
    });
  }

  eliminar(id: string) {
    return this.repositorio.eliminar(id);
  }
}
