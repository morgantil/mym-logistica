import { TipoServicioCliente } from "@mym/shared-types";

// `patronesDeteccion` queda como dato descriptivo (variantes de nombre del
// cliente) — decisión 2026-09-16, Leonardo: se sacó la detección automática
// del cliente al importar un Excel (`detectarClientePorNombreArchivo`, que
// vivía acá, eliminada). Era un riesgo real, no solo cosmético: un patrón
// corto y genérico como "BIO" podía matchear el nombre de cualquier archivo
// que contuviera esas letras y asignar el cliente equivocado en silencio.
// Elegir el cliente es obligatorio siempre al importar (ver ImportarExcelService).
export interface Cliente {
  id: string;
  nombre: string;
  patronesDeteccion: string[];
  activo: boolean;
  tipoServicio: TipoServicioCliente;
}
