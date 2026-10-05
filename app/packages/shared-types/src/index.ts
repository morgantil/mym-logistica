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

// Qué tipo de servicio maneja un Cliente (farmacia) — distinto de
// TipoServicio (siempre uno solo por Pedido): un Cliente puede manejar
// los dos (ej. Bella Vista importa tanto pañales como medicamentos).
export enum TipoServicioCliente {
  PANAL = "PANAL",
  MEDICAMENTO = "MEDICAMENTO",
  AMBOS = "AMBOS",
}

// Qué remito preimpreso usa un cliente — decisión 2026-10-04 (reunión con
// Pablo Renzo): cada cliente trae su propio papel con membrete propio, el
// sistema solo imprime los datos variables en las coordenadas de ESE
// formato. Null en Cliente.formatoRemito = sin remito preimpreso configurado.
export enum FormatoRemito {
  BELLA_VISTA = "BELLA_VISTA",
  FARMAPAL = "FARMAPAL",
}

// Clasificación de un pedido de medicamentos para facturación (Guia_Desarrollo_
// Logica_Facturacion_Arbet.docx, paso 2): Bolsa o Bulto tienen tarifa propia
// por cliente+zona. Un pedido nunca es "los dos" a nivel de facturación — si
// sus líneas mezclan Bolsa y Bulto, se factura como Bulto (regla simple del
// documento). Null = no es un pedido de medicamentos (pañales no la usan).
export enum TipoEnvase {
  BOLSA = "BOLSA",
  BULTO = "BULTO",
}

// Prioridad de un pedido — decisión 2026-09-24 (Leonardo, cliente): regla
// general para todos los clientes, se puede marcar a mano o derivar de una
// ReglaImportacion (ej. "URGENCIA 24 HS" → URGENTE). La grilla pinta la fila
// según este valor.
export enum PrioridadPedido {
  NORMAL = "NORMAL",
  // Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo): un pedido de
  // fin de semana necesita más atención que uno normal mientras se reparte,
  // pero no es necesariamente tan grave como Urgente/Crítica — queda
  // segundo en la escala. Ver severidad en pedido.ts (prioridadMasAlta).
  FIN_DE_SEMANA = "FIN_DE_SEMANA",
  URGENTE = "URGENTE",
  CRITICA = "CRITICA",
}

// Clasificación geográfica simple (CABA vs. interior/provincia) que devuelve
// GeorefArAdapter al resolver una dirección — NO refleja un enum de Prisma
// (a partir de 2026-08-17 la unidad de facturación es ZonaTarifaria, una
// tabla configurable, no un valor fijo). Ver DOCUMENTO TECNICO.md historial.
export enum CabaProvincia {
  CABA = "CABA",
  PROVINCIA = "PROVINCIA",
}

// Fila de la tabla configurable de zonas de facturación (§10 funcional v6) —
// reemplaza el enum fijo CABA/Provincia. "CABA" y "Provincia" existen como
// filas semilla; Cordón 1/2/3 se agregan como datos, no como código nuevo.
export interface ZonaTarifaria {
  id: string;
  nombre: string;
  activa: boolean;
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

// ABM de combustible y peajes por chofer (ítem desbloqueado 2026-10-05) — ver
// comentario en schema.prisma, modelo GastoChofer.
export enum TipoGastoChofer {
  COMBUSTIBLE = "COMBUSTIBLE",
  PEAJE = "PEAJE",
}
