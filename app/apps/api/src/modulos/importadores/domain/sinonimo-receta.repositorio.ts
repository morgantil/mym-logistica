import { TipoCoincidenciaRegla } from "./reglas-importacion";

export interface SinonimoReceta {
  id: string;
  valorOrigen: string;
  valorCanonico: string;
  // Decisión 2026-09-24: "es igual a" (lo de siempre), "empieza con" o "contiene".
  tipoCoincidencia: TipoCoincidenciaRegla;
  // Si varios sinónimos aplican al mismo valor gana el de menor `orden`; a
  // igual orden, el de valorOrigen más largo (el más específico).
  orden: number;
}

export interface DatosCrearSinonimoReceta {
  valorOrigen: string;
  valorCanonico: string;
  tipoCoincidencia: TipoCoincidenciaRegla;
  orden: number;
  usuarioId: string | null;
}

export interface DatosActualizarSinonimoReceta {
  valorCanonico: string;
  tipoCoincidencia?: TipoCoincidenciaRegla;
  orden?: number;
  usuarioId: string | null;
}

// ABM de sinónimos de "Receta" — decisión 2026-09-13, ver comentario del
// modelo Prisma. `resolver` es la única operación que el importador
// realmente necesita en caliente; el resto es la pantalla de administración.
export interface SinonimoRecetaRepositorio {
  listar(): Promise<SinonimoReceta[]>;
  // Recibe el valor crudo ya normalizado (ver normalizarEncabezado) y lo
  // compara contra TODOS los sinónimos según su tipo de coincidencia — null si
  // ninguno aplica todavía.
  resolver(valorNormalizado: string): Promise<SinonimoReceta | null>;
  crear(datos: DatosCrearSinonimoReceta): Promise<SinonimoReceta>;
  actualizar(id: string, datos: DatosActualizarSinonimoReceta): Promise<SinonimoReceta>;
  eliminar(id: string): Promise<void>;
}

export const SINONIMO_RECETA_REPOSITORIO = Symbol("SINONIMO_RECETA_REPOSITORIO");
