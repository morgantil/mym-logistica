export interface Cliente {
  id: string;
  nombre: string;
  patronesDeteccion: string[];
  activo: boolean;
}

// DOCUMENTO FUNCIONAL.md §5: el sistema intenta identificar el cliente a partir
// del nombre del archivo antes de pedirle al usuario que lo confirme.
export function detectarClientePorNombreArchivo(
  nombreArchivo: string,
  clientes: Cliente[],
): Cliente | null {
  const nombreNormalizado = nombreArchivo.toUpperCase();
  return (
    clientes.find((cliente) =>
      cliente.patronesDeteccion.some((patron) => nombreNormalizado.includes(patron.toUpperCase())),
    ) ?? null
  );
}
