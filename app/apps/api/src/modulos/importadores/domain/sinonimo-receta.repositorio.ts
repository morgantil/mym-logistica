export interface SinonimoReceta {
  id: string;
  valorOrigen: string;
  valorCanonico: string;
}

export interface DatosCrearSinonimoReceta {
  valorOrigen: string;
  valorCanonico: string;
  usuarioId: string | null;
}

export interface DatosActualizarSinonimoReceta {
  valorCanonico: string;
  usuarioId: string | null;
}

// ABM de sinónimos de "Receta" — decisión 2026-09-13, ver comentario del
// modelo Prisma. `resolver` es la única operación que el importador
// realmente necesita en caliente; el resto es la pantalla de administración.
export interface SinonimoRecetaRepositorio {
  listar(): Promise<SinonimoReceta[]>;
  // Busca por `valorOrigen` ya normalizado (ver normalizarValorOrigen) — null
  // si no hay ningún sinónimo cargado para ese valor todavía.
  resolver(valorOrigenNormalizado: string): Promise<SinonimoReceta | null>;
  crear(datos: DatosCrearSinonimoReceta): Promise<SinonimoReceta>;
  actualizar(id: string, datos: DatosActualizarSinonimoReceta): Promise<SinonimoReceta>;
  eliminar(id: string): Promise<void>;
}

export const SINONIMO_RECETA_REPOSITORIO = Symbol("SINONIMO_RECETA_REPOSITORIO");
