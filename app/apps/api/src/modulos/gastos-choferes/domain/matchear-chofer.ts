import { normalizarNombreChofer } from "./normalizar-nombre-chofer";

export interface ChoferParaMatchear {
  id: string;
  nombre: string;
}

export interface VehiculoParaMatchear {
  patente: string | null;
  choferPredeterminadoId: string | null;
}

export interface ChoferMatcheado {
  choferId: string;
  choferNombre: string;
}

// Patente argentina: formato viejo (3 letras + 3 números, ej. ABC123) o
// formato Mercosur (2 letras + 3 números + 2 letras, ej. AB123CD).
const PATRON_PATENTE = /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/;

// Intenta resolver el texto crudo de la columna CHOFER del Excel a un chofer
// real de SimpliRoute. Nunca inventa: si no matchea ni por nombre ni por
// patente (ej. "LUCIA-MATIAS", un par de choferes compartiendo una carga —
// caso real del archivo de septiembre 2026), devuelve null y queda para
// resolver a mano (ver GastosChoferesService.asignarChofer).
export function matchearChofer(
  textoOriginal: string,
  choferes: ChoferParaMatchear[],
  vehiculos: VehiculoParaMatchear[],
): ChoferMatcheado | null {
  const normalizado = normalizarNombreChofer(textoOriginal);
  if (!normalizado) return null;

  const porNombre = choferes.find((chofer) => normalizarNombreChofer(chofer.nombre) === normalizado);
  if (porNombre) return { choferId: porNombre.id, choferNombre: porNombre.nombre };

  // Algunas filas reales traen la patente de la camioneta en vez del nombre
  // del chofer — se resuelve al chofer predeterminado de ESE vehículo.
  const comoPatente = normalizado.replace(/\s+/g, "");
  if (PATRON_PATENTE.test(comoPatente)) {
    const vehiculo = vehiculos.find(
      (candidato) => candidato.patente && candidato.patente.replace(/\s+/g, "").toUpperCase() === comoPatente,
    );
    if (vehiculo?.choferPredeterminadoId) {
      const chofer = choferes.find((candidato) => candidato.id === vehiculo.choferPredeterminadoId);
      if (chofer) return { choferId: chofer.id, choferNombre: chofer.nombre };
    }
  }

  return null;
}
