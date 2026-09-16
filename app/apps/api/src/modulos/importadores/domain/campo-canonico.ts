import { TipoServicio } from "@mym/shared-types";

// Campos que el sistema necesita extraer de CUALQUIER Excel de pañales O
// medicamentos, sin importar cómo el cliente llame a sus columnas —
// DOCUMENTO FUNCIONAL.md §6. Farmapal usa "ticket" (§4 funcional); Farmaet
// también, con otro nombre ("Remito") pero el mismo rol — ver
// TEMAS_PENDIENTES.md §13.14. Los campos específicos de medicamentos
// (decisión 2026-09-13, Excel real de Farmaet/Bella Vista) son todos
// opcionales: ningún cliente de pañales los tiene.
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
  | "telefono"
  // --- Específicos de medicamentos (Guia Arbet, ver TEMAS_PENDIENTES.md §13.14) ---
  | "receta" // valor crudo (EV/ENV/RR/FIS en Farmaet, "Digital"/"Fisica"/"Sin Receta" en Bella Vista) — se normaliza después con el ABM, ver receta-sinonimo.ts
  | "tipoPedido" // se importa tal cual, sin transformar (Farmaet: "RETIRO DE RECETA", "DT ESP", "PREP_HELADERA", etc.)
  | "retiroDeReceta" // columna propia en Bella Vista (SI/NO); en Farmaet este concepto viene como un valor de "tipoPedido"
  | "tiempoDeEntrega" // dispara Urgente/Crítica (ver TEMAS_PENDIENTES.md §13.15) — ej. "72 HS HABITUAL" vs "URGENCIA 24 HS"
  | "horarioEntrega" // franja horaria de entrega, ej. "10 a 20 hs"
  | "envaseTexto" // Farmaet: Bolsa/Bulto como texto en la columna "Empresa" (ej. "M&M BOLSA")
  | "cantidadBulto" // Bella Vista: cantidad de bultos (columna "BULTO")
  | "cantidadBolsa"; // Bella Vista: cantidad de bolsas (columna "BOLSA")

// §6 funcional: "Que exista número de afiliado / destinatario / dirección /
// localidad / fecha de entrega / productos / cantidad". Código de producto,
// ticket y teléfono son opcionales — si faltan, no bloquean el mapeo automático.
export const CAMPOS_OBLIGATORIOS: CampoCanonico[] = [
  "numeroAfiliado",
  "destinatario",
  "direccion",
  "localidad",
  "descripcionProducto",
  "cantidad",
];

// Medicamentos (Farmaet/Bella Vista, decisión 2026-09-15): ningún Excel real
// trae columna de "descripción de producto" ni "cantidad" — el producto es
// SINTÉTICO y la cantidad se deriva de Bolsa/Bulto (ver
// transformar-fila-medicamento.ts), así que exigirlos como obligatorios
// dejaría el mapeo manual sin poder completarse nunca para este tipo de cliente.
export const CAMPOS_OBLIGATORIOS_MEDICAMENTO: CampoCanonico[] = [
  "numeroAfiliado",
  "destinatario",
  "direccion",
  "localidad",
];

export function camposObligatoriosPara(tipoServicio: TipoServicio): CampoCanonico[] {
  return tipoServicio === TipoServicio.MEDICAMENTO ? CAMPOS_OBLIGATORIOS_MEDICAMENTO : CAMPOS_OBLIGATORIOS;
}

// `fechaEntrega` es opcional a propósito (decisión 2026-09-13, caso real
// Farmaet): la fecha real del pedido SIEMPRE es la que el usuario informa al
// iniciar la importación (`fechaEntregaLote`, ver transformarFila) — la
// columna del Excel, cuando existe, solo aporta una nota de entrega pegada
// al texto (ver extraerNotaDeCeldaFecha), nunca decide la fecha. Un cliente
// cuyo archivo no tenga ninguna columna de fecha (como Farmaet) igual se
// puede importar sin pedirle al usuario que "invente" un mapeo para una
// columna que no existe.
export const CAMPOS_OPCIONALES: CampoCanonico[] = [
  "fechaEntrega",
  "codigoProducto",
  "ticket",
  "telefono",
  "receta",
  "tipoPedido",
  "retiroDeReceta",
  "tiempoDeEntrega",
  "horarioEntrega",
  "envaseTexto",
  "cantidadBulto",
  "cantidadBolsa",
];

// Mapeo resuelto: campo canónico -> nombre EXACTO del encabezado en el Excel
// de ese cliente en particular. Esto es lo que se guarda en PerfilImportacion.
export type MapeoColumnas = Partial<Record<CampoCanonico, string>>;
