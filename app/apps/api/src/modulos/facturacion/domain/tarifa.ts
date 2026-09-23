import { TipoEnvase, TipoServicio } from "@mym/shared-types";

// Tarifas por cliente y zona tarifaria (CABA/Cordón 1/2/3, configurable —
// ver ZonaTarifaria). DOCUMENTO FUNCIONAL.md §23, actualizado por el
// documento v6 §10.2 (zonas por cordón) y por Guia_Desarrollo_Logica_
// Facturacion_Arbet.docx paso 5 (dimensión tipoServicio/tipoEnvase —
// medicamentos tiene tarifa propia por Bolsa/Bulto). Decisión 2026-09-11:
// una sola fila por cliente+zona+tipo+envase, editable, con un toggle
// activa/inactiva (mismo criterio que ZonaTarifaria.activa) — se sacó el
// historial automático por vigencia que tenía antes, Leonardo lo pidió más
// simple. Las facturaciones ya calculadas no dependen de esto: GrupoFacturacion
// guarda su propio importe/tarifa como snapshot, no una referencia viva acá.
export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  monto: number;
  activa: boolean;
}

// Porcentaje aplicado al lado PAÑAL de una entrega unificada — DOCUMENTO
// FUNCIONAL.md §25. Decisión 2026-09-08: el negocio real cobra un %
// configurable del pañal, no un pañal fijo al 100% como asume el documento
// Arbet — ver DOCUMENTO TECNICO.md historial de esa fecha. Decisión
// 2026-09-12 (ping-pong con Leonardo): el lado MEDICAMENTO dejó de usar un
// segundo porcentaje acá — pasa a ser un monto fijo en pesos que varía por
// zona (ver MontoUnificadoMedicamento más abajo), "un plus editable por
// llevar el medicamento de paso" en sus palabras, no un % de ninguna tarifa.
// Sin vigencia desde 2026-09-11 (mismo criterio que TarifaCliente): una fila
// por cliente, editable, activa/inactiva.
export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  activa: boolean;
}

// Monto fijo que cobra el lado MEDICAMENTO de una entrega unificada, "de
// paso" por compartir el viaje con el pañal — decisión 2026-09-12. Varía por
// zona tarifaria (Leonardo: 2 valores CABA/Provincia para Farmaet, Farmapal,
// Biosíntesis y el lado pañal de Bella Vista; 4 valores, uno por Cordón,
// específicamente para Bella Vista Medicamentos). `tipoEnvase` es opcional
// a propósito — hoy el monto es el mismo sea Bolsa o Bulto (una sola fila
// con tipoEnvase null cubre los dos), pero Leonardo pidió dejar la puerta
// abierta a diferenciarlo en el futuro sin otra migración: alcanzaría con
// cargar una fila para BOLSA y otra para BULTO en esa misma zona.
export interface MontoUnificadoMedicamento {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoEnvase: TipoEnvase | null;
  monto: number;
  activa: boolean;
}

// Combinaciones habilitadas de unificación ENTRE clientes distintos — ver
// comentario del modelo Prisma para la distinción con la unificación interna
// de un cliente AMBOS (Bella Vista), que no usa esta tabla.
export interface CombinacionUnificacionClientes {
  id: string;
  clienteMedicamentoId: string;
  clienteMedicamentoNombre?: string;
  clientePanalId: string;
  clientePanalNombre?: string;
  nombre: string | null;
  activa: boolean;
}

// Liquidación a transportistas — monto fijo por viaje (decisión 2026-08-26,
// ver DOCUMENTO TECNICO.md historial). Sin clienteId: es un valor único, no
// depende del cliente. Sin vigencia desde 2026-09-11, mismo criterio que
// TarifaCliente.
export interface TarifaTransportista {
  id: string;
  monto: number;
  activa: boolean;
}
