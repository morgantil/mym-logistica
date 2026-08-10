import { CampoCanonico } from "./campo-canonico";

// Punto de partida — se afina con los tres Excel reales (Biosíntesis, Bella
// Vista, Farmapal) apenas estén disponibles. Agregar un sinónimo acá es la
// ÚNICA forma en la que debería hacer falta tocar código para un cliente
// nuevo cuyo formato sea razonablemente parecido a los que ya conocemos —
// si el formato es realmente distinto, el mapeo manual (ver mapeo-columnas.ts)
// cubre ese caso sin tocar código en absoluto.
export const DICCIONARIO_SINONIMOS: Record<CampoCanonico, string[]> = {
  numeroAfiliado: [
    "AFILIADO",
    "NUMERO DE AFILIADO",
    "NRO AFILIADO",
    "N AFILIADO",
    "COD AFILIADO",
    "CODIGO AFILIADO",
    "ID AFILIADO",
    "NRO DE AFILIADO CSV", // Biosíntesis/Bella Vista/Farmapal (grilla OSDE real)
  ],
  destinatario: [
    "DESTINATARIO",
    "NOMBRE",
    "NOMBRE Y APELLIDO",
    "APELLIDO Y NOMBRE",
    "PACIENTE", // Biosíntesis/Bella Vista/Farmapal
    "BENEFICIARIO",
  ],
  direccion: ["DIRECCION", "DOMICILIO", "DIRECCION DE ENTREGA", "DOMICILIO DE ENTREGA"],
  localidad: ["LOCALIDAD", "BARRIO", "CIUDAD"],
  fechaEntrega: [
    "FECHA",
    "FECHA DE ENTREGA",
    "FECHA ENTREGA",
    "FECHA PROGRAMADA",
    // Biosíntesis/Bella Vista/Farmapal: la celda trae fecha + observaciones de
    // entrega en el mismo texto (ver transformarFila, que separa una de otra).
    "FECHA DE ENTREGA + OBSERVAC",
  ],
  codigoProducto: ["CODIGO", "COD PRODUCTO", "CODIGO PRODUCTO", "EAN"],
  descripcionProducto: [
    "PRODUCTO",
    "DESCRIPCION",
    "DESCRIPCION PRODUCTO",
    "ARTICULO",
    "REFERENCIA", // Biosíntesis/Bella Vista/Farmapal
  ],
  cantidad: ["CANTIDAD", "CANT", "UNIDADES"],
  ticket: ["TICKET", "NRO TICKET", "NUMERO DE TICKET", "N TICKET", "NRO DE TKT"], // Farmapal
  telefono: ["TELEFONO", "TEL", "CELULAR", "TELEFONO CONTACTO", "NRO DE TELEFONO"],
};
