# Zonas y choferes

§12-§13 del documento funcional: resolver a qué Zona pertenece un pedido y
qué Chofer le corresponde.

## Decisión 2026-08-25/26: SimpliRoute es la fuente de verdad

Hasta el 2026-08-17 este módulo tenía sus propias tablas editables
(`Zona`/`Chofer`/`ZonaChofer`, configuradas a mano). Se revirtió: ahora
**Zonas, Choferes y Vehículos se traen de SimpliRoute**, no se configuran acá.
Regla general para toda la integración con SimpliRoute (no solo esto): si un
recurso tiene CRUD completo en la API pública (Choferes, Vehículos), esta app
lee y escribe contra SimpliRoute directamente; si solo tiene lectura (Zonas),
esta app solo lee/muestra.

Ver `DOCUMENTO TECNICO.md` historial 2026-08-25/26 y
`app/apps/api/src/modulos/simpliroute/README.md` para el detalle de qué está
validado contra la cuenta real.

## Cache local, no consulta en vivo

`ZonasChoferesService` guarda una copia sincronizada en tres tablas
(`ZonaSimpliRouteCache`, `ChoferSimpliRouteCache`, `VehiculoSimpliRouteCache`)
en vez de pegarle a la API de SimpliRoute en cada request. El refresco es
perezoso: si el cache tiene más de 15 minutos, se refresca antes de responder
la próxima lectura (`asegurarCacheFresca`). También hay un refresco explícito
(`sincronizar()`, expuesto como `POST /simpliroute-cache/sincronizar` — botón
"Sincronizar ahora" del frontend) que se dispara solo después de cada
alta/edición/baja de Chofer o Vehículo, para que el cache nunca quede
desactualizado respecto de lo que se acaba de escribir.

No se usa BullMQ/Redis para esto (nunca se llegó a usar en este proyecto,
ver `DOCUMENTO TECNICO.md` sección 1) — con 11 zonas / 12 vehículos / 17
choferes reales, un refresco perezoso alcanza. Si el catálogo creciera mucho
o hiciera falta refrescar en segundo plano sin esperar a una request, ahí sí
valdría la pena un job real.

## Resolución de Zona/Chofer de un pedido (`resolverZonaChofer`)

SimpliRoute no tiene un endpoint "dado este punto, qué zona lo contiene" — el
objeto Zone solo trae el polígono (`coordinates[]`). El point-in-polygon
(`domain/punto-en-poligono.ts`, ray casting clásico, con tests) es lógica
propia. Orden de resolución:

1. Si el destinatario ya tiene lat/lon (geocodificadas por SimpliRoute al
   sincronizar el Client), se busca qué zona habilitada lo contiene.
2. Si no hay coordenadas o ninguna zona matchea, fallback débil: coincidencia
   de nombre entre la Zona y la localidad del pedido (mismo criterio que
   antes del 2026-08-25).
3. Si tampoco resuelve nada, el pedido queda con zona/chofer `null` — "Zona
   sin identificar" / "Chofer sin asignar" (§13 funcional), no se inventa un
   valor.

El chofer sale de mirar el **primer vehículo asignado a la zona** en
SimpliRoute (`Zone.vehicles[0]`) y su **conductor predeterminado**
(`Vehicle.default_driver`). Si la zona no tiene ningún vehículo asignado, o
el vehículo no tiene chofer predeterminado, el pedido tiene zona resuelta
pero chofer sin asignar igual.

## Qué es editable y qué no

- **Zonas**: solo lectura. Alta/edición se hace en SimpliRoute.
- **Choferes** y **Vehículos**: alta/edición/baja completas desde
  `/choferes` y `/vehiculos` — escriben directo contra la API de SimpliRoute
  (nunca solo contra el cache local) y refrescan el cache después.

## Snapshot en Pedido, no relación

`Pedido.zonaId`/`Pedido.choferId` guardan el ID numérico de SimpliRoute (como
string, sin relación declarada — el cache se puede reemplazar libremente sin
romper una FK). `Pedido.zonaNombre`/`Pedido.choferNombre` son un snapshot del
nombre al momento de resolver — así un pedido viejo sigue mostrando su zona/
chofer aunque esa zona ya no exista más en SimpliRoute o el cache se haya
reemplazado. Mismo criterio que `Pedido.numeroAfiliado` ("snapshot al momento
de importar").
