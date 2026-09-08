import { TipoEnvase, TipoServicio } from "@mym/shared-types";

// Tarifas por cliente y zona tarifaria (CABA/Cordón 1/2/3, configurable —
// ver ZonaTarifaria), con vigencia para mantener histórico. DOCUMENTO
// FUNCIONAL.md §23, actualizado por el documento v6 §10.2 (zonas por cordón)
// y por Guia_Desarrollo_Logica_Facturacion_Arbet.docx paso 5 (dimensión
// tipoServicio/tipoEnvase — medicamentos tiene tarifa propia por Bolsa/Bulto).
export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  monto: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

// Porcentaje aplicado en una entrega unificada, también con vigencia —
// DOCUMENTO FUNCIONAL.md §25. Dos columnas (no una) desde 2026-09-08: el
// negocio real cobra un % configurable de CADA lado (pañal y medicamento),
// no solo un "% adicional" sobre un pañal fijo al 100% como asume el
// documento Arbet — ver DOCUMENTO TECNICO.md historial de esa fecha.
export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
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

// Liquidación a transportistas — monto fijo por viaje, configurable con
// vigencia (decisión 2026-08-26, ver DOCUMENTO TECNICO.md historial). Sin
// clienteId: es un valor único, no depende del cliente.
export interface TarifaTransportista {
  id: string;
  monto: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}
