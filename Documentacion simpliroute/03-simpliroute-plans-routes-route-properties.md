# SimpliRoute Public API — Etapa 3: Plans, Routes y Route Properties

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API principal:** `https://api.simpliroute.com`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre la superficie pública oficial encontrada para:

- Plans management;
- creación de planes;
- relación Plan → Route → Visit;
- creación de rutas;
- listado de vehículos con rutas para una fecha;
- listado de visitas por ruta;
- actualización del campo `reference` de una ruta;
- Route Properties;
- lectura, creación, PUT, PATCH y DELETE de Route Properties;
- búsqueda masiva de Route Properties;
- restricciones, tipos, payloads, responses, inconsistencias y reglas para IA.

Este archivo debe utilizarse junto con:

```text
00-simpliroute-auditoria-inventario.md
01-simpliroute-fundamentos-auth-seguridad.md
02-simpliroute-visits-items-checkout.md
```

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción técnica, no garantía contractual. |
| `NOT_DOCUMENTED` | La referencia pública no especifica el comportamiento. |
| `NEEDS_VERIFICATION` | Existe contradicción o ambigüedad documental. |

Una IA MUST NOT tratar `INFERRED` o `NEEDS_VERIFICATION` como contrato definitivo.

---

# 3. Modelo conceptual

**Estado:** `OFFICIAL`

SimpliRoute define:

```text
Plan
└── Routes
    └── Visits
```

Un **Plan** representa una ejecución del sistema para un día determinado y agrupa asociaciones Vehicle + Driver.

Una **Route** agrupa un conjunto de Visits.

Una **Visit** representa una tarea que debe realizarse en calle:

- entrega;
- pickup;
- orden de servicio.

La documentación indica además que para crear un plan completo se necesitan IDs de:

```text
Vehicle
Driver
```

obtenibles desde:

```http
GET /v1/routes/vehicles/
GET /v1/accounts/drivers/
```

---

# 4. Plan

**Estado:** `OFFICIAL`

SimpliRoute describe un Plan como:

> una serie de asociaciones Vehicle y Driver para un día específico.

También lo define como la entidad que engloba una ejecución del sistema.

## Recomendación oficial de nombre

SimpliRoute recomienda crear el nombre del plan usando un timestamp para evitar problemas de unicidad.

Ejemplo:

```text
Plan created through API 2022-09-02 12:55:18
```

---

# 5. Restricciones oficiales de Plan

La documentación declara:

```text
name must be unique
start_date and end_date must be the same
```

Por tanto:

```text
plan.name -> unique
plan.start_date == plan.end_date
```

Ejemplo válido:

```json
{
  "name": "Plan API 2026-08-10 10:15:00",
  "start_date": "2026-08-10",
  "end_date": "2026-08-10"
}
```

Ejemplo que viola la regla publicada:

```json
{
  "name": "Plan varios días",
  "start_date": "2026-08-10",
  "end_date": "2026-08-11"
}
```

---

# 6. Crear Plan

## Endpoint

```http
POST /v1/plans/create-plan/
```

URL:

```text
https://api.simpliroute.com/v1/plans/create-plan/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

---

# 7. Create Plan — payload completo publicado

Ejemplo oficial representativo:

```json
{
  "name": "Plan created through API 2022-09-02 12:55:18",
  "start_date": "2022-09-02",
  "end_date": "2022-09-02",
  "routes": [
    {
      "driver": "183371",
      "vehicle": "288202",
      "planned_date": "2022-09-02",
      "total_distance": "0",
      "total_duration": "00:38:00",
      "total_load": 0,
      "total_load_percentage": 0,
      "total_load_2": 0,
      "total_load_2_percentage": 0,
      "total_load_3": 0,
      "total_load_3_percentage": 0,
      "estimated_time_start": "08:00:00",
      "estimated_time_end": "08:38:00",
      "request_status": "created",
      "comment": null,
      "location_start_address": "Av. San Borja Sur 486, Cercado de Lima 15036",
      "location_start_latitude": -12.101389,
      "location_start_longitude": -77.004534,
      "location_end_address": "Av. San Borja Sur 486, Cercado de Lima 15036",
      "location_end_latitude": -12.101389,
      "location_end_longitude": -77.004534,
      "visits": [
        {
          "title": "Order 1234",
          "address": "Jirón Vesalio 252, San Borja",
          "latitude": -12.105329,
          "longitude": -77.005524,
          "order": 1,
          "load": 1,
          "window_start": "09:00:00",
          "window_end": "17:00:00",
          "duration": "00:10:00",
          "contact_name": "David Rosales",
          "contact_email": "example@example.com",
          "reference": "",
          "notes": "Watch out with the dog!",
          "planned_date": "2022-09-02",
          "estimated_time_arrival": "08:02",
          "estimated_time_departure": "08:12",
          "request_status": "created"
        }
      ]
    }
  ]
}
```

---

# 8. Campos importantes de Plan

La documentación no entrega una tabla formal de tipos para Create Plan, pero sí declara campos importantes.

## Plan

| Campo | Tipo observado | Regla |
|---|---|---|
| `name` | String | Debe ser único. |
| `start_date` | Date `YYYY-MM-DD` | Debe ser igual a `end_date`. |
| `end_date` | Date `YYYY-MM-DD` | Debe ser igual a `start_date`. |
| `routes` | Array | Rutas incluidas en el plan. |

---

# 9. Campos importantes de Route dentro de Create Plan

SimpliRoute declara expresamente:

| Campo | Descripción |
|---|---|
| `driver` | Driver ID. |
| `vehicle` | Vehicle ID. |
| `planned_date` | Debe coincidir con `start_date` y `end_date` del Plan. |
| `estimated_time_start` | Hora estimada de inicio de trabajo del vehículo. |
| `estimated_time_end` | Hora estimada de fin. |
| `request_status` | Usado para crear una nueva ruta. |

La documentación indica que:

```text
planned_date == plan.start_date == plan.end_date
```

---

# 10. `request_status` en Route

Ejemplo oficial:

```json
{
  "request_status": "created"
}
```

La documentación describe este campo como necesario para crear una nueva ruta dentro del Plan.

## Enum completo

`NOT_DOCUMENTED`.

No asumir otros valores como:

```text
updated
deleted
pending
```

si no aparecen explícitamente en una operación documentada.

---

# 11. Campos importantes de Visit dentro de Create Plan

SimpliRoute declara como importantes:

| Campo | Descripción |
|---|---|
| `title` | Identificador de tienda/persona, visible en la app móvil. |
| `address` | Dirección, visible en la app móvil. |
| `order` | Orden de entrega. |
| `planned_date` | Fecha de entrega. |
| `estimated_time_arrival` | ETA. |
| `estimated_time_departure` | Hora estimada de salida. |
| `request_status` | Crear una nueva visita. |

Ejemplo:

```json
{
  "title": "Order 1234",
  "address": "Jirón Vesalio 252, San Borja",
  "order": 1,
  "planned_date": "2022-09-02",
  "estimated_time_arrival": "08:02",
  "estimated_time_departure": "08:12",
  "request_status": "created"
}
```

---

# 12. Campos no obligatorios y dummy data

**Estado:** `OFFICIAL`

La documentación afirma que:

> el resto de los parámetros no son obligatorios y deben establecerse con dummy data si la información no está disponible.

### Advertencia para IA

Esta frase debe interpretarse con cautela.

Una IA SHOULD:

- enviar datos reales cuando existan;
- sólo utilizar dummy data cuando el endpoint realmente lo requiera o cuando se reproduzca el flujo descrito;
- no introducir valores ficticios en producción si el campo puede omitirse sin impacto.

La documentación no especifica cuáles valores dummy son válidos universalmente.

---

# 13. Create Plan — Response

Ejemplo oficial:

```json
{
  "id": "4363095e-8d7c-46d0-9a14-8c895c37fa88",
  "name": "Plan created through API 2022-09-02 12:55:18",
  "start_date": "2022-09-02",
  "end_date": "2022-09-02",
  "reset_day": 1,
  "created": "2022-09-02T06:51:24.937690Z",
  "modified": "2022-09-02T06:51:24.937690Z",
  "is_cluster": false,
  "routes": [
    "349cd8a2-5149-4732-b46f-1073fb90ea07"
  ],
  "plan_metadata": null,
  "start_time": null,
  "end_time": null
}
```

---

# 14. Plan response fields

Campos observados:

| Campo | Tipo observado |
|---|---|
| `id` | UUID string |
| `name` | String |
| `start_date` | Date |
| `end_date` | Date |
| `reset_day` | Integer |
| `created` | ISO 8601 timestamp |
| `modified` | ISO 8601 timestamp |
| `is_cluster` | Boolean |
| `routes` | Array de Route UUIDs |
| `plan_metadata` | Object/null |
| `start_time` | Time/null |
| `end_time` | Time/null |

### Semántica de `reset_day`

`NOT_DOCUMENTED`.

### Semántica de `is_cluster`

`NOT_DOCUMENTED` en esta sección.

### Schema de `plan_metadata`

`NOT_DOCUMENTED`.

---

# 15. Variante mínima de Create Plan

La documentación también muestra:

```json
{
  "name": "Agosto",
  "start_date": "2016-08-01",
  "end_date": "2016-08-01"
}
```

Response publicado:

```json
[
  {
    "id": "fc65b49f-1f5c-4ca5-9b03-98565e1589f3",
    "name": "Agosto",
    "start_date": "2016-08-01",
    "end_date": "2016-08-01",
    "created": "2016-08-25T15:28:32.400027Z",
    "modified": "2016-08-25T15:28:32.400365Z",
    "is_cluster": false
  }
]
```

---

# 16. Inconsistencia del response de Create Plan

**Estado:** `NEEDS_VERIFICATION`

La documentación muestra dos formas de response:

Forma moderna:

```json
{
  "id": "...",
  "routes": ["..."]
}
```

Forma histórica:

```json
[
  {
    "id": "..."
  }
]
```

Por lo tanto:

```text
create_plan_response_root = NEEDS_VERIFICATION
```

Una integración robusta SHOULD verificar el shape efectivo de la cuenta/endpoint y no asumir un único root basándose exclusivamente en un ejemplo histórico.

---

# 17. Route

**Estado:** `OFFICIAL`

SimpliRoute define Route como:

> la entidad del sistema que engloba un conjunto de visitas.

La documentación afirma que sobre Routes pueden realizarse operaciones CRUD típicas, aunque la página pública actual sólo detalla explícitamente parte de esas operaciones.

### Regla IA

No inventar endpoints CRUD que no estén enumerados expresamente.

---

# 18. Crear Route

## Endpoint

```http
POST /v1/routes/routes/
```

URL:

```text
https://api.simpliroute.com/v1/routes/routes/
```

Headers del ejemplo oficial:

```http
Content-Type: application/json;charset=UTF-8
Accept: application/json, text/plain, */*
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

---

# 19. Create Route — Request

Ejemplo:

```json
{
  "vehicle": 377658,
  "driver": 118553,
  "planned_date": "2025-01-27",
  "estimated_time_start": "00:00:00",
  "estimated_time_end": "00:00:00",
  "location_start_address": "Av. Nicolás de Piérola 797-705, Lima 15001",
  "location_start_latitude": "-12.050577",
  "location_start_longitude": "-77.036330",
  "location_end_address": "Av. Abancay 202-252, Lima 15001",
  "location_end_latitude": "-12.046734",
  "location_end_longitude": "-77.026171",
  "plan": "308f1bc7-b37d-4d30-846f-0ee599ba6b43"
}
```

---

# 20. Create Route — Request fields

| Campo | Tipo observado | Descripción inferida del contrato |
|---|---|---|
| `vehicle` | Integer | Vehicle ID. |
| `driver` | Integer | Driver ID. |
| `planned_date` | Date | Fecha de ruta. |
| `estimated_time_start` | Time `HH:mm:ss` | Inicio estimado. |
| `estimated_time_end` | Time `HH:mm:ss` | Fin estimado. |
| `location_start_address` | String | Dirección de inicio. |
| `location_start_latitude` | String/Float observado | Latitud de inicio. |
| `location_start_longitude` | String/Float observado | Longitud de inicio. |
| `location_end_address` | String | Dirección de fin. |
| `location_end_latitude` | String/Float observado | Latitud de fin. |
| `location_end_longitude` | String/Float observado | Longitud de fin. |
| `plan` | UUID string | ID del Plan. |

## Required

La página no publica una tabla formal `required/optional`.

Estado:

```text
NOT_DOCUMENTED
```

No asumir que todos los campos del ejemplo son obligatorios.

---

# 21. Create Route — Response

Ejemplo oficial:

```json
{
  "id": "733d08d2-ef7a-479e-9f79-6bbe2c859a05",
  "vehicle": 377658,
  "driver": 118553,
  "plan": "308f1bc7-b37d-4d30-846f-0ee599ba6b43",
  "status": "pending",
  "planned_date": "2025-01-27",
  "estimated_time_start": "00:00:00",
  "estimated_time_end": "00:00:00",
  "total_duration": "00:00:00",
  "total_distance": 0,
  "total_load": 0.0,
  "total_load_percentage": 0,
  "total_load_2": 0.0,
  "total_load_2_percentage": 0,
  "total_load_3": 0.0,
  "total_load_3_percentage": 0,
  "location_start_address": "Av. Nicolás de Piérola 797-705, Lima 15001",
  "location_start_latitude": "-12.050577",
  "location_start_longitude": "-77.036330",
  "location_end_address": "Av. Abancay 202-252, Lima 15001",
  "location_end_latitude": "-12.046734",
  "location_end_longitude": "-77.026171",
  "comment": null,
  "start_time": null,
  "end_time": null,
  "created": "2025-01-27T22:09:29.808813Z",
  "modified": "2025-01-27T22:09:29.808813Z",
  "kilometers": null,
  "total_visits": 0,
  "latitude_init": null,
  "longitude_init": null,
  "latitude_finish": null,
  "longitude_finish": null,
  "is_revised": false,
  "reference": null
}
```

---

# 22. Route Object observado

Campos publicados en response:

| Campo | Tipo observado |
|---|---|
| `id` | UUID |
| `vehicle` | Integer |
| `driver` | Integer |
| `plan` | UUID |
| `status` | String |
| `planned_date` | Date |
| `estimated_time_start` | Time |
| `estimated_time_end` | Time |
| `total_duration` | Duration |
| `total_distance` | Number |
| `total_load` | Number |
| `total_load_percentage` | Number |
| `total_load_2` | Number |
| `total_load_2_percentage` | Number |
| `total_load_3` | Number |
| `total_load_3_percentage` | Number |
| `location_start_address` | String |
| `location_start_latitude` | String en ejemplo |
| `location_start_longitude` | String en ejemplo |
| `location_end_address` | String |
| `location_end_latitude` | String en ejemplo |
| `location_end_longitude` | String en ejemplo |
| `comment` | String/null |
| `start_time` | Timestamp/Time/null |
| `end_time` | Timestamp/Time/null |
| `created` | ISO timestamp |
| `modified` | ISO timestamp |
| `kilometers` | Number/null |
| `total_visits` | Integer |
| `latitude_init` | Number/String/null |
| `longitude_init` | Number/String/null |
| `latitude_finish` | Number/String/null |
| `longitude_finish` | Number/String/null |
| `is_revised` | Boolean |
| `reference` | String/null |

---

# 23. Route status

Ejemplo:

```json
{
  "status": "pending"
}
```

## Enum completo

`NOT_DOCUMENTED` en la sección Routes.

No extrapolar estados de Visit a Route.

---

# 24. `total_distance`

Ejemplo:

```json
{
  "total_distance": 60992
}
```

## Unidad

`NOT_DOCUMENTED` explícitamente en la sección Routes.

No asumir metros o kilómetros únicamente por el valor.

Existe también:

```text
kilometers
```

en response, pero su relación con `total_distance` no se explica aquí.

---

# 25. Listar vehículos con rutas para una fecha

## Endpoint

```http
GET /v1/plans/{planned_date}/vehicles/
```

Ejemplo:

```text
GET /v1/plans/2025-01-27/vehicles/
```

Formato de fecha:

```text
YYYY-MM-DD
```

Headers:

```http
Authorization: Token <TOKEN>
Content-Type: application/json;charset=UTF-8
Accept: application/json, text/plain, */*
```

---

# 26. Response — Vehicles with Routes

Ejemplo:

```json
[
  {
    "color": "#FFCC33",
    "routes": [
      {
        "plan_id": "f61cd65a-075e-454f-a080-d2c573d2be3e",
        "id": "e708c5ba-6d49-4418-b87e-9061e1194b1b"
      }
    ],
    "driver": {
      "id": 742,
      "name": "Conductor Demo"
    },
    "name": "Mi auto",
    "id": 287
  }
]
```

---

# 27. Semántica importante: múltiples rutas por vehículo

**Estado:** `OFFICIAL`

SimpliRoute afirma:

```text
A Vehicle can have multiple routes for a day.
```

Por tanto:

```text
vehicle.routes = array
```

y una integración MUST NOT modelar:

```text
vehicle -> exactly one route per day
```

---

# 28. Route ID

**Estado:** `OFFICIAL`

SimpliRoute indica que una ruta se identifica mediante UUID.

Ejemplo:

```text
e708c5ba-6d49-4418-b87e-9061e1194b1b
```

---

# 29. Listar Visits por Route

## Endpoint publicado

```http
GET /v1/plans/routes/{PLAN_ID}/visits/
```

Ejemplo:

```text
https://api.simpliroute.com/v1/plans/routes/{{PLAN_ID}}/visits/
```

---

# 30. Inconsistencia del placeholder `PLAN_ID`

**Estado:** `NEEDS_VERIFICATION`

La documentación titula el placeholder:

```text
PLAN_ID
```

pero:

1. el endpoint está bajo `/routes/{...}/visits/`;
2. el texto dice que una Route se identifica mediante UUID;
3. el response incluye tanto `plan_id` como `route_id`;
4. el valor usado conceptualmente para filtrar debería corresponder a la ruta.

### Regla para IA

No asumir que se debe enviar el UUID del Plan sólo porque el placeholder se llama `PLAN_ID`.

Modelar temporalmente:

```text
GET /v1/plans/routes/{route_or_plan_identifier}/visits/
identifier_semantics = NEEDS_VERIFICATION
```

Para producción, validar con un Route UUID real antes de congelar el contrato en código.

---

# 31. Response — Visits by Route

Ejemplo:

```json
[
  {
    "status": "failed",
    "plan_id": "f61cd65a-075e-454f-a080-d2c573d2be3e",
    "reference": "",
    "title": "STARK INDUSTRIES",
    "checkout_time": "2017-03-13T20:17:20Z",
    "longitude": "-70.651066",
    "id": 89274,
    "route_id": "e708c5ba-6d49-4418-b87e-9061e1194b1b",
    "address": "HUERFANOS 1011, SANTIAGO, Santiago",
    "latitude": "-33.439626",
    "estimated_time_arrival": "09:28:00",
    "order": 2
  }
]
```

---

# 32. Fields — Visits by Route

| Campo | Tipo observado |
|---|---|
| `status` | String |
| `plan_id` | UUID |
| `reference` | String |
| `title` | String |
| `checkout_time` | ISO timestamp/null |
| `longitude` | String en ejemplo |
| `id` | Integer en ejemplo |
| `route_id` | UUID |
| `address` | String |
| `latitude` | String en ejemplo |
| `estimated_time_arrival` | Time |
| `order` | Integer |

El response es una vista resumida y NO equivale al Visit Object completo.

---

# 33. Actualizar `reference` de una Route

## Endpoint

```http
PATCH /v1/routes/routes/{route_id}/
```

Body:

```json
{
  "reference": "Cronin Group"
}
```

Headers:

```http
Authorization: Token <TOKEN>
Content-Type: application/json;charset=UTF-8
Accept: application/json, text/plain, */*
```

---

# 34. `reference` de Route

La documentación demuestra explícitamente que:

```text
Route.reference
```

puede actualizarse por PATCH.

## Semántica / unicidad

`NOT_DOCUMENTED`.

No asumir que:

- es único;
- es obligatorio;
- tiene límite de longitud específico;
- actúa como idempotency key.

---

# 35. PATCH Route response

El response devuelve el Route Object completo observado.

Ejemplo abreviado:

```json
{
  "id": "32024005-7b45-455d-b901-f3f9afa2679e",
  "vehicle": 278533,
  "driver": 129373,
  "plan": "ab20be8f-e98e-4402-8519-98d6752e0f1a",
  "status": "pending",
  "planned_date": "2024-02-28",
  "reference": "Cronin Group"
}
```

---

# 36. Route Properties

Route Properties es un recurso separado de Route.

Campos publicados:

| Campo | Tipo | Descripción |
|---|---|---|
| `color` | String | Color asignado a la ruta al crear un plan. |
| `is_start_blocked` | Boolean | Permite bloquear el inicio de la ruta. |

Response incluye además:

```text
route
```

que identifica la ruta.

---

# 37. `color`

**Estado:** `OFFICIAL`

Para usar la propiedad `color`, la cuenta debe tener habilitada la configuración:

```text
enable_colors_for_contiguous_routes
```

### Regla IA

No asumir que establecer `color` tendrá efecto en todas las cuentas.

El feature depende de configuración de cuenta.

Ejemplos:

```text
#0000FF
#D50000
#658900
```

Formato observado:

```text
hexadecimal #RRGGBB
```

Validación exacta:

`NOT_DOCUMENTED`.

---

# 38. `is_start_blocked`

**Estado:** `OFFICIAL`

Tipo:

```text
Boolean
```

Propósito:

```text
bloquear el inicio de una ruta
```

Ejemplo:

```json
{
  "is_start_blocked": true
}
```

No se documenta en esta sección qué endpoint o error recibe el conductor cuando intenta iniciar una ruta bloqueada.

---

# 39. Obtener Route Properties

## Endpoint

```http
GET /v1/routes/routes-properties/{ROUTE_ID}
```

### Nota sobre slash

El path publicado no muestra slash final.

Copiar el endpoint tal como está documentado.

## Response

```json
{
  "route": "3d20088b-02b8-456b-80f9-ecfa8dbf27d6",
  "color": "#0000FF",
  "is_start_blocked": false
}
```

---

# 40. Crear Route Properties

## Endpoint

```http
POST /v1/routes/routes-properties/
```

## Request

```json
{
  "route": "3d20088b-02b8-456b-80f9-ecfa8dbf27d6",
  "color": null,
  "is_start_blocked": false
}
```

---

# 41. Create Route Properties — conflicto si ya existe

**Estado:** `OFFICIAL`

La documentación indica:

```text
If properties for the route already exist, an error response will be returned.
```

### Código HTTP exacto

`NOT_DOCUMENTED`.

No asumir `400`, `409` o `422` sin confirmación.

### Regla IA

Antes de crear puede:

- intentar GET;
- o manejar explícitamente el error de "already exists".

No implementar upsert implícito porque POST no está documentado como upsert.

---

# 42. PUT Route Properties

## Endpoint

```http
PUT /v1/routes/routes-properties/{ROUTE_ID}
```

## Request

```json
{
  "color": "#D50000",
  "is_start_blocked": true
}
```

Semántica oficial:

```text
update all the properties
```

### Regla

PUT representa actualización completa de las propiedades.

Comportamiento exacto de campos omitidos:

`NOT_DOCUMENTED`.

Enviar el conjunto completo cuando se use PUT.

---

# 43. PATCH Route Properties

## Endpoint

```http
PATCH /v1/routes/routes-properties/{ROUTE_ID}
```

Request:

```json
{
  "is_start_blocked": false
}
```

Semántica oficial:

```text
Only the properties included in the request body will be updated.
```

Por tanto:

```text
PATCH omitted field -> unchanged
```

---

# 44. DELETE Route Properties

## Endpoint

```http
DELETE /v1/routes/routes-properties/{ROUTE_ID}
```

Propósito:

```text
delete all properties for the specified route
```

### Response body

`NOT_DOCUMENTED`.

### Status code

`NOT_DOCUMENTED`.

### Idempotencia contractual

`NOT_DOCUMENTED`.

---

# 45. Bulk Search Route Properties

## Endpoint

```http
POST /v1/routes/routes-properties/bulk-search/
```

Body:

```json
{
  "route_ids": [
    "da6c3bac-898d-4343-8b05-5b80f2d7c26a",
    "3d20088b-02b8-456b-80f9-ecfa8dbf27d6"
  ]
}
```

---

# 46. Bulk Search response

```json
[
  {
    "route": "3d20088b-02b8-456b-80f9-ecfa8dbf27d6",
    "color": "#658900",
    "is_start_blocked": false
  },
  {
    "route": "da6c3bac-898d-4343-8b05-5b80f2d7c26a",
    "color": null,
    "is_start_blocked": true
  }
]
```

### Orden del response

`NOT_DOCUMENTED`.

No asumir que respeta necesariamente el orden de `route_ids`.

### IDs no encontrados

`NOT_DOCUMENTED`.

No asumir si:

- se omiten;
- devuelven null;
- producen error global.

---

# 47. Límite de Bulk Search

`NOT_DOCUMENTED`.

No existe límite público declarado de cantidad de:

```text
route_ids
```

por request.

---

# 48. Headers Route Properties

La sección Route Properties no repite cURL completo para cada operación.

Por contrato global de API principal, utilizar:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

para operaciones con JSON body.

GET/DELETE no necesariamente requieren `Content-Type`, aunque enviarlo es compatible con ejemplos generales.

---

# 49. Relación Plan ↔ Route

Create Route envía:

```json
{
  "plan": "<PLAN_UUID>"
}
```

Create Plan response devuelve:

```json
{
  "routes": [
    "<ROUTE_UUID>"
  ]
}
```

Por tanto:

```text
Route.plan -> Plan.id
Plan.routes[] -> Route.id
```

---

# 50. Relación Route ↔ Vehicle

Create Route:

```json
{
  "vehicle": 377658
}
```

`GET /v1/plans/{date}/vehicles/` devuelve:

```json
{
  "id": 287,
  "routes": [
    {
      "id": "<ROUTE_UUID>"
    }
  ]
}
```

Por tanto:

```text
Route.vehicle -> Vehicle.id
Vehicle.routes[] -> Route.id
```

---

# 51. Relación Route ↔ Driver

Create Route:

```json
{
  "driver": 118553
}
```

Vehicles-with-routes response puede incluir:

```json
{
  "driver": {
    "id": 742,
    "name": "Conductor Demo"
  }
}
```

La documentación no establece que un vehículo tenga siempre exactamente un conductor en todos los escenarios.

---

# 52. Relación Route ↔ Visit

Una Route engloba Visits.

Create Plan permite incluirlas inline:

```text
plan.routes[].visits[]
```

List by Route devuelve Visits asociadas a un Route UUID.

Visit Object también contiene:

```text
route
```

como identificador de ruta.

---

# 53. Creación de Plan vs creación individual de Route

Hay dos caminos publicados:

## A. Crear plan completo

```http
POST /v1/plans/create-plan/
```

Puede incluir:

```text
routes[]
routes[].visits[]
```

## B. Crear Route

```http
POST /v1/routes/routes/
```

requiriendo asociación con:

```text
plan
vehicle
driver
```

### Cuándo usar cada uno

La documentación no publica una tabla de decisión formal.

Interpretación:

- `create-plan` permite construir una ejecución completa;
- `routes/routes/` permite crear explícitamente una ruta vinculada a un plan existente.

Estado de esta interpretación:

`INFERRED`.

---

# 54. Plan preexistente para Create Route

El request de Create Route contiene:

```json
{
  "plan": "<PLAN_UUID>"
}
```

Por tanto el endpoint espera un Plan identificable.

### Qué ocurre si Plan no existe

`NOT_DOCUMENTED`.

Probablemente error, pero el status/body no debe inventarse.

---

# 55. Fechas coherentes

Para Create Plan:

```text
plan.start_date == plan.end_date
route.planned_date == plan.start_date
visit.planned_date == route/plan date
```

La documentación declara explícitamente la igualdad de fecha a nivel Plan/Route.

Para Visit, el ejemplo y la lógica muestran la misma fecha.

Una IA SHOULD validar toda la jerarquía antes de enviar.

---

# 56. Horarios y ETA

Campos observados:

```text
estimated_time_start
estimated_time_end
estimated_time_arrival
estimated_time_departure
```

Formatos:

Route:

```text
HH:mm:ss
```

Visit dentro de Create Plan:

```text
HH:mm
```

Ejemplos:

```text
08:00:00
08:38:00
08:02
08:12
```

### Inconsistencia

`NEEDS_VERIFICATION`

No existe una regla única publicada en esta sección sobre precisión de segundos.

Usar el formato exacto esperado por el endpoint específico.

---

# 57. Coordenadas

Create Plan muestra numbers:

```json
{
  "location_start_latitude": -12.101389
}
```

Create Route muestra strings:

```json
{
  "location_start_latitude": "-12.050577"
}
```

Response también usa strings.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla

No asumir tipo JSON uniforme para coordenadas en todas las APIs.

Parser de response debe aceptar string numérico cuando corresponda.

---

# 58. IDs Driver y Vehicle

Create Plan muestra:

```json
{
  "driver": "183371",
  "vehicle": "288202"
}
```

Create Route muestra:

```json
{
  "driver": 118553,
  "vehicle": 377658
}
```

Estado:

```text
NEEDS_VERIFICATION
```

La semántica es ID, pero el JSON puede mostrarse como string o number según ejemplo.

### Recomendación

Tratar IDs como identificadores opacos y no realizar aritmética.

---

# 59. Plan ID y Route ID

Los ejemplos son UUID string.

Plan:

```text
4363095e-8d7c-46d0-9a14-8c895c37fa88
```

Route:

```text
733d08d2-ef7a-479e-9f79-6bbe2c859a05
```

Modelo interno recomendado:

```text
string
```

---

# 60. `color` en vehículos vs Route Properties

`GET /v1/plans/{date}/vehicles/` puede devolver:

```json
{
  "color": "#FFCC33"
}
```

Route Properties también tiene:

```text
color
```

La documentación no afirma que ambos campos sean exactamente el mismo dato o tengan igual source of truth.

MUST NOT sincronizarlos automáticamente sin verificar.

---

# 61. Bloqueo de inicio de Route

Route Properties:

```json
{
  "is_start_blocked": true
}
```

puede utilizarse para bloquear inicio.

El inicio de ruta, documentado en Etapa 2, usa:

```http
POST /v1/events/register/
```

con:

```json
{
  "type": "ROUTE_STARTED"
}
```

### Interacción exacta

`NOT_DOCUMENTED`.

No se publica el response que produce un intento de `ROUTE_STARTED` cuando `is_start_blocked=true`.

---

# 62. Status codes

No se publica una tabla endpoint-specific para Plans/Routes/Route Properties en las secciones revisadas.

Por tanto:

| Endpoint | Success status exacto |
|---|---|
| POST `/v1/plans/create-plan/` | `NOT_DOCUMENTED` |
| POST `/v1/routes/routes/` | `NOT_DOCUMENTED` |
| GET `/v1/plans/{date}/vehicles/` | `NOT_DOCUMENTED` |
| GET `/v1/plans/routes/{id}/visits/` | `NOT_DOCUMENTED` |
| PATCH `/v1/routes/routes/{id}/` | `NOT_DOCUMENTED` |
| GET Route Properties | `NOT_DOCUMENTED` |
| POST Route Properties | `NOT_DOCUMENTED` |
| PUT Route Properties | `NOT_DOCUMENTED` |
| PATCH Route Properties | `NOT_DOCUMENTED` |
| DELETE Route Properties | `NOT_DOCUMENTED` |
| POST bulk-search | `NOT_DOCUMENTED` |

Aplican las convenciones globales de error de Etapa 1, sin inventar códigos particulares.

---

# 63. Paginación

No se documenta paginación en:

```text
GET /v1/plans/{date}/vehicles/
GET /v1/plans/routes/{id}/visits/
POST /v1/routes/routes-properties/bulk-search/
```

Estado:

```text
NOT_DOCUMENTED
```

No extrapolar Datamart.

---

# 64. Filtros adicionales

No se documentan query params adicionales para estas operaciones.

No inventar:

```text
status=
driver=
vehicle=
plan=
page=
limit=
offset=
```

salvo que una etapa posterior o changelog los documente expresamente.

---

# 65. Idempotencia

No existe contrato público global.

Particularmente:

```http
POST /v1/plans/create-plan/
POST /v1/routes/routes/
POST /v1/routes/routes-properties/
```

MUST NOT reintentarse ciegamente luego de un timeout ambiguo.

Para Plan existe además:

```text
name must be unique
```

lo cual puede ayudar a detectar duplicación, pero NO está documentado como mecanismo oficial de idempotencia.

---

# 66. Error por nombre de Plan duplicado

La documentación declara que el nombre debe ser único.

### Status code

`NOT_DOCUMENTED`.

### Body

`NOT_DOCUMENTED`.

Una IA no debe inventar:

```text
409 Conflict
```

aunque sería convencional.

---

# 67. Error al crear Route Properties existentes

Existe error documentado conceptualmente.

### Código y schema

`NOT_DOCUMENTED`.

No hardcodear parser específico.

---

# 68. Eliminación de Route Properties

DELETE elimina:

```text
all the properties
```

para esa ruta.

No elimina la Route.

Modelo:

```text
DELETE route-properties != DELETE route
```

---

# 69. Color nullable

Create Route Properties:

```json
{
  "color": null
}
```

Bulk response:

```json
{
  "color": null
}
```

Por tanto:

```text
color nullable = OFFICIAL_EXAMPLE
```

No se documenta si PUT con `null` elimina/restablece el color.

---

# 70. `is_start_blocked` default

Ejemplos muestran:

```text
false
```

pero la documentación no declara formalmente:

```text
default = false
```

Estado:

```text
NOT_DOCUMENTED
```

No asumir default si se omite en POST.

---

# 71. Route Properties lifecycle recomendado

Flujo:

```text
Route creada
   |
   v
POST /routes-properties/
   |
   +--> GET /{route_id}
   |
   +--> PATCH /{route_id}
   |
   +--> PUT /{route_id}
   |
   +--> DELETE /{route_id}
```

Para múltiples rutas:

```text
POST /bulk-search/
```

---

# 72. Flujo completo: Plan con Route y Visits

```text
1. GET /v1/routes/vehicles/
      -> obtener vehicle.id

2. GET /v1/accounts/drivers/
      -> obtener driver.id

3. Preparar Plan:
      name unique
      start_date == end_date

4. Preparar Route:
      vehicle
      driver
      planned_date == plan date
      estimated_time_start
      estimated_time_end
      request_status = "created"

5. Preparar Visits:
      title
      address
      order
      planned_date
      ETA
      request_status = "created"

6. POST /v1/plans/create-plan/

7. Guardar:
      plan.id
      route IDs devueltos

8. Opcional:
      crear Route Properties

9. Operación:
      GET vehicles/routes by date
      GET visits by route
```

---

# 73. Ejemplo de Create Plan para integración

```bash
curl --location \
  'https://api.simpliroute.com/v1/plans/create-plan/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  --data '{
    "name": "ERP-PLAN-2026-08-10T12:00:00",
    "start_date": "2026-08-10",
    "end_date": "2026-08-10",
    "routes": [
      {
        "driver": 1001,
        "vehicle": 2001,
        "planned_date": "2026-08-10",
        "estimated_time_start": "08:00:00",
        "estimated_time_end": "18:00:00",
        "request_status": "created",
        "visits": [
          {
            "title": "Pedido 10001",
            "address": "Av. Ejemplo 123",
            "order": 1,
            "planned_date": "2026-08-10",
            "estimated_time_arrival": "09:00",
            "estimated_time_departure": "09:10",
            "request_status": "created"
          }
        ]
      }
    ]
  }'
```

Los IDs y datos son ficticios.

---

# 74. Ejemplo de Create Route

```bash
curl --location \
  'https://api.simpliroute.com/v1/routes/routes/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  -d '{
    "vehicle": 2001,
    "driver": 1001,
    "planned_date": "2026-08-10",
    "estimated_time_start": "08:00:00",
    "estimated_time_end": "18:00:00",
    "location_start_address": "Depósito Central",
    "location_start_latitude": "-34.6037",
    "location_start_longitude": "-58.3816",
    "location_end_address": "Depósito Central",
    "location_end_latitude": "-34.6037",
    "location_end_longitude": "-58.3816",
    "plan": "<PLAN_UUID>"
  }'
```

---

# 75. Ejemplo de Route Properties

## Create

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/routes/routes-properties/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "route": "<ROUTE_UUID>",
    "color": "#0000FF",
    "is_start_blocked": false
  }'
```

## Patch block

```bash
curl -X PATCH \
  'https://api.simpliroute.com/v1/routes/routes-properties/<ROUTE_UUID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "is_start_blocked": true
  }'
```

---

# 76. Endpoint inventory

| Método | Endpoint | Función |
|---|---|---|
| POST | `/v1/plans/create-plan/` | Crear Plan, opcionalmente con Routes y Visits |
| POST | `/v1/routes/routes/` | Crear Route |
| GET | `/v1/plans/{planned_date}/vehicles/` | Vehículos y sus rutas por fecha |
| GET | `/v1/plans/routes/{PLAN_ID}/visits/` | Listar Visits de una Route; placeholder inconsistente |
| PATCH | `/v1/routes/routes/{route_id}/` | Actualizar `reference` de Route |
| GET | `/v1/routes/routes-properties/{ROUTE_ID}` | Obtener Route Properties |
| POST | `/v1/routes/routes-properties/` | Crear Route Properties |
| PUT | `/v1/routes/routes-properties/{ROUTE_ID}` | Actualización completa |
| PATCH | `/v1/routes/routes-properties/{ROUTE_ID}` | Actualización parcial |
| DELETE | `/v1/routes/routes-properties/{ROUTE_ID}` | Eliminar Route Properties |
| POST | `/v1/routes/routes-properties/bulk-search/` | Buscar propiedades de múltiples Routes |

Endpoints relacionados requeridos para crear Plan:

```http
GET /v1/routes/vehicles/
GET /v1/accounts/drivers/
```

Serán documentados exhaustivamente en la siguiente etapa.

---

# 77. Funcionalidades mencionadas pero no detalladas

La sección Routes dice:

```text
typical CRUD operations
```

pero no publica en ese bloque actual endpoints explícitos para:

```text
GET /v1/routes/routes/{id}/
PUT /v1/routes/routes/{id}/
DELETE /v1/routes/routes/{id}/
```

### Regla IA

MUST NOT inventarlos sólo por convención REST.

Hasta encontrar documentación oficial explícita:

```text
Route full CRUD endpoints beyond documented operations = NOT_DOCUMENTED
```

---

# 78. Campos server-managed de Route

Una IA SHOULD tratar normalmente como lectura:

```text
status
total_duration
total_distance
total_load
total_load_percentage
total_load_2
total_load_2_percentage
total_load_3
total_load_3_percentage
start_time
end_time
created
modified
kilometers
total_visits
latitude_init
longitude_init
latitude_finish
longitude_finish
is_revised
```

salvo que un endpoint específico declare escritura.

---

# 79. Campos writable confirmados de Route

Confirmados por ejemplos:

Create:

```text
vehicle
driver
planned_date
estimated_time_start
estimated_time_end
location_start_address
location_start_latitude
location_start_longitude
location_end_address
location_end_latitude
location_end_longitude
plan
```

PATCH:

```text
reference
```

No asumir que otros campos de response pueden enviarse.

---

# 80. Reglas MUST para IA

Una IA MUST:

1. usar `Token` auth;
2. mantener `Plan.name` único;
3. mantener `start_date == end_date`;
4. alinear `Route.planned_date` con fecha del Plan;
5. obtener IDs reales de Vehicles y Drivers;
6. tratar Plan ID y Route ID como strings UUID;
7. modelar `vehicle.routes` como array;
8. usar PATCH para modificación parcial de Route Properties;
9. usar PUT sólo como actualización completa de Route Properties;
10. tratar POST Route Properties como create, no upsert;
11. respetar `enable_colors_for_contiguous_routes` para color;
12. considerar `is_start_blocked` como control de inicio;
13. registrar inconsistencia de `{PLAN_ID}` en Visits by Route;
14. no inventar status codes;
15. no inventar paginación.

---

# 81. Reglas MUST NOT para IA

MUST NOT:

1. asumir que Plan puede abarcar múltiples días;
2. reutilizar un nombre de Plan sin manejar error;
3. asumir que un Vehicle tiene una sola Route diaria;
4. interpretar `{PLAN_ID}` como Plan UUID sin verificar;
5. asumir unidad de `total_distance`;
6. asumir que `reference` es único;
7. crear Route Properties si ya existen esperando overwrite;
8. asumir que `color` funciona sin feature flag;
9. confundir DELETE Route Properties con DELETE Route;
10. inventar GET/PUT/DELETE de Route por convención;
11. asumir coordenadas siempre number;
12. asumir Driver/Vehicle IDs siempre number;
13. asumir response de Create Plan siempre object;
14. asumir `request_status` tiene enums adicionales;
15. extrapolar paginación de Datamart.

---

# 82. Ambigüedades detectadas

| Tema | Problema | Estado |
|---|---|---|
| Create Plan response | object vs array en ejemplos | `NEEDS_VERIFICATION` |
| Driver ID | string en Create Plan, integer en Create Route | `NEEDS_VERIFICATION` |
| Vehicle ID | string en Create Plan, integer en Create Route | `NEEDS_VERIFICATION` |
| Coordinates | numbers en Plan, strings en Route | `NEEDS_VERIFICATION` |
| Visit ETA | `HH:mm` vs otros endpoints `HH:mm:ss` | `NEEDS_VERIFICATION` |
| Visits by Route placeholder | se llama `PLAN_ID` pero semántica parece Route ID | `NEEDS_VERIFICATION` |
| Route CRUD | texto dice CRUD, endpoints no están todos publicados | `PARTIALLY_DOCUMENTED` |
| `total_distance` unit | no indicada | `NOT_DOCUMENTED` |
| Plan `reset_day` | semántica ausente | `NOT_DOCUMENTED` |
| Plan `plan_metadata` | schema ausente | `NOT_DOCUMENTED` |
| Route Properties conflict HTTP code | no indicado | `NOT_DOCUMENTED` |

---

# 83. Aspectos NO documentados

No existe contrato público exhaustivo para:

```text
Plan list endpoint
Plan retrieve endpoint
Plan update endpoint
Plan delete endpoint
full Route retrieve endpoint
full Route PUT endpoint
Route delete endpoint
success status codes específicos
error schemas específicos
pagination
sorting
additional filters
bulk search maximum size
Plan maximum routes
Plan maximum visits
Route maximum visits
name length
Route reference length
Route Properties color validation
Route Properties default values
exact interaction is_start_blocked vs ROUTE_STARTED
idempotency
retry
```

Una IA debe tratarlos como desconocidos.

---

# 84. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones utilizadas:

```text
Plans management
Create Plan
Routes
Create routes
List of Vehicles with routes for a date
List of Visits by Route
Update reference field by Route
Route Properties
Get Route Properties
Create Route Properties
Update Route Properties
Partial Update Route Properties
Delete Route Properties
Bulk Search Routes Properties
```

Fecha:

```text
2026-08-10
```

---

# 85. Estado final

**ETAPA 3 COMPLETADA**

Cobertura:

```text
Plans
Plan creation
Plan → Route → Visit
Route creation
Routes by vehicle/date
Visits by Route
Route reference
Route Properties CRUD
Route Properties bulk search
```

Siguiente etapa:

```text
04-vehicles-users-skills-zones-fleets.md
```

La siguiente etapa deberá documentar exhaustivamente:

- Vehicles;
- todos los campos disponibles;
- create/list/get/PATCH/PUT/DELETE;
- `extra_properties`;
- Users/Drivers;
- list/create/get/update/delete;
- Skills;
- Zones;
- Fleets;
- relaciones Vehicle ↔ Driver ↔ Skills ↔ Zone ↔ Fleet;
- restricciones;
- tipos;
- payloads;
- responses;
- errores y ambigüedades.
