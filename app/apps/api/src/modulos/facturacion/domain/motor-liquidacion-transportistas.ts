import { CabaProvincia } from "@mym/shared-types";

// Liquidación a transportistas (TEMAS_PENDIENTES.md §4.2) — monto fijo por
// viaje, sin 2×1 ni entrega unificada (a diferencia de la facturación a
// clientes, ver motor-facturacion.ts): cada pedido ENTREGADO es un viaje
// completo, punto. Desde el 2026-10-04 el monto por viaje distingue zona
// (CABA/Provincia, decisión del cliente) — un mismo chofer puede tener
// viajes de las dos zonas en el mismo mes, a tarifas distintas. Función
// pura, testeable sin base de datos, mismo criterio que el resto del módulo.

export interface PedidoParaLiquidarTransportista {
  id: string;
  choferId: string;
  choferNombre: string;
  zona: CabaProvincia;
}

export interface ResumenChofer {
  choferId: string;
  choferNombre: string;
  viajesCaba: number;
  viajesProvincia: number;
  totalAPagar: number;
}

// Ordenado por total a pagar descendente — el caso de uso típico es "quién
// cobra más este mes", no un orden alfabético. `tarifaPorZona` debe traer un
// monto para cada zona que de verdad aparezca en `pedidos` — eso lo
// garantiza FacturacionService.liquidacionTransportistas antes de llamar acá
// (nunca se cobra $0 por una zona sin tarifa configurada, ver ese método).
export function calcularLiquidacionTransportistas(
  pedidos: PedidoParaLiquidarTransportista[],
  tarifaPorZona: Record<CabaProvincia, number>,
): ResumenChofer[] {
  const porChofer = new Map<string, ResumenChofer>();

  for (const pedido of pedidos) {
    const existente = porChofer.get(pedido.choferId) ?? {
      choferId: pedido.choferId,
      choferNombre: pedido.choferNombre,
      viajesCaba: 0,
      viajesProvincia: 0,
      totalAPagar: 0,
    };
    if (pedido.zona === CabaProvincia.CABA) {
      existente.viajesCaba++;
    } else {
      existente.viajesProvincia++;
    }
    existente.totalAPagar += tarifaPorZona[pedido.zona];
    porChofer.set(pedido.choferId, existente);
  }

  return Array.from(porChofer.values()).sort((a, b) => b.totalAPagar - a.totalAPagar);
}
