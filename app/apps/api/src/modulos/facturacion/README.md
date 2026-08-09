# Facturación — pendiente de implementación

Responsable de: §21-§32 del documento funcional. El módulo más sensible del
sistema (plata real) — se construye con tests exhaustivos antes que nada más.

## Por qué no está implementado todavía

Es lógica de dominio pura no trivial (2×1, entregas unificadas, orden de pasos
§27) y el criterio explícito del proyecto es priorizar que esté bien resuelto
por sobre tenerlo rápido — no tiene sentido escribir el motor de reglas antes
de tener Pedido/Cliente/Tarifa funcionando de punta a punta para poder
alimentarlo con datos reales.

## Forma prevista (cuando se ataque)

```
facturacion/
  domain/
    motor-facturacion.ts   → función pura: agruparPorClienteFechaDireccion,
                              separarPorTipoServicio, buscarUnificaciones,
                              aplicarDosPorUno, aplicarTarifa (§27 funcional,
                              paso a paso, cada paso testeado por separado)
  application/
    facturacion.service.ts → orquesta: lee pedidos del mes/cliente, corre el
                              motor, crea GrupoFacturacion en estado BORRADOR
                              (vista previa — confirmado en DOCUMENTO TECNICO.md),
                              y solo al confirmar pasa a CONFIRMADO y queda en firme.
  infrastructure/
    facturacion.repositorio.prisma.ts
  interface/
    facturacion.controller.ts → GET vista previa, POST confirmar, GET reporte
                                 mensual exportable a Excel (§31 funcional)
```

El motor de reglas (`motor-facturacion.ts`) debe ser 100% funciones puras sin
dependencias de NestJS/Prisma — así se puede testear con los casos de ejemplo
del §28 funcional (10 pañales → 5 viajes, 3 medicamentos → 2 viajes, etc.) sin
necesitar una base de datos levantada.
