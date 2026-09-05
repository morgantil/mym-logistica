// El cliente confirmó que ninguna entrega sale nunca de Buenos Aires
// (CABA + GBA) — cualquier coordenada fuera de este rectángulo es un error
// de geocodificación garantizado, no un caso real a soportar. Encontrado
// 2026-09-04: un pedido con dirección "Balcarce 594" sin localidad
// geocodificó en San Luis (-33.68, -65.47), a 600+ km, con `geocode_alert:
// "no alert"` (SimpliRoute confiado pero equivocado) — SimpliRoute no tiene
// forma de saber que operamos solo en esta zona, así que esta validación
// solo la podemos hacer nosotros. Rectángulo generoso: cubre CABA + todo el
// conurbano (La Plata, Escobar, Luján, San Vicente) sin acercarse a otra
// provincia.
const LIMITES_BUENOS_AIRES = {
  latMin: -35.5,
  latMax: -34.0,
  lonMin: -59.5,
  lonMax: -57.8,
};

export function estaDentroDeBuenosAires(latitud: number, longitud: number): boolean {
  return (
    latitud >= LIMITES_BUENOS_AIRES.latMin &&
    latitud <= LIMITES_BUENOS_AIRES.latMax &&
    longitud >= LIMITES_BUENOS_AIRES.lonMin &&
    longitud <= LIMITES_BUENOS_AIRES.lonMax
  );
}
