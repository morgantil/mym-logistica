# SimpliRoute

Integración con el proveedor de logística — §9-§10, §12-§13, §18-§19 del
documento funcional. El resto de la app depende de `LogisticaProviderPort`
(`domain/logistica-provider.port.ts`), nunca de SimpliRoute directamente.

## Dos adapters, un mismo puerto

- `SimplirouteMockAdapter` — activo por defecto (`SIMPLIROUTE_MOCK=true`).
  Simula respuestas plausibles sin pegar a ninguna red.
- `SimplirouteHttpAdapter` — adapter real, construido 2026-08-11 contra la
  documentación pública consolidada (`Documentacion simpliroute/`, apéndice
  del proyecto — 14 archivos, ver DOCUMENTO TECNICO.md historial). Se activa
  con `SIMPLIROUTE_MOCK=false` + `SIMPLIROUTE_API_KEY`.

`simpliroute.module.ts` elige entre uno u otro con una factory — el resto de
la app no se entera de cuál está activo.

## Estado: construido, no probado contra una cuenta real

No existe un ambiente sandbox de SimpliRoute (confirmado en la doc: `NOT_DOCUMENTED`
para "Sandbox API separado"). Hasta que exista un API token real, este adapter
pasó `typecheck` + arranque limpio de Nest, pero **ninguna llamada de red se
probó de verdad**. Antes de dar esto por terminado en producción, hay que
verificar cada uno de estos supuestos de mapeo (todos están comentados en el
código, este README los junta en un solo lugar):

| Supuesto | Dónde | Qué confirmar con la cuenta real |
|---|---|---|
| El padrón de destinatarios de MyM ya existe en SimpliRoute como "Client master", con `Client.key` = nuestro `numeroAfiliado` | `buscarDestinatarioPorAfiliado` | Si la cuenta real usa otro campo como key (o el padrón no está cargado ahí todavía), hay que ajustar la query o el flujo de alta |
| `load` de la Visit = cantidad de bultos del pedido | `enviarPedido` | SimpliRoute no define la unidad de `load` — depende de configuración de cuenta (§13, Documentacion simpliroute/05) |
| El body de creación de Visit va como array (`[{...}]}`) aunque sea una sola | `enviarPedido` | La doc dice "uno por uno o en array" pero todos los ejemplos vigentes son array — `NEEDS_VERIFICATION` en la fuente |
| El response de creación/consulta de Visit puede venir como objeto suelto o envuelto en array | `enviarPedido`, `consultarEstado` | Mismo `NEEDS_VERIFICATION` de la fuente — el código ya tolera ambas formas (`primerElemento`), pero conviene loguear la forma real la primera vez que se pruebe |
| No existe endpoint de "sugerencia de zona por dirección" | `obtenerZonaSugerida` | Sigue devolviendo `null` a propósito — si la cuenta real tiene el addon `territory_planner` (ForceField) activado, podría haber otra vía a evaluar |

## Por qué no hay tests automáticos de este adapter

Es un adapter delgado de integración HTTP (parseo de respuesta + mapeo de
campos), no lógica de dominio — el patrón de este proyecto es testear
funciones puras (`motor-facturacion.ts`, `transformar-fila.ts`, etc.), no
mockear `fetch` para adapters de infraestructura. La prueba real de este
código es contra la API de verdad, con el token real, cuando exista.

## Manejo de errores

SimpliRoute no publica un envelope de error único ni un status HTTP de éxito
garantizado por endpoint (Documentacion simpliroute/01). `solicitar()` revisa
2xx/no-2xx, intenta parsear JSON, y si falla preserva el body crudo en
`SimplirouteHttpError`. `buscarDestinatarioPorAfiliado` atrapa cualquier error
internamente y devuelve `null` (mismo criterio que
`GeorefArAdapter.clasificarCabaProvincia`) para no frenar una importación
completa por un problema de red puntual — el resto de los métodos propagan el
error tal cual, porque sus llamadores ya lo manejan por pedido individual
(§18 funcional).
