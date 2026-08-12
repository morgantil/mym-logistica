# SimpliRoute Public API — Etapa 14: Master Index for AI

**Estado:** COMPLETADO  
**Fecha:** 2026-08-10  
**Objetivo:** servir como índice central de navegación para agentes de IA y desarrolladores que consuman la documentación SimpliRoute consolidada en las Etapas 1–13.

---

# 1. Propósito

Este archivo NO reemplaza la documentación detallada.

Su función es ayudar a una IA a responder rápidamente:

```text
"¿Qué archivo tengo que consultar?"
"¿Qué endpoint corresponde a esta intención?"
"¿Qué esquema de autenticación usa esta familia?"
"¿Qué add-on o feature flag necesito?"
"¿Qué tipo de ID maneja cada recurso?"
"¿Dónde están los enums importantes?"
"¿Qué cosas están documentadas y cuáles no?"
```

Regla principal:

```text
MASTER INDEX = navegación
ETAPAS 1–13 = contrato detallado
```

Una IA MUST abrir/consultar la etapa específica antes de implementar una operación compleja.

---

# 2. Archivos de la documentación

```text
01-simpliroute-fundamentos-auth-seguridad.md
02-simpliroute-visits-items-checkout.md
03-simpliroute-plans-routes-route-properties.md
04-simpliroute-vehicles-users-skills-zones-fleets.md
05-simpliroute-clients-custom-properties-forcefield.md
06-simpliroute-optimization-complete-reference.md
07-simpliroute-webhooks-events-offroute-metadata.md
08-simpliroute-accounting-invoices-products.md
09-simpliroute-tms-providers-documents-vehicles.md
10-simpliroute-gps-integration.md
11-simpliroute-datamart-complete-reference.md
12-simpliroute-couriers-providers.md
13-simpliroute-final-public-api-audit.md
14-simpliroute-master-index-for-ai.md
```

---

# 3. Regla de uso para IA

Antes de generar código:

```text
1. identificar intención
2. localizar etapa
3. confirmar base URL
4. confirmar auth
5. confirmar método
6. confirmar payload root
7. confirmar required fields
8. confirmar tipos/enums
9. confirmar response
10. revisar warnings/NEEDS_VERIFICATION
```

MUST NOT implementar por intuición REST.

---

# 4. Mapa intención → etapa

| Intención | Etapa |
|---|---:|
| Autenticarse / entender Token | 01 |
| Crear una visita | 02 |
| Consultar visita | 02 |
| Actualizar visita | 02 |
| Eliminar visita | 02 |
| Crear items de visita | 02 |
| Checkout de visita | 02 |
| Adjuntar imágenes a visita | 02 |
| Extra Fields | 02 |
| Observations | 02 |
| Tags | 02 |
| Sellers básicos | 02 |
| Crear Plan | 03 |
| Crear Route | 03 |
| Consultar Routes por fecha | 03 |
| Route Properties | 03 |
| Crear Vehicle | 04 |
| Editar Vehicle | 04 |
| Drivers / Users | 04 |
| Skills | 04 |
| Zones | 04 |
| Fleets | 04 |
| Client master | 05 |
| Custom client properties | 05 |
| ForceField / Territory Planner | 05 |
| Optimización VRP | 06 |
| Pickup & Delivery | 06 |
| Backhaul | 06 |
| Multiple Depots | 06 |
| Rest Time | 06 |
| Incremental Routing | 06 |
| Long Routes | 06 |
| Radial Routing | 06 |
| Calcular ETA | 06 |
| Incompatibility codes | 06 |
| Configurar Webhooks | 07 |
| Procesar webhooks | 07 |
| Off-route reasons | 07 |
| Calcular distancia de tours | 07 |
| Invoices | 08 |
| Invoice Items | 08 |
| Delivery Issues | 08 |
| Products | 08 |
| Product Categories | 08 |
| TMS Transportation Provider | 09 |
| TMS Documents | 09 |
| Bloquear/desbloquear Vehicle | 09 |
| GPS Integration | 10 |
| Consultas analíticas Datamart | 11 |
| Couriers / Providers | 12 |
| Asignación async de Courier a Visits | 12 |
| Revisar cambios recientes | 13 |
| Saber si falta un endpoint | 13 |

---

# 5. Familias de API

## API operacional principal

Base:

```text
https://api.simpliroute.com
```

Auth:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Usada en:

```text
Visits
Plans
Routes
Vehicles
Users
Clients
Webhooks config
Accounting
Couriers
```

---

# 6. Optimization API

Hosts publicados:

```text
http://optimizer.simpliroute.com/vrp/optimize/sync
https://optimizer.simpliroute.com/pd/optimize/sync/
https://optimizator.simpliroute.com/etc/sync
https://optimizator.simpliroute.com/v1/optimization/metadata/distance
```

Notas:

```text
optimizer vs optimizator = inconsistencia oficial
VRP http vs https = NEEDS_VERIFICATION
auth del optimizer principal = NOT_DOCUMENTED
metadata distance sí requiere Token
```

Consultar:

```text
06
07
```

---

# 7. TMS API

Base declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

Auth:

```http
Authorization: Token <TOKEN>
```

Requiere:

```text
TMS contratado
```

Consultar:

```text
09
```

---

# 8. Datamart API

Base:

```text
https://api-gateway.simpliroute.com/datamart
```

Auth:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

Token:

```text
se obtiene vía Customer Support
```

Consultar:

```text
11
```

---

# 9. GPS

Método:

```text
POST
```

Endpoint:

```text
NOT_PUBLICLY_DOCUMENTED
```

Setup:

```text
Professional Services
```

Consultar:

```text
10
```

---

# 10. Add-ons / features requeridas

| Feature | Requisito |
|---|---|
| Extra Fields | Puede requerir configuración de cuenta |
| Sellers | Puede requerir activación |
| Zones | Puede requerir activación |
| Fleets | Puede requerir activación |
| ForceField | `territory_planner` |
| Accounting | Accounting AddOn |
| TMS | Servicio TMS contratado |
| Couriers | courier add-on + admin |
| GPS | Professional Services setup |
| Datamart | Bearer token / Datamart role |

---

# 11. Visits — endpoints clave

```http
POST   /v1/routes/visits/
GET    /v1/routes/visits/{visit_id}/
GET    /v1/routes/visits/?planned_date={YYYY-MM-DD}
PATCH  /v1/routes/visits/{visit_id}/
PUT    /v1/routes/visits/{visit_id}/
DELETE /v1/routes/visits/{visit_id}/
```

Auxiliares:

```http
POST /v1/routes/visits/{visit_id}/items
POST /v1/bulk/delete/visits/
GET  /v1/plans/visits/{visit_id}/detail/
```

Consultar:

```text
02
```

---

# 12. Checkout — endpoints clave

```http
POST /v1/mobile/visit/{visit_id}/checkout/
POST /v1/events/register/
POST /v1/routes/visits/multiple/extra-field-values
POST /v1/routes/visits/multiple/pictures/
POST /v1/mobile/visit/multiple/checkout/notify
```

Consultar:

```text
02
```

---

# 13. Plan / Route — endpoints clave

```http
POST  /v1/plans/create-plan/
POST  /v1/routes/routes/
GET   /v1/plans/{planned_date}/vehicles/
GET   /v1/plans/routes/{PLAN_ID}/visits/
PATCH /v1/routes/routes/{route_id}/
```

Consultar:

```text
03
```

---

# 14. Route Properties

```http
GET    /v1/routes/routes-properties/{ROUTE_ID}
POST   /v1/routes/routes-properties/
PUT    /v1/routes/routes-properties/{ROUTE_ID}
PATCH  /v1/routes/routes-properties/{ROUTE_ID}
DELETE /v1/routes/routes-properties/{ROUTE_ID}
POST   /v1/routes/routes-properties/bulk-search/
```

Consultar:

```text
03
```

---

# 15. Vehicles

```http
POST   /v1/routes/vehicles/
GET    /v1/routes/vehicles/
GET    /v1/routes/vehicles/{vehicle_id}/
PATCH  /v1/routes/vehicles/{vehicle_id}/
PUT    /v1/routes/vehicles/{vehicle_id}/
DELETE /v1/routes/vehicles/{vehicle_id}/
```

Consultar:

```text
04
```

---

# 16. Drivers / Users

```http
GET    /v1/accounts/drivers/
POST   /v1/accounts/drivers/
GET    /v1/accounts/drivers/{user_id}/
PUT    /v1/accounts/drivers/{user_id}/
DELETE /v1/accounts/drivers/{user_id}/
```

Consultar:

```text
04
```

---

# 17. Skills / Zones / Fleets

```http
GET /v1/routes/skills/
GET /v1/zones/
GET /v1/fleets/
```

Consultar:

```text
04
```

---

# 18. Clients

```http
POST   /v1/accounts/clients/
GET    /v1/accounts/clients/?key={CLIENT_KEY}
PUT    /v1/accounts/clients/
DELETE /v1/accounts/clients/{CLIENT_ID}/
DELETE /v1/accounts/clients/
POST   /v1/planner/client-properties/
```

Consultar:

```text
05
```

---

# 19. Optimization

VRP:

```text
POST http://optimizer.simpliroute.com/vrp/optimize/sync
```

PD:

```text
POST https://optimizer.simpliroute.com/pd/optimize/sync/
```

ETA:

```text
POST https://optimizator.simpliroute.com/etc/sync
```

Consultar:

```text
06
```

---

# 20. Webhooks

Config:

```http
POST   /v1/addons/webhooks/
GET    /v1/addons/webhooks/
PUT    /v1/addons/webhooks/
DELETE /v1/addons/webhooks/
```

Keys:

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

Consultar:

```text
07
```

---

# 21. Accounting

Invoice:

```http
POST   /v1/accounting/invoices/
GET    /v1/accounting/invoices/{invoice_id}/
PATCH  /v1/accounting/invoices/{invoice_id}/
DELETE /v1/accounting/invoices/{invoice_id}/
```

Filtros:

```text
?route_id=
?planned_date=
```

Items:

```http
POST /v1/accounting/invoices/{invoice_id}/items/
```

Consultar:

```text
08
```

---

# 22. TMS

Providers:

```text
/transportation-providers/
```

Documents:

```text
/documents/
```

Vehicle control:

```text
/vehicles/{vehicle_id}/block
/vehicles/{vehicle_id}/unblock
```

Consultar:

```text
09
```

---

# 23. Couriers

```http
POST   /v1/accounts/couriers/
GET    /v1/accounts/couriers/
GET    /v1/accounts/couriers/{id}/
PUT    /v1/accounts/couriers/{id}/
DELETE /v1/accounts/couriers/{id}/
POST   /v1/routes/visits/couriers/
```

Consultar:

```text
12
```

---

# 24. IDs — tabla maestra

| Recurso | Tipo observado/documentado |
|---|---|
| Visit.id | Inconsistente: tabla UUID, ejemplos Integer |
| Route.id | UUID |
| Plan.id | UUID |
| Vehicle.id | Integer |
| Driver/User.id | Integer |
| Skill.id | Integer |
| Tag.id | Integer |
| Observation.id | UUID |
| Seller.id | UUID |
| Fleet.id | Integer |
| Zone.id | Integer |
| Client.id | Integer |
| Client.key | String |
| Invoice.id | No formalizado completamente |
| Product.id | UUID |
| ProductCategory.id | Integer observado |
| TransportationProvider.id | UUID |
| Courier.id | Integer observado |
| Document.id | UUID observado |

Regla:

```text
IDs son opacos
no realizar aritmética
no convertir entre dominios
```

---

# 25. IDs que NO deben confundirse

```text
Client.id != Client.key
Courier.id != TMS TransportationProvider.id
Visit.id != Visit.reference
Route.id != Plan.id
Vehicle.id != vehicle.reference_id
GPS vehicleId != Vehicle.id necesariamente
Seller.id != Driver.id
```

---

# 26. Enums importantes — Visit

Visit status global observado:

```text
pending
partial
completed
failed
canceled
```

Checkout input documentado:

```text
pending
completed
failed
```

Priority:

```text
1 = First of the day
2 = Last of the day
3 = High
4 = Medium
5 = Low
```

Consultar:

```text
02
```

---

# 27. Enums — Invoice

Type:

```text
bill
credit_note
delivery_note
debit_note
```

Status:

```text
pending
payed
overdue
canceled
partial
completed
```

Payment method:

```text
cash
check
credit_card
debit_card
transfer
dated_check
credit
multiple
```

Consultar:

```text
08
```

---

# 28. Enums — Client Custom Property

```text
str
int
float
bool
```

Consultar:

```text
05
```

---

# 29. Enums — ForceField

Period:

```text
7
14
28
```

Week bucket:

```text
any_week
week_1
week_2
week_3
week_4
```

Days:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Consultar:

```text
05
```

---

# 30. Enums — Courier

```text
provider_type:
  courier
  fleet_provider
```

Consultar:

```text
12
```

---

# 31. Optimization special values

```text
radial_routing:
  -1
   0
   1
```

```text
max_number_of_routes:
  0 or null = infinity
```

FMV:

```text
1.0 low
1.5 medium
2.0 high
3.0 intense
```

Consultar:

```text
06
```

---

# 32. Datamart operators

```text
eq
gt
lt
```

No documentados:

```text
gte
lte
neq
in
like
order
```

Consultar:

```text
11
```

---

# 33. HTTP status especiales

## TMS

```text
201 create
200 success/update
204 delete
400 wrong request
401 unauthorized
403 forbidden
404 not found
422 validation
500 server error
```

## Couriers Visits assignment

```text
201 Visits created
502 assignment service communication error
504 assignment service timeout
```

## Accounting currency

```text
400 invalid currency/account-country resolution
```

Consultar etapa específica.

---

# 34. PUT/PATCH semántica — resumen

## Visits

```text
PATCH omitted -> unchanged
PUT omission behavior -> NOT_DOCUMENTED
```

## Vehicle

```text
PATCH -> partial
PUT -> complete update
```

Extra properties:

```text
PATCH null -> delete property
PUT {} -> delete all properties
PUT null -> keep properties unchanged
```

## Route Properties

```text
PATCH -> partial
PUT -> complete
```

## Courier

```text
PUT example looks partial
formal semantics incomplete
```

## Client

```text
PUT bulk
partial vs complete = NEEDS_VERIFICATION
```

---

# 35. Multipart endpoints

Visit pictures:

```http
POST /v1/routes/visits/multiple/pictures/
```

TMS Documents:

```text
POST /documents/
POST /documents/{document_id}
```

No enviar JSON base64 en lugar de archivos donde multipart está documentado.

---

# 36. Base64

Checkout signature:

```text
request.signature -> base64
```

Visit response signature:

```text
URL/string
```

No confundir direcciones del contrato.

---

# 37. Async/background behaviors

## Courier assignment

```text
POST /v1/routes/visits/couriers/
assignment happens in background
```

## Webhooks

```text
asynchronous outbound event delivery
```

## GPS replay

```text
locally buffered observations replayed after connectivity returns
```

Una IA debe considerar estados intermedios y retries.

---

# 38. Retry / idempotency hotspots

Especial cuidado en:

```text
POST /v1/routes/visits/
POST /v1/plans/create-plan/
POST /v1/routes/routes/
POST /v1/mobile/visit/{id}/checkout/
POST /v1/mobile/visit/multiple/checkout/notify
POST /v1/routes/visits/couriers/
```

No existe `Idempotency-Key` público global.

Consultar etapa específica.

---

# 39. Webhook delivery

Regla actual preferida:

```text
HTTP 200
30 seconds retry delay where explicitly documented
max 3 attempts total
```

Receptor:

```text
must be idempotent
```

No existe event ID universal.

Consultar:

```text
07
13
```

---

# 40. Off-route vs filtered

```text
filteredClientsNodes:
  incompatibilidad antes de optimizar
  W* codes

unattendedClientsNodes:
  no se pudo insertar en solución
  EXC_* codes
```

No mezclar.

Consultar:

```text
06
07
```

---

# 41. Off-route codes

```text
EXC_SO-001
EXC_SO-002
EXC_SO-003

EXC_PAR-001
EXC_PAR-002
EXC_PAR-003
EXC_PAR-004
EXC_PAR-005
EXC_PAR-006
EXC_PAR-007
EXC_PAR-008

EXC_UNK-000
```

Consultar:

```text
07
```

---

# 42. Incompatibility warning codes

```text
W00001
W01001
W01002
W02001
W02002
W02101
W02102
W03001
W03002
W04001
W04002
```

Consultar:

```text
06
```

---

# 43. Datamart datasets — master list

```text
/v1/visits
/v1/plans
/v1/routes
/v1/extrafielddefinitions
/v1/extrafieldoptions
/v1/vehicles
/v1/vehicles_skills
/v1/fleets
/v1/vehicles_fleets
/v1/fleets_users
/v1/observations
/v1/skills
/v1/tags
/v1/zones
/v1/vehicles_zones
/v1/visits_skills_optional
/v1/visits_skills_required
/v1/visits_tags
/v1/visits_extrafieldvalues
/v1/visititems
/v1/accounts
/v1/users
/v1/invoices
/v1/invoiceitems
/v1/sellers
/v1/sellers_users
/v1/sellers_visits
/v1/visitpicture
```

Consultar:

```text
11
```

---

# 44. Changelog-only items

No deben implementarse sin documentación adicional:

```text
reports/visits
visit_eta reason identifier
ETA upper time limit parameter
hide contact phone config API
is_monitor_coordinator write semantics
```

Consultar:

```text
13
```

---

# 45. Campos peligrosos por inconsistencias

```text
Visit.id
Item.id
Item.reference
capacity2 vs capacity_2
capacity3 vs capacity_3
Product.category vs Product.categories
GPS vehicleId
Optimizer root object vs array
country required vs omitted example
PD load2/load3 vs load_2/load_3
```

Antes de implementar cualquiera:

```text
consultar etapa específica
```

---

# 46. Campos con spelling oficial no intuitivo

Usar exactamente:

```text
payed
vehicle_journey_extention
longRoutes
isReorder
autoZone
```

No corregir spelling/casing automáticamente.

---

# 47. Recursos de sólo lectura pública

Actualmente documentados públicamente sólo como GET:

```text
Skills
Zones
Fleets
Datamart datasets
```

No inventar CRUD.

---

# 48. Recursos con features habilitables

Una IA debe revisar:

```text
Sellers
Zones
Fleets
Extra Fields
Accounting
ForceField
TMS
Couriers
GPS
Datamart
```

antes de interpretar un 403/404 como endpoint inexistente.

---

# 49. Regla de null

No existe semántica universal.

Ejemplos:

```text
Vehicle PATCH extra_properties.key = null -> delete
Vehicle PUT extra_properties = null -> preserve
Accounting PATCH currency = null -> auto-select account currency
Visit PATCH field null -> field-specific behavior not universal
```

MUST consultar endpoint/campo específico.

---

# 50. Fechas y horas — guía rápida

```text
planned_date:
  YYYY-MM-DD

Visit duration:
  HH:mm:ss

Optimizer duration:
  Integer minutes

Optimizer windows:
  HH:mm

Long Routes:
  HH:mm can exceed 24

Checkout time:
  ISO 8601 preferred

GPS timestamp:
  YYYY-MM-DD HH:II:SS-00

TMS document expiration:
  YYYY-MM-DD HH:mm:ss.ffffff
```

No mezclar formatos.

---

# 51. Coordenadas

La documentación no es consistente entre:

```text
JSON number
numeric string
```

Regla:

```text
read tolerantly
write according to endpoint example/table
```

---

# 52. Cargas

Relación conceptual:

```text
Vehicle.capacity   <-> Visit.load
Vehicle.capacity_2 <-> Visit.load_2
Vehicle.capacity_3 <-> Visit.load_3
```

Optimizer:

```text
capacity/load
capacity_2/load_2
capacity_3/load_3
```

Unidades:

```text
business-configured
NOT globally kg
```

---

# 53. Security checklist

```text
[ ] no API token en frontend
[ ] no Datamart token en frontend
[ ] no passwords en logs
[ ] no webhook secret en logs
[ ] redactar teléfonos/emails si no son necesarios
[ ] proteger invoice/picture/signature data
[ ] usar TLS cuando esté soportado/documentado
```

---

# 54. Cómo responder si la documentación no alcanza

Una IA MUST decir:

```text
"NOT_DOCUMENTED"
```

o:

```text
"NEEDS_VERIFICATION"
```

en vez de inventar.

Ejemplos:

```text
"¿Cuál es el límite máximo de Visits por bulk create?"
-> NOT_DOCUMENTED

"¿Existe week_5?"
-> NOT_DOCUMENTED / no publicado

"¿Cuál es el endpoint GPS?"
-> NOT_PUBLICLY_DOCUMENTED

"¿Cómo se usa reports/visits?"
-> CHANGELOG_ONLY
```

---

# 55. Regla de prioridad entre fuentes

Cuando exista contradicción:

```text
1. tabla formal actual
2. descripción textual explícita
3. ejemplo moderno
4. ejemplo histórico
5. convención REST
```

Si sigue siendo ambiguo:

```text
NEEDS_VERIFICATION
```

---

# 56. Plantilla de decisión para IA

```text
USER_INTENT:
  "Quiero crear una entrega"

MATCH:
  Visit creation

READ:
  02-simpliroute-visits-items-checkout.md

BASE:
  https://api.simpliroute.com

AUTH:
  Authorization: Token ...

METHOD:
  POST

PATH:
  /v1/routes/visits/

REQUIRED:
  title
  address
  planned_date

OUTPUT:
  Visit object / documented response shape caveat
```

---

# 57. Ejemplo: optimizar rutas

```text
USER_INTENT:
  "Quiero optimizar 50 entregas con 5 vehículos"

READ:
  06-simpliroute-optimization-complete-reference.md

FAMILY:
  Optimizer API

CHECK:
  root object
  vehicles[]
  nodes[]
  country
  capacities
  windows
  skills
  options
  filteredClientsNodes
  unattendedClientsNodes
```

---

# 58. Ejemplo: obtener datos históricos

```text
USER_INTENT:
  "Necesito extraer todas las visitas para BI"

READ:
  11-simpliroute-datamart-complete-reference.md

AUTH:
  Bearer

DATASET:
  /v1/visits

PAGINATION:
  limit <= 500
  offset

OPTIONAL:
  Prefer: count=estimated
```

---

# 59. Ejemplo: facturación

```text
USER_INTENT:
  "Quiero agregar una factura a una visita"

READ:
  08-simpliroute-accounting-invoices-products.md

REQUIRE:
  Accounting AddOn

POST:
  /v1/accounting/invoices/

MANDATORY:
  reference
  currency
  visit
  type
```

---

# 60. Ejemplo: Courier

```text
USER_INTENT:
  "Quiero crear visitas y asignarlas a un Courier"

READ:
  12-simpliroute-couriers-providers.md

REQUIRE:
  admin
  courier add-on

POST:
  /v1/routes/visits/couriers/

IMPORTANT:
  assignment is asynchronous
  response does not contain final assignment
```

---

# 61. Ejemplo: GPS

```text
USER_INTENT:
  "Quiero enviar posiciones GPS"

READ:
  10-simpliroute-gps-integration.md

METHOD:
  POST

ENDPOINT:
  obtain from Professional Services

DO NOT:
  invent endpoint
  assume Token auth
```

---

# 62. AI fast lookup table

| Palabra clave | Archivo |
|---|---|
| visit | 02 |
| checkout | 02 |
| item | 02 |
| plan | 03 |
| route | 03 |
| route properties | 03 |
| vehicle | 04 |
| driver | 04 |
| skill | 04 |
| zone | 04 |
| fleet | 04 |
| client | 05 |
| custom property | 05 |
| forcefield | 05 |
| optimize | 06 |
| vrp | 06 |
| pickup delivery | 06 |
| radial | 06 |
| incremental | 06 |
| webhook | 07 |
| off-route | 07 |
| distance | 07 |
| invoice | 08 |
| product | 08 |
| accounting | 08 |
| transportation provider | 09 |
| document | 09 |
| block vehicle | 09 |
| gps | 10 |
| datamart | 11 |
| courier | 12 |
| provider_type | 12 |
| changelog | 13 |
| reports/visits | 13 |

---

# 63. Regla para generación de código

Antes de devolver código final, una IA SHOULD incluir internamente este check:

```text
Does every request field exist in official docs?
Does every enum exist?
Is auth correct?
Is base URL correct?
Is method correct?
Is endpoint explicit?
Are ambiguous fields flagged?
```

Si alguna respuesta es no:

```text
do not fabricate
```

---

# 64. Regla sobre SDKs

La documentación consolidada describe HTTP APIs.

No se documentó en estas etapas un SDK oficial completo con contrato equivalente.

Una IA MAY generar wrappers propios, pero debe etiquetarlos:

```text
custom client / not official SDK
```

---

# 65. Regla sobre errores

No existe un único error envelope universal.

El código debe:

```text
1. revisar status HTTP
2. intentar parsear JSON
3. preservar body raw si falla
4. manejar schemas variables
```

---

# 66. Regla sobre retries

Retry seguro:

```text
GET -> generalmente seguro
```

Retry con cautela:

```text
POST create
POST checkout
POST notify
POST courier visits
POST plan
POST route
```

Siempre revisar idempotencia específica.

---

# 67. Regla sobre DELETE

No asumir comportamiento común.

Casos especiales:

```text
DELETE clients collection -> body array de IDs
DELETE Route Properties -> no elimina Route
DELETE Visit -> no recalcula ETA downstream
```

---

# 68. Regla sobre reporting

Actualmente:

```text
Datamart = consulta analítica documentada
reports/visits = changelog-only
```

Si una IA necesita reportes hoy:

```text
prefer Datamart unless reports/visits has formal contract available
```

---

# 69. Regla sobre tiempo real

Para tiempo real:

```text
Webhooks
Operational API
GPS
```

Para BI/histórico:

```text
Datamart
```

No tratar Datamart como event stream.

---

# 70. Regla sobre relaciones

No asumir joins ocultos.

Ejemplos:

```text
Visit.tags[] -> Datamart visits_tags
Vehicle.skills[] -> Datamart vehicles_skills
Fleet.users[] -> Datamart fleets_users
Seller.visit -> Datamart sellers_visits
```

---

# 71. Estado final

**ETAPA 14 COMPLETADA**

Este archivo funciona como índice maestro para agentes de IA y desarrolladores.

Cuando una IA tenga una tarea:

```text
1. encontrar intención aquí
2. abrir etapa específica
3. usar sólo contrato documentado
4. marcar ambigüedades
5. no salir a inventar endpoints
```

La colección Etapas 1–14 queda preparada como corpus técnico de referencia para desarrollo contra la API pública de SimpliRoute.
