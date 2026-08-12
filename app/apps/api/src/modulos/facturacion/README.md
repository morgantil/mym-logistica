# Facturación

Responsable de: §21-§32 del documento funcional. El módulo más sensible del
sistema (plata real) — construido con tests exhaustivos del motor de reglas
antes que nada más (ver `domain/motor-facturacion.spec.ts`).

## Qué falta para estar 100% terminado

Una sola cosa, y es una decisión de negocio, no técnica: la **pregunta 1**
de `PREGUNTAS_FACTURACION.pdf` (qué servicio se cobra al 100% en una entrega
unificada pañales+medicamentos). Mientras no llegue esa respuesta:

- `domain/motor-facturacion.ts` usa `SERVICIO_AL_CIEN_POR_CIENTO_EN_UNIFICADA`
  como placeholder documentado (hoy: pañales). El importe total calculado
  **no depende** de este valor — solo determina qué pedido queda marcado
  como "principal" en la trazabilidad (§32).
- En la práctica esta rama todavía no se ejecuta nunca: medicamentos es
  Etapa 2 (§37 funcional) y no se importa ningún pedido de ese tipo hoy, así
  que `buscarUnificaciones` siempre devuelve 0 unificaciones en producción.
- Cambiar la constante el día que llegue la respuesta es una línea, no un
  cambio de arquitectura.

Todo lo demás (tarifas por cliente, CABA/Provincia, 2×1, vista previa,
confirmación, trazabilidad) está construido y probado de punta a punta.

## Forma real (implementada)

```
facturacion/
  domain/
    motor-facturacion.ts       → funciones puras: agruparPorClienteFechaDireccion,
                                  separarPorTipoServicio, buscarUnificaciones,
                                  aplicarDosPorUno, calcularFacturacionCliente
                                  (orquesta los 7 pasos del §27). Sin NestJS/Prisma.
    motor-facturacion.spec.ts  → los 4 casos de ejemplo del §28 funcional +
                                  edge cases (§26 qué NO es unificada, §29
                                  clientes que no se cruzan, tarifa CABA vs
                                  Provincia). 16 tests.
    tarifa.ts                  → TarifaCliente / PorcentajeSegundoServicio (dominio)
    grupo-facturacion.ts       → GrupoFacturacion (dominio)
    facturacion.repositorio.ts → puerto
  application/
    facturacion.service.ts     → generarVistaPrevia (corre el motor, deja
                                  GrupoFacturacion en BORRADOR, recalculable
                                  las veces que haga falta) y confirmar (pasa
                                  a CONFIRMADO — a partir de ahí queda en
                                  firme, un mes confirmado no se recalcula)
  infrastructure/
    facturacion.repositorio.prisma.ts → tarifas/porcentaje con vigencia
                                  automática (crear una nueva cierra la
                                  anterior), grupos en una transacción atómica
    reporte-mensual-excel.generador.ts → §31 funcional: dos hojas ("Detalle
                                  por pedido" con trazabilidad completa,
                                  "Resumen por viaje" con el importe real) —
                                  dos hojas en vez de una porque un viaje
                                  2×1/unificada agrupa hasta 2 pedidos y el
                                  documento funcional no define una regla para
                                  repartir el importe entre ellos
  interface/
    facturacion.controller.ts  → GET/POST tarifas y porcentaje-segundo-servicio,
                                  GET grupos, POST vista-previa, POST confirmar,
                                  GET reporte-mensual (descarga .xlsx)
                                  — todo detrás de Rol.FACTURACION/ADMINISTRACION
```

## Decisiones no obvias

- **Solo se facturan pedidos `ENTREGADO`.** No está escrito literalmente en
  el documento funcional, pero es la lectura de negocio razonable (no se
  cobra una entrega fallida o cancelada) — si el cliente final dice lo
  contrario, es un cambio de un `where` en `PedidosRepositorio.listarFacturables`.
- **`GrupoFacturacion` no tiene borrado lógico** (no está en
  `MODELOS_CON_BORRADO_LOGICO`, a propósito): un `BORRADOR` sin confirmar no
  tiene valor de auditoría, así que recalcular la vista previa lo borra
  físicamente y genera de nuevo. Un `CONFIRMADO` nunca se borra ni se
  recalcula — el código lo impide explícitamente.
- **`Pedido.grupoFacturacionId`/`reglaAplicada`** se escriben directo desde
  `FacturacionRepositorioPrisma` (no a través de `PedidosService`) porque
  necesitan ser atómicos con la creación/borrado de `GrupoFacturacion` dentro
  de la misma transacción Prisma.
- **La transacción de `reemplazarBorrador` tiene `timeout: 30000`** (el
  default de Prisma es 5s). Hace un `create` + `updateMany` por cada viaje
  (no se puede batchear en un solo `createMany` por la relación `pedidos:
  connect`) — contra Neon, con su latencia de red real, un mes con varios
  viajes puede superar los 5s por defecto. Bug real encontrado en QA el
  2026-08-11 con solo 2 viajes.
- **El reporte mensual usa `StreamableFile`, no `Buffer` directo.** Devolver
  un `Buffer` desde un controller (incluso con `@Res({passthrough:true})`
  solo para headers) igual pasa por el serializador JSON de Nest — el
  navegador recibía `{"type":"Buffer","data":[...]}` en vez del `.xlsx` real.
  Bug real encontrado en la misma QA.
