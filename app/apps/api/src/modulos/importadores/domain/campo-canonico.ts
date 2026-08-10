// Campos que el sistema necesita extraer de CUALQUIER Excel de pañales, sin
// importar cómo el cliente llame a sus columnas — DOCUMENTO FUNCIONAL.md §6.
// Farmapal usa "ticket" (§4 funcional); el resto no. Los opcionales quedan
// marcados en CAMPOS_OBLIGATORIOS más abajo, no en este tipo.
export type CampoCanonico =
  | "numeroAfiliado"
  | "destinatario"
  | "direccion"
  | "localidad"
  | "fechaEntrega"
  | "codigoProducto"
  | "descripcionProducto"
  | "cantidad"
  | "ticket"
  | "telefono";

// §6 funcional: "Que exista número de afiliado / destinatario / dirección /
// localidad / fecha de entrega / productos / cantidad". Código de producto,
// ticket y teléfono son opcionales — si faltan, no bloquean el mapeo automático.
export const CAMPOS_OBLIGATORIOS: CampoCanonico[] = [
  "numeroAfiliado",
  "destinatario",
  "direccion",
  "localidad",
  "fechaEntrega",
  "descripcionProducto",
  "cantidad",
];

export const CAMPOS_OPCIONALES: CampoCanonico[] = ["codigoProducto", "ticket", "telefono"];

// Mapeo resuelto: campo canónico -> nombre EXACTO del encabezado en el Excel
// de ese cliente en particular. Esto es lo que se guarda en PerfilImportacion.
export type MapeoColumnas = Partial<Record<CampoCanonico, string>>;
