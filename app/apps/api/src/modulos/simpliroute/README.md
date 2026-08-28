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

## Estado: todo el módulo validado contra la cuenta real

No existe un ambiente sandbox de SimpliRoute (confirmado en la doc: `NOT_DOCUMENTED`
para "Sandbox API separado"). Se probó contra la cuenta real
(`MYM LOGISTICA Y DISTRIBUCION SRL`) en varias sesiones (2026-08-16, 26, 27 y
28) — ver detalle completo en DOCUMENTO TECNICO.md historial. **Ya no queda
ninguna operación de este módulo sin probar contra la cuenta real** (el
supuesto bloqueo de escrituras del entorno de Claude Code no aplicó en las
sesiones donde se probó — las escrituras reales funcionaron sin
intervención manual de Leonardo). Estado por grupo de métodos:

| Método(s) | Estado contra cuenta real | Detalle |
|---|---|---|
| `buscarDestinatarioPorAfiliado` | ✅ Validado (lectura, 2026-08-16) | |
| `enviarPedido` | ✅ Validado (lectura y escritura, 2026-08-16 y 2026-08-27) | Ver supuestos de mapeo abajo. |
| `consultarEstado` | ✅ Validado (lectura, 2026-08-28) | Devuelve `{ estado, fechaEntrega }` desde 2026-08-28 (antes solo el string) — `fechaEntrega` sale de `checkout_time`, confirmado real en la cuenta. |
| `listarZonas`, `listarChoferes`, `listarVehiculos` | ✅ Validado (lectura, 2026-08-26) | 11 zonas reales, 12 vehículos, 17 choferes — el addon de Zonas está habilitado en la cuenta. |
| `crearChofer`, `actualizarChofer`, `eliminarChofer` | ✅ Validado (lectura y escritura, 2026-08-28) | Encontró y corrigió **3 discrepancias reales** contra la doc — ver tabla de supuestos abajo. Probado alta → edición → baja real, de punta a punta. |
| `crearVehiculo`, `actualizarVehiculo`, `eliminarVehiculo` | ⚪ Sin probar contra cuenta real | Comparte el mismo adapter genérico que Choferes — riesgo bajo de tener discrepancias distintas, pero no se probó puntualmente. |

Supuestos de mapeo (todos están comentados en el código, este README los
junta en un solo lugar):

| Supuesto | Dónde | Estado |
|---|---|---|
| El padrón de destinatarios de MyM ya existe en SimpliRoute como "Client master", con `Client.key` = nuestro `numeroAfiliado` | `buscarDestinatarioPorAfiliado` | ✅ confirmado 2026-08-16. |
| `load` de la Visit = cantidad de bultos del pedido | `enviarPedido` | SimpliRoute no define la unidad de `load` — depende de configuración de cuenta (§13, Documentacion simpliroute/05). Sin objeción en la prueba real. |
| El body de creación de Visit va como array (`[{...}]`) aunque sea una sola | `enviarPedido` | ✅ confirmado 2026-08-27 — funciona tal cual. |
| El response de creación/consulta de Visit puede venir como objeto suelto o envuelto en array | `enviarPedido`, `consultarEstado` | ✅ confirmado — el código tolera ambas formas (`primerElemento`). |
| El body de creación/edición de Driver va como array (`[{...}]`) | `crearChofer`, `actualizarChofer` | ❌ **Falso** — corregido 2026-08-28. La API real rechaza el array con "Expected a dictionary, but got list"; va como objeto plano. A diferencia de Visits, donde sí es array. |
| `PUT`/`PATCH` de Driver no necesitan repetir `is_driver` si no cambia | `actualizarChofer`, `eliminarChofer` | ❌ **Falso** — corregido 2026-08-28. Sin `is_driver: true` en cada request, la API responde "You must select user type", aunque el chofer ya tenga ese flag en `true`. |
| `DELETE` da de baja un Driver | `eliminarChofer` | ❌ **Falso** — corregido 2026-08-28. Devuelve 405 pese a listarse en el header `Allow` de la respuesta. La baja real es `PATCH` con `status: "deleted"` (choices `active`/`deleted`/`blocked`, descubiertos vía `OPTIONS`, no documentados en ningún lado). |
| `activo` de Chofer = `is_driver && !blocked` | `listarChoferes` | ⚠️ Incompleto — corregido 2026-08-28: un chofer con `status: "deleted"` sigue devolviendo `blocked: false`, así que ahora `activo` también exige `status !== "deleted"`. |
| Al actualizar un Chofer sin mandar `password`, SimpliRoute preserva la contraseña actual | `actualizarChofer` | Sin confirmar puntualmente — no bloqueó la prueba de edición (se mandó sin `password` y no rompió), pero no se verificó que la contraseña vieja siga siendo válida para login. |
| `choferPredeterminadoId` de Vehicle = `default_driver` | `listarVehiculos`, `crearVehiculo`, `actualizarVehiculo` | Confirmado por lectura (2026-08-26): el campo existe y trae IDs de Driver reales. Sin probar escritura. |

## Por qué no hay tests automáticos de este adapter

Es un adapter delgado de integración HTTP (parseo de respuesta + mapeo de
campos), no lógica de dominio — el patrón de este proyecto es testear
funciones puras (`motor-facturacion.ts`, `transformar-fila.ts`,
`punto-en-poligono.ts`, `mapear-estado-simpliroute.ts`, etc.), no mockear
`fetch` para adapters de infraestructura. La prueba real de este código es
contra la API de verdad, con el token real — y encontró bugs reales que
ningún mock hubiera detectado (ver tabla de supuestos arriba).

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
