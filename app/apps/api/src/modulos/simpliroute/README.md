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

## Decisión 2026-08-25/26: SimpliRoute como fuente de verdad para Zonas/Choferes/Vehículos

Revierte una decisión anterior (2026-08-17) de no importar nada de esto. El
principio ahora es general para toda la integración: si un recurso de la API
pública de SimpliRoute tiene CRUD completo, esta app lo usa para leer **y**
escribir (Choferes, Vehículos); si solo tiene lectura pública (Zonas), esta
app solo lee/muestra — cualquier alta o edición de Zona sigue haciéndose en
SimpliRoute. `ZonasChoferesService` (módulo `zonas-choferes/`) cachea
localmente el resultado de `listarZonas`/`listarChoferes`/`listarVehiculos`
con refresco perezoso (sin BullMQ/Redis, ver comentario en ese servicio) y
resuelve la Zona de un pedido con point-in-polygon contra el catálogo
(`zonas-choferes/domain/punto-en-poligono.ts`) — SimpliRoute no expone un
endpoint para "qué zona corresponde a esta dirección".

## Estado: leer/escribir Visits y leer Zonas/Choferes/Vehículos validado contra la cuenta real

No existe un ambiente sandbox de SimpliRoute (confirmado en la doc: `NOT_DOCUMENTED`
para "Sandbox API separado"). Se probó contra la cuenta real
(`MYM LOGISTICA Y DISTRIBUCION SRL`) en varias sesiones (2026-08-16 y
2026-08-26) — ver detalle completo en DOCUMENTO TECNICO.md historial. Estado
por grupo de métodos:

| Método(s) | Estado contra cuenta real | Detalle |
|---|---|---|
| `buscarDestinatarioPorAfiliado` | ✅ Validado (lectura, 2026-08-16) | |
| `enviarPedido`, `consultarEstado` | ✅ Validado (lectura y escritura, 2026-08-16) | Ver supuestos de mapeo abajo. |
| `listarZonas`, `listarChoferes`, `listarVehiculos` | ✅ Validado (lectura, 2026-08-26) | 11 zonas reales, 12 vehículos, 17 choferes — el addon de Zonas está habilitado en la cuenta. |
| `crearChofer`, `actualizarChofer`, `eliminarChofer` | ⚪ Sin probar contra cuenta real | Mismo patrón que las escrituras de Destinatario: el entorno de Claude Code bloquea `POST`/`PUT`/`DELETE` contra servicios externos reales — si se quiere validar antes de confiar en esto en producción, Leonardo tiene que correr la prueba manualmente desde su terminal (ver historial 2026-08-16 para el procedimiento). |
| `crearVehiculo`, `actualizarVehiculo`, `eliminarVehiculo` | ⚪ Sin probar contra cuenta real | Idem. |

Hasta que se pruebe cada grupo pendiente, hay que verificar estos supuestos
de mapeo (todos están comentados en el código, este README los junta en un
solo lugar):

| Supuesto | Dónde | Qué confirmar con la cuenta real |
|---|---|---|
| El padrón de destinatarios de MyM ya existe en SimpliRoute como "Client master", con `Client.key` = nuestro `numeroAfiliado` | `buscarDestinatarioPorAfiliado` | ✅ confirmado 2026-08-16. |
| `load` de la Visit = cantidad de bultos del pedido | `enviarPedido` | SimpliRoute no define la unidad de `load` — depende de configuración de cuenta (§13, Documentacion simpliroute/05) |
| El body de creación de Visit va como array (`[{...}]}`) aunque sea una sola | `enviarPedido` | La doc dice "uno por uno o en array" pero todos los ejemplos vigentes son array — `NEEDS_VERIFICATION` en la fuente |
| El response de creación/consulta de Visit puede venir como objeto suelto o envuelto en array | `enviarPedido`, `consultarEstado` | Mismo `NEEDS_VERIFICATION` de la fuente — el código ya tolera ambas formas (`primerElemento`), pero conviene loguear la forma real la primera vez que se pruebe |
| `activo` de Chofer = `is_driver && !blocked` | `listarChoferes` | No hay un único campo de "estado" documentado para Users/Drivers — `blocked` aparece en `/v1/accounts/me/` pero no está confirmado en list/retrieve de drivers. |
| Al actualizar un Chofer sin mandar `password`, SimpliRoute preserva la contraseña actual | `actualizarChofer` | SimpliRoute solo documenta `PUT` (no `PATCH`) para Users, con `password` en el ejemplo de body — no está documentado qué pasa si se omite (Documentacion simpliroute/04). El adapter lo omite del body si no se manda; **sin confirmar**. |
| `choferPredeterminadoId` de Vehicle = `default_driver` | `listarVehiculos`, `crearVehiculo`, `actualizarVehiculo` | Confirmado por lectura (2026-08-26): el campo existe y trae IDs de Driver reales. Sin probar escritura. |

## Por qué no hay tests automáticos de este adapter

Es un adapter delgado de integración HTTP (parseo de respuesta + mapeo de
campos), no lógica de dominio — el patrón de este proyecto es testear
funciones puras (`motor-facturacion.ts`, `transformar-fila.ts`,
`punto-en-poligono.ts`, etc.), no mockear `fetch` para adapters de
infraestructura. La prueba real de este código es contra la API de verdad,
con el token real — ya se hizo para lectura de Visits/Clients/Zonas/
Choferes/Vehículos y escritura de Visits/Clients; falta para escritura de
Choferes/Vehículos (ver tabla arriba).

## Manejo de errores

SimpliRoute no publica un envelope de error único ni un status HTTP de éxito
garantizado por endpoint (Documentacion simpliroute/01). `solicitar()` revisa
2xx/no-2xx, intenta parsear JSON, y si falla preserva el body crudo en
`SimplirouteHttpError`. `buscarDestinatarioPorAfiliado` atrapa cualquier error
internamente y devuelve `null` (mismo criterio que
`GeorefArAdapter.clasificarCabaProvincia`) para no frenar una importación
completa por un problema de red puntual — el resto de los métodos propagan el
error tal cual, porque sus llamadores ya lo manejan por pedido individual
(§18 funcional) o por operación individual (alta/edición de Chofer/Vehículo
desde la pantalla de Zonas y choferes).
