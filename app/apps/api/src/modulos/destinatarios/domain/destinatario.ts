export interface Destinatario {
  id: string;
  clienteId: string;
  numeroAfiliado: string;
  nombre: string;
  direccion: string;
  direccionNormalizada: string | null;
  localidad: string;
  telefono: string | null;
  simplirouteId: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface ResultadoComparacionDireccion {
  coincide: boolean;
  direccionPadron: string;
  direccionExcel: string;
}

// DOCUMENTO FUNCIONAL.md §11: comparación simple por ahora (case/espacios normalizados).
// Cuando se resuelva la integración con SimpliRoute, esto puede pasar a comparar
// contra `direccionNormalizada`/coordenadas en vez de un string plano.
export function compararDireccion(
  direccionPadron: string,
  direccionExcel: string,
): ResultadoComparacionDireccion {
  const normalizar = (texto: string) => texto.trim().toUpperCase().replace(/\s+/g, " ");
  return {
    coincide: normalizar(direccionPadron) === normalizar(direccionExcel),
    direccionPadron,
    direccionExcel,
  };
}
