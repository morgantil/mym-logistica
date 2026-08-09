// Vocabulario de dominio compartido entre apps/api y apps/web.
// Debe reflejar 1:1 los enums definidos en apps/api/prisma/schema.prisma.

export enum Rol {
  OPERACIONES = "OPERACIONES",
  LOGISTICA = "LOGISTICA",
  ADMINISTRACION = "ADMINISTRACION",
  FACTURACION = "FACTURACION",
}

export enum TipoServicio {
  PANAL = "PANAL",
  MEDICAMENTO = "MEDICAMENTO",
}

export enum CabaProvincia {
  CABA = "CABA",
  PROVINCIA = "PROVINCIA",
}

// Estados funcionales del pedido — DOCUMENTO FUNCIONAL.md §19
export enum EstadoPedido {
  SIN_ASIGNAR = "SIN_ASIGNAR",
  COORDINADO = "COORDINADO",
  EN_TRANSITO = "EN_TRANSITO",
  ENTREGADO = "ENTREGADO",
  ENTREGA_FALLIDA = "ENTREGA_FALLIDA",
  CANCELADO = "CANCELADO",
}

export enum EstadoValidacion {
  PENDIENTE = "PENDIENTE",
  VALIDO = "VALIDO",
  CON_ERRORES = "CON_ERRORES",
}

export enum EstadoSimpliroute {
  NO_ENVIADO = "NO_ENVIADO",
  ENVIADO = "ENVIADO",
  NO_ENCONTRADO = "NO_ENCONTRADO",
  ERROR = "ERROR",
}

export enum EstadoImportacion {
  PROCESANDO = "PROCESANDO",
  COMPLETADA = "COMPLETADA",
  COMPLETADA_CON_ERRORES = "COMPLETADA_CON_ERRORES",
  FALLIDA = "FALLIDA",
}

export enum EstadoGrupoFacturacion {
  BORRADOR = "BORRADOR",
  CONFIRMADO = "CONFIRMADO",
}

export enum AccionAuditoria {
  CREAR = "CREAR",
  ACTUALIZAR = "ACTUALIZAR",
  BORRAR = "BORRAR",
  RESTAURAR = "RESTAURAR",
}

// DOCUMENTO FUNCIONAL.md §11 — resolución de dirección distinta a la registrada
export enum ResolucionDireccion {
  USAR_SOLO_ESTE_PEDIDO = "USAR_SOLO_ESTE_PEDIDO",
  ACTUALIZAR_PADRON = "ACTUALIZAR_PADRON",
  MANTENER_EXISTENTE = "MANTENER_EXISTENTE",
}
