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

// Porcentaje aplicado en una entrega unificada — DOCUMENTO FUNCIONAL.md §25.
// Dos columnas (no una) desde 2026-09-08: el negocio real cobra un %
// configurable de CADA lado (pañal y medicamento), no solo un "% adicional"
// sobre un pañal fijo al 100% como asume el documento Arbet — ver DOCUMENTO
// TECNICO.md historial de esa fecha. Sin vigencia desde 2026-09-11 (mismo
// criterio que TarifaCliente): una fila por cliente, editable, activa/inactiva.
export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
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
