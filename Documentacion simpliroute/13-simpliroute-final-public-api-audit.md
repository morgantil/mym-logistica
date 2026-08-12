# SimpliRoute Public API — Etapa 13: Auditoría Final de Cobertura Pública y Changelog

**Estado:** COMPLETADO  
**Fecha de auditoría:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Objetivo:** cerrar el relevamiento de la API pública de SimpliRoute verificando el índice/documentación vigente y el changelog contra las Etapas 1–12.

---

# 1. Resultado ejecutivo

La auditoría final confirma que las Etapas 1–12 cubren la gran mayoría de la superficie pública de API utilizable de SimpliRoute documentada actualmente.

Se detectó **un endpoint adicional explícitamente nombrado en el changelog** que no había sido documentado en las etapas anteriores:

```text
reports/visits
```

Sin embargo, el changelog sólo afirma que existe un reporte en ese endpoint. La documentación pública revisada NO expone todavía:

```text
HTTP method
base URL exacta
authentication
query params
request body
response schema
pagination
status codes
```

Por tanto queda clasificado como:

```text
PUBLICLY_MENTIONED_BUT_NOT_CONSUMABLE_FROM_DOCS
```

También se detectaron tres cambios recientes anunciados por changelog:

```text
visit_eta push notification filtering + reason identifier
ETA upper time limit parameter
is_monitor_coordinator system role
```

Ninguno de ellos posee en la referencia pública revisada un contrato suficientemente completo para construir una integración nueva sin investigación adicional.

---

# 2. Convenciones de auditoría

| Etiqueta | Significado |
|---|---|
| `COVERED` | Ya documentado exhaustivamente en una etapa anterior. |
| `PARTIALLY_COVERED` | El dominio está cubierto, pero apareció una mejora reciente no formalizada completamente. |
| `CHANGELOG_ONLY` | Sólo existe mención en changelog; falta contrato API consumible. |
| `NOT_PUBLICLY_DOCUMENTED` | No existe documentación pública suficiente. |
| `NEEDS_VERIFICATION` | Hay contradicción o ambigüedad oficial. |

---

# 3. Matriz final por dominio

| Dominio oficial | Etapa | Estado |
|---|---:|---|
| Introduction / Fundamentals | 1 | `COVERED` |
| Authentication | 1 | `COVERED` |
| Errors | 1 | `COVERED` |
| Visits | 2 | `COVERED` |
| Visit Object | 2 | `COVERED` |
| Property Object | 2 | `COVERED` |
| Extra Fields | 2 | `COVERED` |
| Observations | 2 | `COVERED` |
| Tags | 2 | `COVERED` |
| Items | 2 | `COVERED` |
| Sellers related to Visits | 2 | `COVERED` |
| Checkout | 2 | `COVERED` |
| Checkout Process | 2 | `COVERED` |
| Time Window validation | 2 | `COVERED` |
| Plans | 3 | `COVERED` |
| Routes | 3 | `COVERED` |
| Route Properties | 3 | `COVERED` |
| Vehicles | 4 | `COVERED` |
| Vehicle extra_properties | 4 | `COVERED` |
| Users / Drivers | 4 | `PARTIALLY_COVERED` because changelog adds `is_monitor_coordinator` |
| Skills | 4 | `COVERED` |
| Zones | 4 | `COVERED` |
| Fleets | 4 | `COVERED` |
| Clients | 5 | `COVERED` |
| Client Custom Properties | 5 | `COVERED` |
| ForceField / Territory Planner | 5 | `COVERED` |
| Optimization | 6 | `PARTIALLY_COVERED` because ETA upper limit is changelog-only |
| Optimization Options | 6 | `COVERED` for documented options |
| Multiple Depots | 6 | `COVERED` |
| Backhaul | 6 | `COVERED` |
| Stop Routing | 6 | `COVERED` |
| Pick-up & Delivery | 6 | `COVERED` |
| Rest Time | 6 | `COVERED` |
| Incremental Routing | 6 | `COVERED` |
| Long Routes | 6 | `COVERED` |
| Radial Routing | 6 | `COVERED` |
| Estimated Time Calculation | 6 | `PARTIALLY_COVERED` due new upper limit mention |
| Validate Incompatibilities | 6 | `COVERED` |
| Webhooks | 7 | `PARTIALLY_COVERED` due `visit_eta` change |
| Off-Route Reasons | 7 | `COVERED` |
| Optimization Metadata / Distance | 7 | `COVERED` |
| Accounting | 8 | `COVERED` |
| Invoices | 8 | `COVERED` |
| InvoiceItems | 8 | `COVERED` |
| DeliveryIssues | 8 | `COVERED` |
| Products | 8 | `COVERED` with official inconsistencies documented |
| ProductCategory | 8 | `COVERED` with partial endpoint ambiguity documented |
| TMS Transportation Provider | 9 | `COVERED` |
| TMS Documents | 9 | `COVERED` |
| TMS Vehicle Block / Unblock | 9 | `COVERED` |
| GPS Integration | 10 | `COVERED` to public limit |
| Datamart | 11 | `COVERED` |
| Couriers / Providers | 12 | `COVERED` |
| Courier Visits Assignment | 12 | `COVERED` to public limit |
| Changelog | 13 | `COVERED` |
| Reports / Visits | 13 | `CHANGELOG_ONLY` |

---

# 4. Matriz final de endpoints operacionales

## Authentication

```http
GET /v1/accounts/me/
```

Etapa:

```text
01
```

---

## Visits

```http
POST   /v1/routes/visits/
GET    /v1/routes/visits/{visit_id}/
GET    /v1/routes/visits/?planned_date={YYYY-MM-DD}
PATCH  /v1/routes/visits/{visit_id}/
PUT    /v1/routes/visits/{visit_id}/
DELETE /v1/routes/visits/{visit_id}/
POST   /v1/routes/visits/{visit_id}/items
POST   /v1/bulk/delete/visits/
GET    /v1/plans/visits/{visit_id}/detail/
POST   /v1/mobile/visit/{visit_id}/checkout/
GET    /v1/accounts/extra-fields/
GET    /v1/routes/observations/
GET    /v1/routes/tags/
GET    /v1/sellers/
POST   /v1/events/register/
POST   /v1/routes/visits/multiple/extra-field-values
POST   /v1/routes/visits/multiple/pictures/
POST   /v1/mobile/visit/multiple/checkout/notify
```

Etapa:

```text
02
```

---

## Plans / Routes

```http
POST  /v1/plans/create-plan/
POST  /v1/routes/routes/
GET   /v1/plans/{planned_date}/vehicles/
GET   /v1/plans/routes/{PLAN_ID}/visits/
PATCH /v1/routes/routes/{route_id}/
```

Etapa:

```text
03
```

### Nota

El placeholder `{PLAN_ID}` de Visits by Route sigue marcado como inconsistente porque la semántica documentada apunta a Route UUID.

---

## Route Properties

```http
GET    /v1/routes/routes-properties/{ROUTE_ID}
POST   /v1/routes/routes-properties/
PUT    /v1/routes/routes-properties/{ROUTE_ID}
PATCH  /v1/routes/routes-properties/{ROUTE_ID}
DELETE /v1/routes/routes-properties/{ROUTE_ID}
POST   /v1/routes/routes-properties/bulk-search/
```

Etapa:

```text
03
```

---

## Vehicles

```http
POST   /v1/routes/vehicles/
GET    /v1/routes/vehicles/
GET    /v1/routes/vehicles/{vehicle_id}/
PATCH  /v1/routes/vehicles/{vehicle_id}/
PUT    /v1/routes/vehicles/{vehicle_id}/
DELETE /v1/routes/vehicles/{vehicle_id}/
```

Etapa:

```text
04
```

---

## Users / Drivers

```http
GET    /v1/accounts/drivers/
POST   /v1/accounts/drivers/
GET    /v1/accounts/drivers/{user_id}/
PUT    /v1/accounts/drivers/{user_id}/
DELETE /v1/accounts/drivers/{user_id}/
```

Etapa:

```text
04
```

---

## Skills / Zones / Fleets

```http
GET /v1/routes/skills/
GET /v1/zones/
GET /v1/fleets/
```

Etapa:

```text
04
```

---

## Clients

```http
POST   /v1/accounts/clients/
GET    /v1/accounts/clients/?key={CLIENT_KEY}
DELETE /v1/accounts/clients/{CLIENT_ID}/
DELETE /v1/accounts/clients/
PUT    /v1/accounts/clients/
POST   /v1/planner/client-properties/
```

Etapa:

```text
05
```

---

# 5. Optimization endpoint matrix

```http
POST http://optimizer.simpliroute.com/vrp/optimize/sync
POST https://optimizer.simpliroute.com/pd/optimize/sync/
POST https://optimizator.simpliroute.com/etc/sync
```

Metadata:

```http
POST https://optimizator.simpliroute.com/v1/optimization/metadata/distance
```

Etapas:

```text
06
07
```

### Host/scheme caveats

Se mantienen las inconsistencias oficiales:

```text
optimizer vs optimizator
HTTP vs HTTPS
```

No deben normalizarse sin verificación runtime.

---

# 6. Webhook configuration matrix

```http
POST   /v1/addons/webhooks/
GET    /v1/addons/webhooks/
PUT    /v1/addons/webhooks/
DELETE /v1/addons/webhooks/
```

Eventos cubiertos:

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

Etapa:

```text
07
```

---

# 7. Accounting endpoint matrix

```http
POST   /v1/accounting/invoices/
GET    /v1/accounting/invoices/{invoice_id}/
PATCH  /v1/accounting/invoices/{invoice_id}/
DELETE /v1/accounting/invoices/{invoice_id}/
GET    /v1/accounting/invoices/?route_id={route_id}
GET    /v1/accounting/invoices/?planned_date={YYYY-MM-DD}
POST   /v1/accounting/invoices/{invoice_id}/items/
DELETE /v1/accounting/invoices/{invoice_id}/items/{item_id}
POST   /v1/accounting/invoices/delivery-issues/
PATCH  /v1/accounting/invoices/delivery-issues/{delivery_issue_id}/
DELETE /v1/accounting/invoices/delivery-issues/{delivery_issue_id}/
POST   /v1/accounting/products/
PATCH  /v1/accounting/products/{product_id}/
DELETE /v1/accounting/products/{product_id}/
```

Product/ProductCategory GET/CRUD statements con paths no completamente explicitados permanecen marcados como parciales en Etapa 8.

---

# 8. TMS matrix

Base declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

Endpoints:

```http
POST   /transportation-providers/
GET    /transportation-providers/
GET    /transportation-providers/{id}
PUT    /transportation-providers/{id}
DELETE /transportation-providers/{id}

POST /vehicles/transportation-providers

POST /documents/
POST /documents/{document_id}

POST /vehicles/{vehicle_id}/block
POST /vehicles/{vehicle_id}/unblock
```

Etapa:

```text
09
```

---

# 9. GPS

Contrato público:

```text
POST <GPS_ENDPOINT_PROVIDED_BY_PROFESSIONAL_SERVICES>
```

No existe URL pública exacta.

Etapa:

```text
10
```

---

# 10. Datamart matrix

Base:

```text
https://api-gateway.simpliroute.com/datamart
```

Auth:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

Datasets:

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

Etapa:

```text
11
```

---

# 11. Couriers matrix

```http
POST   /v1/accounts/couriers/
GET    /v1/accounts/couriers/
GET    /v1/accounts/couriers/{id}/
PUT    /v1/accounts/couriers/{id}/
DELETE /v1/accounts/couriers/{id}/
POST   /v1/routes/visits/couriers/
```

Etapa:

```text
12
```

---

# 12. Hallazgo nuevo: `reports/visits`

El changelog de 2026 indica:

```text
The report is available at the reports/visits endpoint.
```

Este endpoint no aparece con contrato operativo completo en la referencia pública revisada.

No se conoce públicamente con suficiente certeza:

```text
GET vs POST
/v1/reports/visits
/reports/visits
/api/reports/visits
base host
Authorization
query parameters
date filters
pagination
response schema
```

Clasificación:

```text
CHANGELOG_ONLY
```

### Regla IA

MUST NOT construir código contra:

```text
reports/visits
```

hasta que exista documentación pública formal o SimpliRoute confirme:

- URL exacta;
- método;
- auth;
- schema.

---

# 13. Changelog 2026-02-05 — Push notifications `visit_eta`

El changelog publica una mejora:

```text
Enhanced push notification filtering for route visits
```

Al utilizar el prefijo:

```text
visit_eta
```

las notificaciones incluyen un identificador específico de razón para actualizaciones automáticas de ETA.

Objetivo:

```text
allow downstream systems to filter unnecessary push notifications
```

## Lo que SÍ sabemos

```text
prefix = visit_eta
reason identifier exists
purpose = identify/filter automatic ETA updates
```

## Lo que NO está públicamente definido

```text
endpoint
registration mechanism
payload schema
field name of reason
allowed reason values
whether this is webhook or push/mobile notification API
authentication
subscription setup
```

Clasificación:

```text
CHANGELOG_ONLY
```

No integrarlo como Webhook API documentada.

---

# 14. Changelog 2026-02-05 — ETA Upper Time Limit

El changelog anuncia:

```text
Enhanced ETA Calculations with Upper Time Limit
```

y dice que se agregó soporte para:

```text
an upper time limit parameter in ETA calculations
```

Aplicación mencionada:

```text
events
views
notifications
```

## Lo que NO está publicado

No se especifica:

```text
parameter name
type
unit
default
minimum
maximum
which endpoint accepts it
whether ETC supports it
whether /v1/events/register/ accepts it
whether it is account configuration
```

Por tanto:

```text
ETA_UPPER_LIMIT_PARAMETER = CHANGELOG_ONLY / NOT_IMPLEMENTABLE_FROM_PUBLIC_DOCS
```

### Importante

MUST NOT inventar campos como:

```text
upper_time_limit
eta_upper_limit
max_eta
max_time
```

---

# 15. Changelog 2026-01-29 — `reports/visits`

El changelog indica que una mejora facilita:

```text
cross-reference and track individual visits
```

y publica:

```text
reports/visits endpoint
```

No existe contrato completo.

Este es el único endpoint adicional explícitamente nombrado por el changelog no cubierto en Etapas 1–12.

---

# 16. Changelog 2026-01-29 — Hide customer contact phone number

Nueva configuración:

```text
hide customer contact phone number
```

Cuando está habilitada:

```text
phone numbers are replaced with empty strings
```

en aplicaciones móviles.

Esto es:

```text
account configuration behavior
```

No se publica:

```text
API endpoint for setting it
field name
configuration API
```

Clasificación:

```text
CHANGELOG_ONLY / NON-CONSUMABLE_CONFIG
```

### Impacto para parsers

Una integración MUST tolerar:

```json
{
  "contact_phone": ""
}
```

incluso cuando exista un teléfono real en sistema.

No interpretar siempre empty string como “nunca hubo teléfono”.

---

# 17. Changelog 2026-01-29 — Centralized notification routing

El changelog anuncia que requests de notificaciones ahora se enrutan directamente por gateway para procesamiento centralizado.

Menciona:

```text
event registration
mobile visit checkouts
plan editing operations
```

Esto es un cambio de infraestructura.

No agrega un nuevo contrato de endpoint consumible públicamente.

Clasificación:

```text
INTERNAL_ROUTING_IMPROVEMENT
```

Los endpoints existentes documentados siguen siendo la referencia pública.

---

# 18. Changelog 2026-01-27 — `is_monitor_coordinator`

Nuevo role:

```text
is_monitor_coordinator
```

Se agregó al sistema con permisos en varios módulos.

## Impacto sobre Users

Etapa 4 documentó fields observados:

```text
is_owner
is_admin
is_driver
is_router_jr
is_monitor
is_coordinator
is_router
is_staff
```

Debe agregarse al catálogo de roles conocidos:

```text
is_monitor_coordinator
```

## Writability

El changelog no especifica:

```text
si puede enviarse en POST /drivers/
si puede modificarse por PUT
combinaciones válidas
permisos exactos
```

Clasificación:

```text
OFFICIAL_CHANGELOG_FIELD
writability = NOT_DOCUMENTED
```

---

# 19. Webhook de eliminación de Route

El índice oficial menciona:

```text
Route deletion
```

entre eventos notificables.

No existe una key pública separada:

```text
route_deleted
```

La documentación de Route Edited indica que `status` puede representar:

```text
edited
deleted
```

Por tanto la eliminación de Route está cubierta mediante:

```text
route_edited
status = deleted
```

Etapa:

```text
07
```

No falta un endpoint/event key independiente confirmado.

---

# 20. Revisión de supuestos CRUD genéricos

La documentación usa frases generales como:

```text
typical CRUD operations
```

en Routes.

La auditoría NO convierte esas frases en endpoints inventados.

Por ejemplo siguen NO confirmados:

```text
GET /v1/routes/routes/{id}/
PUT /v1/routes/routes/{id}/
DELETE /v1/routes/routes/{id}/
```

aunque serían convencionales.

Regla:

```text
only explicit endpoint definitions enter the master inventory
```

---

# 21. Revisión de Product DELETE inconsistency

La documentación Accounting posee ejemplos inconsistentes de Product delete.

Etapa 8 ya lo marcó.

No se modifica la conclusión:

```text
Product CRUD = partially explicit
exact delete/get routes must follow current official examples/runtime validation
```

No agregar endpoints supuestos en esta auditoría.

---

# 22. Revisión de Visit Detail paths

Existen referencias históricas diferentes:

```text
/v1/plans/visits/{visit_id}/detail/
/plans/v1/visits/{visit_id}/detail/
```

Las etapas anteriores usaron la variante moderna observada:

```text
/v1/plans/visits/{visit_id}/detail/
```

Estado global:

```text
NEEDS_VERIFICATION if legacy accounts/docs show alternate host/path
```

No se crea un segundo endpoint independiente.

---

# 23. Revisión del Checkout Notification example

Existe un error en documentación histórica donde el cURL mostrado para Trigger Notifications apunta al endpoint de Extra Field Values aunque el texto declara correctamente:

```text
/v1/mobile/visit/multiple/checkout/notify
```

Etapa 2 ya usó el endpoint textual correcto.

Clasificación:

```text
OFFICIAL_EXAMPLE typo
```

---

# 24. Revisión de Webhook retries

La referencia inglesa/española actual contiene wording más preciso en algunas secciones:

```text
retry after 30 seconds
up to a maximum of 3 attempts in total
```

Esto refina la Etapa 7, donde se había conservado una descripción más general de:

```text
3 retries / up to 120 seconds
```

## Contrato actualizado preferido

Cuando la sección concreta lo declara:

```text
expected response: HTTP 200
retry delay: 30 seconds
maximum attempts total: 3
```

### Regla

Para una IA:

```text
Webhook delivery should be idempotent.
Respond HTTP 200 quickly.
Expect duplicate delivery.
```

La documentación sigue sin definir un universal event ID.

---

# 25. Corrección recomendada a Etapa 7

Añadir mentalmente/como overlay:

```text
WEBHOOK_RETRY_POLICY:
  expected_status = 200
  delay = 30 seconds
  max_attempts_total = 3
```

Cuando la página específica del evento use esa formulación.

Si otras secciones aún muestran wording distinto:

```text
prefer the most explicit/current wording
```

---

# 26. Cobertura de Changelog vs contratos de API

Regla maestra:

```text
A changelog announcement is NOT automatically an API contract.
```

Para que una feature sea considerada implementable desde estos `.md`, debe tener al menos:

```text
endpoint or event mechanism
method
auth
input/output shape sufficient for development
```

Si no:

```text
CHANGELOG_ONLY
```

---

# 27. Features del changelog que NO deben programarse por inferencia

No inventar implementaciones para:

```text
visit_eta reason identifier
ETA upper time limit
reports/visits request contract
hide customer phone configuration endpoint
is_monitor_coordinator write API
```

---

# 28. Cobertura final de módulos públicos

La colección de Etapas 1–13 cubre:

```text
Fundamentals
Authentication
Errors
Visits
Items
Checkout
Plans
Routes
Route Properties
Vehicles
Drivers/Users
Skills
Zones
Fleets
Clients
Custom Properties
ForceField
Optimization
Optimization Metadata
Webhooks
Off-Route
Accounting
TMS
GPS
Datamart
Couriers/Providers
Changelog/API audit
```

---

# 29. Archivos que conforman la referencia

```text
00-simpliroute-auditoria-inventario.md
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
```

---

# 30. Orden recomendado de lectura para IA

Para desarrollar una integración operacional común:

```text
01 Fundamentals/Auth
   ↓
02 Visits/Checkout
   ↓
03 Plans/Routes
   ↓
04 Vehicles/Drivers
   ↓
07 Webhooks
```

Si usa master de clientes:

```text
05 Clients
```

Si optimiza externamente:

```text
06 Optimization
```

Si requiere BI/extracción:

```text
11 Datamart
```

Si usa transportistas:

```text
09 TMS
or
12 Couriers
```

dependiendo del producto contratado.

---

# 31. Política de resolución de contradicciones para IA

Cuando dos archivos o ejemplos oficiales discrepan, usar este orden:

```text
1. endpoint/table formal más reciente
2. descripción textual explícita
3. ejemplo moderno
4. ejemplo histórico
5. inferencia REST
```

Nunca:

```text
inventar una corrección silenciosa
```

Registrar:

```text
NEEDS_VERIFICATION
```

si la contradicción cambia el request real.

---

# 32. Política sobre endpoints no documentados

Una IA que use esta referencia MUST:

```text
NOT search for or generate undocumented endpoints by naming convention.
```

Ejemplo prohibido:

```text
"Existe /v1/routes/routes/{id}/ porque el recurso es REST."
```

Si no aparece explícitamente:

```text
NOT_DOCUMENTED
```

---

# 33. Política de actualización futura

La documentación tiene changelog activo.

Para mantener este corpus vigente se recomienda:

```text
1. revisar changelog
2. identificar FEATURE/IMPROVEMENT relacionados con API
3. buscar sección formal del nuevo endpoint/field
4. sólo promover CHANGELOG_ONLY a OFFICIAL cuando exista contrato
5. actualizar la etapa específica
6. actualizar esta matriz final
```

---

# 34. Checklist de cobertura antes de desarrollar

Una IA debe verificar:

```text
[ ] El endpoint está listado en una etapa.
[ ] La familia API correcta está identificada.
[ ] Base URL correcta.
[ ] Auth scheme correcto.
[ ] Add-on/service contratado si aplica.
[ ] Método exacto confirmado.
[ ] Payload root confirmado.
[ ] Campos required confirmados.
[ ] Enums confirmados.
[ ] Response shape confirmado o marcado ambiguo.
[ ] Códigos HTTP endpoint-specific revisados.
[ ] Retry/idempotency revisados.
[ ] No se depende de CHANGELOG_ONLY.
```

---

# 35. Estado de completitud final

## Contratos públicos explícitos

```text
CUBIERTOS
```

## Features públicas anunciadas sin contrato suficiente

```text
reports/visits
visit_eta reason identifier
ETA upper time limit
hide-contact-phone configuration API
is_monitor_coordinator write semantics
```

## Integraciones cuya URL/setup no se publica

```text
GPS ingestion
```

## Integraciones que requieren soporte/configuración

```text
Datamart token
GPS setup
Couriers add-on
TMS contracted service
Accounting AddOn
ForceField / territory_planner
Zones/Fleets where disabled
Sellers where disabled
Extra Fields depending account config
```

---

# 36. Conclusión

Al 2026-08-10, las Etapas 1–13 forman una referencia de desarrollo completa para **todo lo públicamente documentado con suficiente contrato técnico** en SimpliRoute, salvo elementos explícitamente marcados como:

```text
CHANGELOG_ONLY
NOT_PUBLICLY_DOCUMENTED
NEEDS_VERIFICATION
```

El hallazgo principal de la auditoría es:

```text
reports/visits
```

pero actualmente no puede documentarse de forma segura como endpoint consumible porque el changelog no publica método, URL completa, auth, parámetros ni response.

Los otros cambios recientes relevantes:

```text
visit_eta
ETA upper time limit
is_monitor_coordinator
```

deben tratarse como extensiones oficiales anunciadas, pero NO como contratos implementables hasta que SimpliRoute publique el schema/API correspondiente.

---

# 37. Fuente oficial y fecha

Referencia utilizada:

```text
https://documentation.simpliroute.com/
https://documentation.simpliroute.com/es/
```

Secciones contrastadas:

```text
Introduction
Authentication
Visits
Plans
Routes
Route Properties
Vehicles
Users
Clients
Webhooks
Optimization
Invoices
Checkout Process
TMS
GPS
Datamart
Couriers / Providers
Errors
Changelog
```

Últimas entradas públicas relevantes observadas en el changelog:

```text
2026-02-05
2026-01-29
2026-01-27
```

Fecha de auditoría:

```text
2026-08-10
```

---

# 38. Próximo paso recomendado

La cobertura funcional ya está cerrada.

La próxima etapa útil no es otro dominio de endpoint, sino crear un:

```text
14-simpliroute-master-index-for-ai.md
```

que funcione como índice central para IA, con:

- mapa `intención -> archivo -> endpoint`;
- inventario consolidado de endpoints;
- tabla de autenticación por familia;
- tabla de addons;
- tabla de enums;
- tabla de IDs y tipos;
- reglas de decisión;
- referencias cruzadas;
- guía para que una IA encuentre rápidamente el `.md` correcto sin cargar todos los documentos.
