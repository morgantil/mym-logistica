import { TipoEnvase } from "@mym/shared-types";

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx, paso 2: "Regla simple: si un
// pedido de medicamentos tiene Bolsa y Bulto, para facturación se toma
// solamente como Bulto." Recibe el tipoEnvase de cada línea (Producto) del
// pedido — null para líneas que no lo tengan cargado todavía.
export function determinarClasificacionMedicamento(
  tiposEnvaseDeLasLineas: (TipoEnvase | null)[],
): TipoEnvase | null {
  if (tiposEnvaseDeLasLineas.includes(TipoEnvase.BULTO)) return TipoEnvase.BULTO;
  if (tiposEnvaseDeLasLineas.includes(TipoEnvase.BOLSA)) return TipoEnvase.BOLSA;
  return null;
}
