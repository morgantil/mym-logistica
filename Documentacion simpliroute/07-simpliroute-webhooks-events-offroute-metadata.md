# SimpliRoute Public API — Etapa 7: Webhooks, Eventos, Off-Route Reasons y Optimization Metadata

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API principal para configuración de Webhooks:** `https://api.simpliroute.com`  
**Autenticación configuración:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre la documentación pública oficial relativa a:

- funcionamiento general de Webhooks;
- catálogo de eventos;
- configuración de URL y headers;
- creación/listado/actualización/eliminación;
- Plan Created;
- Plan Edited;
- Route Created;
- Route Edited;
- Route Started;
- Route Finished;
- On Its Way;
- Visit Checkout;
- Visit Checkout Detailed;
- política de respuesta y retry;
- Off-Route Reasons;
- códigos de exclusión;
- diferencia entre `filteredClientsNodes` y `unattendedClientsNodes`;
- Optimization Metadata;
- cálculo de distancia de rutas ya optimizadas.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | SimpliRoute lo declara explícitamente. |
| `OFFICIAL_EXAMPLE` | Aparece en un ejemplo oficial. |
| `INFERRED` | Deducción razonable, no garantía contractual. |
| `NOT_DOCUMENTED` | No está especificado públicamente. |
| `NEEDS_VERIFICATION` | Existe ambigüedad, inconsistencia o error en documentación. |

---

# 3. Concepto general de Webhook

**Estado:** `OFFICIAL`

SimpliRoute utiliza Webhooks para notificar eventos que suceden en una cuenta.

Cuando ocurre un evento:

```text
SimpliRoute
   |
   | HTTP POST
   v
URL configurada por el cliente
```

El POST contiene información del evento ocurrido.

Los Webhooks son especialmente útiles cuando:

- el evento no fue disparado directamente por una llamada API propia;
- otro sistema necesita enterarse del resultado;
- se requiere sincronización asíncrona de ejecución logística.

---

# 4. Eventos públicamente disponibles

Keys oficiales:

```text
plan_created
plan_edited
route_created
route_edited
route_started
route_finished
on_its_way
visit_checkout
visit_checkout_detailed
```

La documentación también describe Checkout Detailed como aplicable a:

```text
Completed delivery
Failed delivery
Partial delivery
```

---

# 5. Configuración de Webhooks

Cada Webhook está relacionado con:

```text
URL
Headers
```

Ejemplo conceptual:

```text
route_created
  route_created_webhook_url
  route_created_webhook_headers
```

---

# 6. Headers para administrar configuración

Para llamar a la API de configuración:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

---

# 7. Body de configuración

Campos publicados:

| Campo | Descripción |
|---|---|
| `webhook` | Nombre/key del webhook disponible. |
| `url` | URL del servidor receptor del cliente. |
| `headers` | Headers que SimpliRoute utilizará hacia el servidor final. |

Ejemplo:

```json
{
  "webhook": "visit_checkout_detailed",
  "url": "https://example.com/simpliroute/webhooks",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer <CUSTOM_WEBHOOK_SECRET>"
  }
}
```

El header dentro de `headers` pertenece a la comunicación:

```text
SimpliRoute -> servidor del integrador
```

NO es el API Token usado por el integrador para configurar SimpliRoute.

---

# 8. Seguridad del receptor

SimpliRoute permite configurar headers personalizados.

Un diseño recomendado puede usar:

```http
Authorization: Bearer <SECRET_PROPIO>
```

o cualquier header que el backend del integrador pueda verificar.

Esto es configuración del consumidor.

La documentación NO define un mecanismo universal oficial de firma HMAC para Webhooks.

Por tanto:

```text
Webhook signature/HMAC = NOT_DOCUMENTED
```

---

# 9. Create Webhook

## Endpoint

```http
POST /v1/addons/webhooks/
```

URL:

```text
https://api.simpliroute.com/v1/addons/webhooks/
```

Body:

```json
{
  "webhook": "visit_checkout_detailed",
  "url": "https://example.com/webhooks/simpliroute",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer SECRET"
  }
}
```

---

# 10. Create Webhook response

La respuesta oficial se representa como un array de configuraciones internas:

```json
[
  {
    "title": "visit_checkout_detailed_webhook_url webhook url",
    "key": "visit_checkout_detailed_webhook_url",
    "value": "https://example.com/webhooks/simpliroute",
    "description": "...",
    "add_on_id": 1119950
  },
  {
    "title": "visit_checkout_detailed_webhook_headers webhook headers",
    "key": "visit_checkout_detailed_webhook_headers",
    "value": "{\"Content-Type\":\"application/json\"}",
    "description": "...",
    "add_on_id": 1119950
  }
]
```

### Importante

`value` de headers puede venir como:

```text
JSON serializado dentro de string
```

No asumir que siempre será objeto JSON.

---

# 11. List Webhooks

## Endpoint

```http
GET /v1/addons/webhooks/
```

Ejemplo de response:

```json
[
  {
    "title": "plan_created_webhook_url webhook url",
    "key": "plan_created_webhook_url",
    "value": "https://example.com",
    "description": "...",
    "add_on_id": 29950
  },
  {
    "title": "plan_created_webhook_headers webhook headers",
    "key": "plan_created_webhook_headers",
    "value": "{\"Content-Type\":\"application/json\",\"Authorization\":\"Token ...\"}",
    "description": "...",
    "add_on_id": 29950
  }
]
```

---

# 12. Update Webhook

## Endpoint

```http
PUT /v1/addons/webhooks/
```

Body:

```json
{
  "webhook": "visit_checkout_detailed",
  "url": "https://example.com/new-webhook",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### Semántica

La documentación lo presenta como actualización de configuración.

Partial vs complete semantics:

```text
NOT_DOCUMENTED
```

Enviar URL + headers completos para evitar ambigüedad.

---

# 13. Delete Webhook

## Endpoint

```http
DELETE /v1/addons/webhooks/
```

Body:

```json
{
  "webhook": "visit_checkout_detailed"
}
```

Response:

```json
[
  {
    "message": "The webhook was deleted"
  }
]
```

---

# 14. Error tipográfico en URL DELETE

Un ejemplo oficial utiliza:

```text
https://api.simpliroute.com//v1/addons/webhooks/
```

con doble `/`.

Estado:

```text
OFFICIAL_EXAMPLE typo
```

Usar:

```text
https://api.simpliroute.com/v1/addons/webhooks/
```

---

# 15. Política de recepción y retries

Para los eventos detallados en la documentación:

```text
receiver must respond HTTP 200
```

La documentación repite:

```text
will retry 3 times and up to 120 secs
```

para:

- Plan Created;
- Plan Edited;
- Route Created;
- Route Edited;
- Route Started;
- Route Finished;
- On Its Way;
- Checkout;
- Checkout Detailed.

---

# 16. Interpretación del retry

Contrato explícito disponible:

```text
expected success: HTTP 200
retries: 3
window: up to 120 seconds
```

La documentación NO define:

- intervalo exacto entre intentos;
- exponential backoff;
- si “3 times” significa 3 retries adicionales o 3 intentos totales;
- jitter;
- timeout por request.

Por tanto:

```text
exact retry schedule = NOT_DOCUMENTED
```

---

# 17. Implicación: Webhooks deben ser idempotentes

`INFERRED / BEST_PRACTICE`

Como puede existir retry, el receptor SHOULD ser idempotente.

No existe un `event_id` universal documentado.

Deduplicación recomendada puede basarse en combinación de:

```text
webhook type
resource id
status/event
timestamp
```

cuando esos campos estén disponibles.

Esto NO es una regla contractual oficial, sino una recomendación de diseño.

---

# 18. HTTP success distinto de 200

La documentación dice específicamente:

```text
expects status code 200
```

No afirma que cualquier 2xx sea aceptado.

### Regla segura

Responder:

```http
HTTP/1.1 200 OK
```

No depender de:

```text
201
202
204
```

como equivalentes.

---

# 19. Webhook Plan Created

Key:

```text
plan_created
```

Payload:

```json
{
  "account_id": 295,
  "id": "9503f703-ba7c-41a0-b91f-3bcebeca7b17",
  "name": "Plan name",
  "start_date": "2020-03-19",
  "end_date": "2020-03-19",
  "reset_day": 1,
  "route_ids": [
    "9894ddcd-e844-4c77-90e8-9d9a2a226f05"
  ],
  "fleet_id": 647
}
```

---

# 20. Plan Created fields

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Plan ID. |
| `name` | String | Nombre. |
| `account_id` | Integer | Account ID. |
| `start_date` | `YYYY-MM-DD` | Inicio. |
| `end_date` | `YYYY-MM-DD` | Fin. |
| `reset_day` | Integer | Día de reset. |
| `route_ids` | UUID array | Routes del Plan. |
| `fleet_id` | Integer | Fleet ID. |

`fleet_id` nullability:

```text
NOT_DOCUMENTED en tabla
```

---

# 21. `reset_day`

Valores descritos:

```text
1 = Monday
2 = Tuesday
...
100 = no reset
```

Mapping completo 3..7 no se enumera explícitamente, aunque la elipsis implica días siguientes.

No inventar valores especiales adicionales.

---

# 22. Webhook Plan Edited

Key:

```text
plan_edited
```

Payload incluye:

```text
id
name
account
start_date
end_date
reset_day
fleet_id
routes[]
```

A diferencia de Plan Created:

```text
account_id -> account {id,name}
route_ids  -> routes[] full structures
```

Los payloads NO tienen el mismo shape.

---

# 23. Plan Edited — Route Object

Campos:

```text
id
planned_date
total_load
total_load_2
total_load_3
estimated_time_start
estimated_time_end
comment
driver
vehicle
visits
```

---

# 24. Inconsistencia naming Plan Edited table

La tabla oficial usa:

```text
total_load2
load2
load3
```

mientras el JSON usa:

```text
total_load_2
load_2
load_3
```

Estado:

```text
NEEDS_VERIFICATION / table typo
```

Preferir nombres efectivos del JSON.

---

# 25. Plan Edited Visit fields

Shape observado:

```json
{
  "id": 20661418,
  "title": "foo",
  "planned_date": "2019-12-24",
  "latitude": "-33.370405",
  "longitude": "-70.684798",
  "load": 0,
  "load_2": 0,
  "load_3": 0,
  "duration": "0:10:00",
  "estimated_time_departure": "09:30:00",
  "estimated_time_arrival": "09:20:00",
  "notes": "",
  "order": 1
}
```

---

# 26. Webhook Route Created

Key:

```text
route_created
```

Campos observados:

```text
id
comment
planned_date
plan
driver
route_start
route_end
visit_ids
info_visits
vehicle
timestamp
order
status
```

`status`:

```text
created
```

---

# 27. Route Created `timestamp`

La tabla indica:

```text
UTC timestamp
```

Ejemplo:

```text
2024-01-30 15:14:45.708968
```

No contiene `Z` ni offset.

Estado:

```text
NEEDS_VERIFICATION representation
```

La semántica declarada es UTC.

---

# 28. Route Created — Route Start

```json
{
  "lat": "-33.449977",
  "lon": "-70.654465",
  "address": "Lord Cochrane 298, Santiago, Chile",
  "start_time": null,
  "estimated_time_start": "09:42:00"
}
```

En creación:

```text
start_time expected null
```

porque el conductor aún no inició.

---

# 29. Route Created — Route End

```json
{
  "lat": "-33.449977",
  "lon": "-70.654465",
  "address": "...",
  "estimated_time_end": "10:08:00",
  "end_time": null
}
```

---

# 30. `info_visits`

Ejemplo:

```json
[
  {
    "id": 370679703,
    "reference": "",
    "tracking_id": "SR68561793642931",
    "order": 1,
    "estimated_time_arrival": "09:42:00",
    "notes": "notes",
    "extra_field_values": {
      "my_key": "my_value"
    }
  }
]
```

Es distinto de:

```text
visit_ids[]
```

que contiene sólo IDs.

---

# 31. Webhook Route Edited

Key:

```text
route_edited
```

Shape muy similar a Route Created.

`status` puede indicar:

```text
edited
deleted
```

según descripción oficial.

### Importante

Un Webhook llamado `route_edited` puede comunicar eliminación de Route mediante `status`.

No asumir:

```text
route_edited => resource still exists
```

---

# 32. Webhook Route Started

Key:

```text
route_started
```

Shape:

```text
vehicle
plan
timestamp
route_start
route_end
planned_date
visit_ids
info_visits
driver
id
```

Diferencia principal:

```text
route_start.start_time != null
```

Ejemplo:

```text
2020-05-27 16:35:00+00:00
```

---

# 33. Webhook Route Finished

Key:

```text
route_finished
```

Shape similar al Route Started.

Diferencia:

```text
route_end.end_time != null
```

Ejemplo:

```text
2020-05-27 17:35:00+00:00
```

---

# 34. Typo en descripción Route Finished

La documentación dice:

```text
at the moment the route is started
```

dentro de la sección Route Finish.

Estado:

```text
OFFICIAL_TEXT typo
```

La sección y payload claramente corresponden a finalización.

---

# 35. Webhook On Its Way

Key:

```text
on_its_way
```

Se emite cuando el evento “on its way” se activa para una Visit.

El payload es esencialmente una vista de Visit operativa.

---

# 36. On Its Way payload — campos principales

```text
id
load
load_2
load_3
window_start
window_end
window_start_2
window_end_2
reference
planned_date
order
checkout_comment
duration
calculated_service_time
title
contact_name
contact_email
contact_phone
notes
latitude
longitude
status
address
account
route
status_changed
priority_level
created
modified
estimated_time_arrival
current_eta
estimated_time_departure
tracking_id
signature
checkin_time
checkin_latitude
checkin_longitude
checkout_latitude
checkout_longitude
checkout_observation
checkout_time
geocode_alert
postal_code
programmed_date
visit_type
fleet
has_alert
priority
on_its_way
extra_field_values
```

---

# 37. On Its Way status

Tabla dice:

```text
pending, completed or failed
```

El Visit Object general tiene estados adicionales.

No asumir que la tabla del Webhook es enum global completo.

---

# 38. Duplicación `checkout_observation` en ejemplo

El ejemplo oficial On Its Way contiene dos veces:

```text
checkout_observation
```

con valores:

```text
null
"Successful"
```

Duplicate keys no son válidas semánticamente en un objeto JSON canónico.

Estado:

```text
OFFICIAL_EXAMPLE malformed
```

Una IA MUST NOT reproducir duplicate fields.

---

# 39. Webhook Checkout

Key:

```text
visit_checkout
```

Se emite al momento del checkout de una Visit.

Incluye:

- datos de Visit;
- checkout;
- items;
- pickup_items.

---

# 40. Checkout statuses

La tabla específica enumera:

```text
pending
completed
failed
partial
```

Esto amplía el enum mostrado en On Its Way.

---

# 41. Checkout payload — Items

Ejemplo:

```json
{
  "items": [
    {
      "id": 1,
      "title": "My item",
      "status": "completed",
      "load": 1.1,
      "load_2": 2.2,
      "load_3": 3.3,
      "reference": null,
      "visit": 18843965,
      "notes": "My notes",
      "quantity_planned": 5,
      "quantity_delivered": 5,
      "request_status": "created"
    }
  ]
}
```

---

# 42. Checkout payload — Pickup Items

```json
{
  "pickup_items": [
    {
      "id": 1,
      "visit": 18843965,
      "type": 3,
      "serial_number": null,
      "quantity_planned": 3.2,
      "quantity_collected": 3.2,
      "status": "completed",
      "sub_items": [
        {
          "id": 1,
          "subtype": 2,
          "quantity_collected": 3.4
        }
      ]
    }
  ]
}
```

---

# 43. Pickup Items — tipo/enum

Campos `type` y `subtype` aparecen como integers.

La documentación del Webhook no describe sus enums.

Estado:

```text
PARTIALLY_DOCUMENTED
```

No interpretar `3` o `2` semánticamente sin otra fuente oficial.

---

# 44. Webhook Checkout Detailed

Key:

```text
visit_checkout_detailed
```

Es la versión de mayor riqueza de datos.

Incluye, además de información de Visit:

- `pictures`;
- Route expandida;
- Plan expandido;
- Account expandida;
- `extra_field_values`;
- `observation`;
- `invoices`;
- `items`;
- `pickup_items`.

---

# 45. Checkout vs Checkout Detailed

## `visit_checkout`

Payload centrado en Visit y evidencias básicas.

## `visit_checkout_detailed`

Payload expandido con contexto:

```text
route
plan
account
pictures
invoices
```

### Regla IA

Si un sistema necesita:

- invoice details;
- route metadata;
- plan metadata;
- picture URLs;

debe preferir:

```text
visit_checkout_detailed
```

si está configurado/disponible.

---

# 46. Checkout Detailed — Route object

Incluye:

```text
comment
vehicle
plan
timestamp
route_start
route_end
planned_date
visit_ids
driver
id
```

---

# 47. Checkout Detailed — Plan object

Incluye:

```text
route_ids
fleet_id
name
end_date
reset_day
id
account_id
start_date
```

---

# 48. Checkout Detailed — Account object

```json
{
  "id": 28387,
  "name": "Account Name"
}
```

---

# 49. Checkout Detailed — Pictures

```json
{
  "pictures": [
    "https://.../visit-pictures/...jpg"
  ]
}
```

Estas URLs son evidence links.

Persistencia/expiración:

```text
NOT_DOCUMENTED
```

No asumir URLs permanentes.

---

# 50. Checkout Detailed — Invoices

El payload puede incluir:

```text
invoices[]
```

con:

```text
id
reference
type
items
label
payment_method
payment_method_details
status
pictures
```

Esto conecta con la API Accounting que se documentará en una etapa posterior.

---

# 51. Invoice Item dentro de Webhook

Campos observados:

```text
id
delivery_issue
product
reference
status
title
sku
unit_price
planned_units
delivered_units
type
```

No usar este Webhook como sustituto de la referencia Accounting para escribir invoices.

---

# 52. Webhook payload ordering

La documentación dice explícitamente para varios eventos:

```text
not necessarily in that order
```

JSON object property order no debe usarse para lógica.

---

# 53. Campos opcionales / nullability

Los ejemplos contienen numerosos:

```text
null
""
[]
{}
```

La documentación no publica matriz required/optional para todos los payloads de eventos.

### Regla IA

El parser MUST:

- tolerar missing keys;
- tolerar `null`;
- no depender de valores no nulos;
- ser forward-compatible con campos nuevos.

---

# 54. Forward compatibility

SimpliRoute puede evolucionar los payloads.

El receptor SHOULD ignorar fields desconocidos.

No utilizar validación JSON que rechace automáticamente cualquier campo adicional, salvo necesidad explícita.

Esto es best practice.

---

# 55. Webhook response body

La documentación exige:

```text
HTTP 200
```

pero no requiere body específico.

Por tanto response recomendado:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"received": true}
```

El body es elección del receptor.

---

# 56. Webhook timeout

`NOT_DOCUMENTED`.

Los “up to 120 secs” corresponden a la política global de retry descrita, no necesariamente a timeout individual.

No configurar timeout exacto basándose sólo en esa frase.

---

# 57. Orden de eventos

`NOT_DOCUMENTED`.

No existe garantía publicada de que:

```text
route_started
visit_checkout
route_finished
```

se reciban siempre exactamente en orden sin retrasos/retries.

El sistema receptor SHOULD usar timestamps/estado actual para reconciliar.

---

# 58. At-least-once delivery

SimpliRoute no usa formalmente ese término, pero al existir retry:

```text
duplicates are possible in principle
```

Estado:

```text
INFERRED
```

Diseñar consumidor idempotente.

---

# 59. Off-Route Reasons

**Estado:** `OFFICIAL`

Esta funcionalidad explica por qué una Visit quedó fuera de ruta durante optimización.

Sólo es compatible con:

```text
VRP-type problems
```

---

# 60. Ubicación en response

Las visitas no atendidas aparecen en:

```text
unattendedClientsNodes
```

y pueden incluir:

```json
{
  "cause": {
    "code": "EXC_SO-003",
    "details": "..."
  }
}
```

---

# 61. Formato de código Off-Route

```text
EXC_<Service Code><Specific Number>
```

Service Codes:

```text
PAR
SO
```

Además existe:

```text
UNK
```

en el código desconocido.

---

# 62. Service Code `PAR`

```text
partitioning service
```

Indica que la etapa de particionado identificó una causa probable.

---

# 63. Service Code `SO`

```text
routing service
```

Indica que el routing identificó la causa.

---

# 64. EXC_SO-001

Descripción oficial:

```text
el routing service filtró nodes por incompatibilidades internas.
```

---

# 65. EXC_SO-002

El optimizador genera diferentes soluciones.

Algunas:

- insertan más nodes;
- tienen más crossings.

Otras:

- insertan menos;
- priorizan estética/clusterización.

Si una Visit queda afuera por elegir determinado tipo de solución:

```text
EXC_SO-002
```

---

# 66. EXC_SO-003

Caso residual del routing:

```text
node remained off-route and did not match other SO conditions
```

Ejemplo descriptivo lo relaciona con:

```text
lack of capacity or time in nearby vehicles
```

---

# 67. EXC_PAR-001

Existe un conjunto de nodes con una feature específica y Vehicles compatibles, pero:

```text
insufficient capacity
```

---

# 68. EXC_PAR-002

Vehicles compatibles, pero:

```text
insufficient working time
```

---

# 69. EXC_PAR-003

```text
no compatible vehicles were provided for the feature
```

---

# 70. EXC_PAR-004

Análisis más complejo de Vehicles/nodes concluye:

```text
not enough capacity for all nodes
```

---

# 71. EXC_PAR-005

Análisis más complejo concluye:

```text
not enough working time
```

---

# 72. EXC_PAR-006

Vehicle assigner asignó insuficientes Vehicles a una partición y probablemente:

```text
not enough capacity
```

---

# 73. EXC_PAR-007

Vehicle assigner asignó insuficientes Vehicles y probablemente:

```text
not enough working time
```

---

# 74. EXC_PAR-008

Vehicle assigner no pudo asignar:

```text
vehicle compatible with node feature in partition
```

---

# 75. EXC_UNK-000

```text
cause could not be determined
```

El consumidor MUST soportar un estado desconocido.

---

# 76. Tabla completa de Off-Route codes

| Código | Categoría | Resumen |
|---|---|---|
| `EXC_SO-001` | Routing | Filtrado por incompatibilidad interna |
| `EXC_SO-002` | Routing | Nodo excluido por solución preferida / estética |
| `EXC_SO-003` | Routing | Otra causa de no inserción |
| `EXC_PAR-001` | Partition | Capacidad insuficiente en Vehicles compatibles |
| `EXC_PAR-002` | Partition | Tiempo de trabajo insuficiente |
| `EXC_PAR-003` | Partition | No hay Vehicles compatibles |
| `EXC_PAR-004` | Partition | Capacidad agregada insuficiente |
| `EXC_PAR-005` | Partition | Tiempo agregado insuficiente |
| `EXC_PAR-006` | Partition | Vehicle assigner asignó pocos Vehicles; capacidad |
| `EXC_PAR-007` | Partition | Vehicle assigner asignó pocos Vehicles; tiempo |
| `EXC_PAR-008` | Partition | Vehicle assigner no pudo asignar Vehicle compatible |
| `EXC_UNK-000` | Unknown | Causa no determinada |

---

# 77. Filtered vs Off-Route

Esta distinción es crítica.

## `filteredClientsNodes`

Nodes filtrados ANTES de optimizar por incompatibilidades como:

- load;
- required skills;
- optional skills;
- time window;
- zone.

Incluyen códigos:

```text
W01002
W02002
...
```

## `unattendedClientsNodes`

Nodes que llegaron al proceso de routing/partitioning pero quedaron fuera de una solución.

Incluyen:

```text
EXC_...
```

Una IA MUST NOT mezclar ambas familias de códigos.

---

# 78. Optimization Metadata

La API de Metadata entrega información que no viene directamente en el endpoint Optimization.

Funcionalidad publicada:

```text
Distance
```

---

# 79. Distance Endpoint

## Endpoint

```http
POST https://optimizator.simpliroute.com/v1/optimization/metadata/distance
```

### Nota

Host:

```text
optimizator.simpliroute.com
```

igual que el endpoint ETC documentado.

---

# 80. Authentication — Metadata

**Estado:** `OFFICIAL`

Requiere:

```http
Authorization: Token <VALID_TOKEN>
```

La documentación dice:

```text
An Authorization Header containing a valid Token is required.
```

### Scheme exacto

Aunque se refiere a Token, el snippet no especifica visualmente:

```text
Authorization: Token xxx
```

Por consistencia con API principal puede ser ese formato, pero el wording exacto debe conservarse.

Estado:

```text
Token auth confirmed; exact header rendering inferred from general API convention
```

---

# 81. Distance — objetivo

Entrega distancia estimada para rutas previamente optimizadas.

El texto dice:

```text
estimated kilometers
```

pero el response usa:

```json
{
  "distance": 899.5,
  "metric": "meters"
}
```

Estado:

```text
NEEDS_VERIFICATION wording
```

### Regla

Usar siempre:

```text
distance + metric
```

No asumir kilómetros.

---

# 82. Distance Request

Root:

```json
{
  "country": "CL",
  "vehicles": []
}
```

Campos root:

| Campo | Mandatory | Tipo |
|---|:---:|---|
| `country` | Sí | String ISO country code |
| `vehicles` | Sí | Lista/Object según tabla |

---

# 83. Distance Vehicle Object

| Campo | Mandatory | Tipo |
|---|:---:|---|
| `ident` | No | String |
| `tours` | Sí | Lista/Object |

---

# 84. Distance Tour Object

| Campo | Mandatory | Tipo |
|---|:---:|---|
| `nodes` | Sí | Lista/Object |

---

# 85. Distance Node Object

| Campo | Mandatory | Tipo |
|---|:---:|---|
| `lat` | Sí | Float |
| `lon` | Sí | Float |

---

# 86. Request compatible con Optimization Response

La documentación dice que respeta la estructura del Optimization Response.

Esto permite:

```text
Optimization result
   |
   | retain vehicles/tours/nodes lat/lon
   v
Distance metadata request
```

---

# 87. Distance Request example

```json
{
  "country": "CL",
  "vehicles": [
    {
      "ident": "123",
      "tours": [
        {
          "nodes": [
            {
              "lat": -41.319286,
              "lon": -72.995719
            },
            {
              "lat": -41.319081,
              "lon": -72.989037
            }
          ]
        }
      ]
    }
  ]
}
```

---

# 88. Distance success response

HTTP:

```text
200
```

Response:

```json
{
  "vehicles": [
    {
      "ident": "123",
      "tours": [
        {
          "distance": 899.5,
          "metric": "meters"
        },
        {
          "distance": 2200.6,
          "metric": "meters"
        }
      ]
    }
  ]
}
```

---

# 89. Distance response mapping

La posición de cada:

```text
vehicle
tour
```

corresponde conceptualmente al input.

La documentación dice que usa la misma estructura.

No se documenta un tour ID.

Si un Vehicle tiene múltiples tours, el consumidor debe conservar el orden para mapear.

Estado:

```text
INFERRED from structure
```

---

# 90. Distance error 400

Ejemplo oficial:

```json
{
  "statusCode": 400,
  "message": "Country value is required"
}
```

Esto confirma que:

```text
country
```

es requerido.

---

# 91. Distance 5XX

Ejemplo:

```json
{
  "errors": [
    {
      "code": "E5000",
      "message": "Internal server error",
      "metadata": {
        "code": "E5000"
      }
    }
  ]
}
```

Esto vuelve a demostrar que SimpliRoute no posee necesariamente un único shape universal de error.

---

# 92. Distance metrics

Valor publicado:

```text
meters
```

Enum completo de `metric`:

```text
NOT_DOCUMENTED
```

No asumir:

```text
kilometers
miles
```

aunque el texto introductorio mencione kilómetros.

---

# 93. Distance algorithm

No se publica:

- routing provider;
- traffic factor;
- road restrictions;
- timestamp/traffic time;
- precision;
- rounding;
- toll behavior.

Tratar distancia como estimación del servicio.

---

# 94. Endpoint Inventory

| Método | Endpoint | Función |
|---|---|---|
| POST | `/v1/addons/webhooks/` | Crear Webhook |
| GET | `/v1/addons/webhooks/` | Listar Webhooks |
| PUT | `/v1/addons/webhooks/` | Actualizar Webhook |
| DELETE | `/v1/addons/webhooks/` | Eliminar Webhook |
| POST inbound | URL configurada por cliente | Recibir Plan Created |
| POST inbound | URL configurada por cliente | Recibir Plan Edited |
| POST inbound | URL configurada por cliente | Recibir Route Created |
| POST inbound | URL configurada por cliente | Recibir Route Edited |
| POST inbound | URL configurada por cliente | Recibir Route Started |
| POST inbound | URL configurada por cliente | Recibir Route Finished |
| POST inbound | URL configurada por cliente | Recibir On Its Way |
| POST inbound | URL configurada por cliente | Recibir Visit Checkout |
| POST inbound | URL configurada por cliente | Recibir Checkout Detailed |
| POST | `https://optimizator.simpliroute.com/v1/optimization/metadata/distance` | Calcular distancia de tours optimizados |

---

# 95. Implementación recomendada del receptor

Pseudocódigo:

```text
POST /webhooks/simpliroute

1. validar secret/header configurado por nosotros
2. parsear JSON
3. identificar configuración/evento asociado
4. construir dedupe key
5. guardar evento raw
6. responder HTTP 200 rápidamente
7. procesar negocio de forma idempotente
```

La identificación del tipo exacto de evento no se basa en un campo `event_type` universal porque los payloads no publican uno consistentemente.

Normalmente la aplicación conoce el tipo por:

```text
URL configurada
or
webhook config mapping
```

---

# 96. URLs separadas por evento

Recomendación de diseño:

```text
/webhooks/simpliroute/plan-created
/webhooks/simpliroute/plan-edited
/webhooks/simpliroute/route-created
/webhooks/simpliroute/route-edited
/webhooks/simpliroute/route-started
/webhooks/simpliroute/route-finished
/webhooks/simpliroute/on-its-way
/webhooks/simpliroute/checkout
/webhooks/simpliroute/checkout-detailed
```

No es requisito oficial, pero facilita conocer el evento sin inferir payload.

---

# 97. No bloquear Webhook con procesamiento lento

Best practice:

```text
persist -> return 200 -> process
```

La documentación no establece asynchronous acknowledgment, pero dado que exige 200 y hay retries, minimizar latencia reduce duplicados.

---

# 98. Deduplicación sugerida

No hay universal event UUID.

Ejemplos de claves posibles:

```text
plan_created:
  plan.id

route_created:
  route.id + status(created)

route_started:
  route.id + route_start.start_time

route_finished:
  route.id + route_end.end_time

on_its_way:
  visit.id + on_its_way

checkout:
  visit.id + checkout_time + status
```

Esto es diseño del consumidor, no contrato oficial.

---

# 99. Datos personales

Webhooks pueden contener:

- nombres;
- emails;
- teléfonos;
- direcciones;
- coordenadas;
- fotos;
- firmas;
- facturas.

Por seguridad:

- no loguear indiscriminadamente;
- cifrar storage sensible;
- aplicar retención adecuada;
- ocultar secretos.

---

# 100. Webhook secret rotation

Como headers son configurables, puede rotarse un secreto actualizando Webhook.

La API no publica mecanismo de overlap/múltiples secrets simultáneos.

Una rotación sin downtime debe diseñarse en receptor.

---

# 101. Inconsistencias detectadas

| Tema | Problema | Estado |
|---|---|---|
| Delete URL | doble slash en ejemplo | `OFFICIAL_EXAMPLE typo` |
| Retry wording | “retry 3 time” no aclara total vs adicional | `NEEDS_VERIFICATION` |
| Retry interval | no publicado | `NOT_DOCUMENTED` |
| Plan Created vs Edited | shapes diferentes | `OFFICIAL` |
| load fields tables | `load2/load3` vs JSON `_2/_3` | `NEEDS_VERIFICATION` |
| Route timestamp | declarado UTC, string sin offset | `NEEDS_VERIFICATION` |
| Route Finish text | dice started por error | `OFFICIAL_TEXT typo` |
| On Its Way | duplicate `checkout_observation` | `OFFICIAL_EXAMPLE malformed` |
| On Its Way priority | ejemplo 0, otros docs priority 1..5 | `NEEDS_VERIFICATION` |
| Checkout detailed priority | ejemplo 0 | `NEEDS_VERIFICATION` |
| Metadata description | dice kilometers, response metric meters | `NEEDS_VERIFICATION` |
| Metadata vehicles/tours/nodes type | tabla dice Object pero ejemplos arrays | `NEEDS_VERIFICATION` |
| Webhook event id | no universal | `NOT_DOCUMENTED` |
| HMAC signature | no publicada | `NOT_DOCUMENTED` |

---

# 102. Reglas MUST para IA

Una IA MUST:

1. usar las keys de Webhook exactamente publicadas;
2. configurar mediante `/v1/addons/webhooks/`;
3. usar Token auth para administrar configuración;
4. distinguir headers de configuración de headers outbound;
5. responder `HTTP 200` al recibir;
6. soportar retries/duplicados;
7. no depender del orden de campos JSON;
8. tolerar fields desconocidos;
9. diferenciar `route_created` de `route_edited`;
10. considerar que `route_edited` puede comunicar eliminación;
11. diferenciar Checkout de Checkout Detailed;
12. diferenciar `filteredClientsNodes` de `unattendedClientsNodes`;
13. interpretar `EXC_*` sólo en Off-Route;
14. usar `distance + metric`, nunca asumir unidad;
15. enviar `country` en Metadata Distance.

---

# 103. Reglas MUST NOT para IA

MUST NOT:

1. asumir HMAC oficial;
2. asumir un universal event ID;
3. responder sólo `204` esperando equivalencia documentada;
4. asumir entrega exactly-once;
5. asumir orden estricto entre eventos;
6. rechazar eventos por campos adicionales;
7. usar property order;
8. asumir Plan Created y Plan Edited tienen mismo schema;
9. asumir On Its Way tiene schema idéntico a Checkout;
10. asumir picture URLs son permanentes;
11. confundir Warning Codes `W*` con Off-Route `EXC_*`;
12. interpretar `EXC_UNK-000` como error del API;
13. asumir `distance` en km;
14. inventar `metric` enum;
15. inventar query params en Metadata.

---

# 104. Aspectos NOT_DOCUMENTED

```text
webhook timeout por request
retry exact interval
retry backoff
retry jitter
whether 3 retries means 3 total or 3 additional
delivery ordering guarantee
exactly-once guarantee
event UUID
event sequence number
HMAC/signature mechanism
source IP ranges
webhook IP allowlist
TLS requirements of receiver
max webhook body size
automatic disabling after repeated failures
webhook history/replay endpoint
manual replay
webhook test endpoint
webhook create success code
webhook update success code
webhook list pagination
metadata rate limits
metadata maximum vehicles
metadata maximum tours
metadata maximum nodes
metadata metric enum
metadata distance algorithm
```

---

# 105. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones revisadas:

```text
Webhooks
How to work with SimpliRoute's webhooks
Which events can be notified
Configuring your Webhooks settings
Create Webhook
List Webhooks
Update Webhooks
Delete Webhooks
Webhook Plan creation
Webhook Plan edition
Webhook Route creation
Webhook Route edition
Webhook Route started
Webhook Route Finish
Webhook On it's way
Webhook Checkout
Webhook Checkout detailed
Off-Route Reasons
Example
List of Codes
Optimization: Metadata
Distance
```

Hechos clave:

```text
Webhook config CRUD
9 webhook keys
POST delivery
HTTP 200 expected
3 retries / up to 120 seconds wording
all current EXC_* codes
Metadata Distance endpoint
Metadata Distance success 200
country mandatory
distance metric explicitly returned
```

Fecha:

```text
2026-08-10
```

---

# 106. Estado final

**ETAPA 7 COMPLETADA**

Cobertura:

```text
Webhook configuration
Webhook event catalog
Plan events
Route events
Execution events
On Its Way
Checkout
Checkout Detailed
Retry semantics
Off-Route Reasons
EXC codes
Optimization Metadata
Distance
```

Siguiente etapa recomendada:

```text
08-accounting-invoices-products.md
```

Deberá cubrir:

- Accounting AddOn;
- Invoice;
- InvoiceItem;
- DeliveryIssue;
- Products;
- ProductCategory;
- CRUD publicado;
- status enums;
- invoice types;
- payment data;
- relation Visit ↔ Invoice;
- Products and categories;
- payloads;
- responses;
- errores;
- inconsistencias.
