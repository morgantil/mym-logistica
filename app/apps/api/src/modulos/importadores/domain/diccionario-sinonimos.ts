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
  ],
  destinatario: [
    "DESTINATARIO",
    "NOMBRE",
    "NOMBRE Y APELLIDO",
    "APELLIDO Y NOMBRE",
    "PACIENTE",
    "BENEFICIARIO",
  ],
  direccion: ["DIRECCION", "DOMICILIO", "DIRECCION DE ENTREGA", "DOMICILIO DE ENTREGA"],
  localidad: ["LOCALIDAD", "BARRIO", "CIUDAD"],
  fechaEntrega: ["FECHA", "FECHA DE ENTREGA", "FECHA ENTREGA", "FECHA PROGRAMADA"],
  codigoProducto: ["CODIGO", "COD PRODUCTO", "CODIGO PRODUCTO", "EAN"],
  descripcionProducto: ["PRODUCTO", "DESCRIPCION", "DESCRIPCION PRODUCTO", "ARTICULO"],
  cantidad: ["CANTIDAD", "CANT", "UNIDADES"],
  ticket: ["TICKET", "NRO TICKET", "NUMERO DE TICKET", "N TICKET"],
  telefono: ["TELEFONO", "TEL", "CELULAR", "TELEFONO CONTACTO"],
};
