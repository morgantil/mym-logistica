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
  // "REMITO" (Farmaet, Bella Vista) cumple el mismo rol que el ticket de
  // Farmapal — distingue pedidos originales agrupados en un mismo Pedido
  // para el 2×1 (ver Pedido.cantidadPedidoOriginal). Verificado con datos
  // reales de Farmaet: 45/86 pacientes con varios remitos distintos en la
  // misma dirección.
  ticket: ["TICKET", "NRO TICKET", "NUMERO DE TICKET", "N TICKET", "NRO DE TKT", "REMITO"],
  telefono: ["TELEFONO", "TEL", "CELULAR", "TELEFONO CONTACTO", "NRO DE TELEFONO"],
  // --- Específicos de medicamentos (verificado contra los Excel reales de
  // Farmaet y Bella Vista, 2026-09-13 — ver TEMAS_PENDIENTES.md §13.14) ---
  receta: ["RECETA", "RECETAS"],
  tipoPedido: ["TIPO DE PEDIDO"],
  retiroDeReceta: ["RETIRO DE RECETA"],
  tiempoDeEntrega: ["TIEMPO DE ENTREGA"],
  horarioEntrega: ["HORARIO DE ENTREGA", "HORA"],
  // Farmaet: "ENTRE CALLE + observacones" (sic); Bella Vista: "ENTRE CALLES E INFO ADICIONAL".
  entreCalles: [
    "ENTRE CALLE",
    "ENTRE CALLES",
    "ENTRE CALLE + OBSERVACONES",
    "ENTRE CALLE + OBSERVACIONES",
    "ENTRE CALLES E INFO ADICIONAL",
  ],
  // OJO: "EMPRESA" es ambiguo entre clientes — en Farmaet trae Bolsa/Bulto
  // (útil), en Bella Vista es una columna sin uso (siempre "PREVIVAX",
  // constante). Es inofensivo que el mapeo automático lo detecte en los dos
  // (es opcional, nunca bloquea), siempre que la lógica que deriva
  // Bolsa/Bulto revise primero cantidadBulto/cantidadBolsa (Bella Vista) y
  // solo caiga a envaseTexto si esos dos no vinieron mapeados.
  envaseTexto: ["EMPRESA"], // Farmaet: texto tipo "M&M BOLSA"/"M&M BULTO"
  cantidadBulto: ["BULTO"], // Bella Vista: cantidad
  cantidadBolsa: ["BOLSA"], // Bella Vista: cantidad
};
