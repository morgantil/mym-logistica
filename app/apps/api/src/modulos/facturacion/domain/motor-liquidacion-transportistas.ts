// Liquidación a transportistas (TEMAS_PENDIENTES.md §4.2) — monto fijo por
// viaje, sin 2×1 ni entrega unificada (a diferencia de la facturación a
// clientes, ver motor-facturacion.ts): cada pedido ENTREGADO es un viaje
// completo, punto. Función pura, testeable sin base de datos, mismo criterio
// que el resto del módulo.

export interface PedidoParaLiquidarTransportista {
  id: string;
  choferId: string;
  choferNombre: string;
}

export interface ResumenChofer {
  choferId: string;
  choferNombre: string;
  cantidadViajes: number;
  tarifaPorViaje: number;
  totalAPagar: number;
}

// Agrupa por chofer y multiplica por la tarifa vigente (un único monto para
// todo el cálculo — mismo criterio que FacturacionService.generarVistaPrevia,
// que usa la tarifa vigente al momento de calcular, no una por pedido).
// Ordenado por total a pagar descendente — el caso de uso típico es "quién
// cobra más este mes", no un orden alfabético.
export function calcularLiquidacionTransportistas(
  pedidos: PedidoParaLiquidarTransportista[],
  tarifaPorViaje: number,
): ResumenChofer[] {
  const porChofer = new Map<string, ResumenChofer>();

  for (const pedido of pedidos) {
    const existente = porChofer.get(pedido.choferId);
    if (existente) {
      existente.cantidadViajes++;
      existente.totalAPagar += tarifaPorViaje;
    } else {
      porChofer.set(pedido.choferId, {
        choferId: pedido.choferId,
        choferNombre: pedido.choferNombre,
        cantidadViajes: 1,
        tarifaPorViaje,
        totalAPagar: tarifaPorViaje,
      });
    }
  }

  return Array.from(porChofer.values()).sort((a, b) => b.totalAPagar - a.totalAPagar);
}
