# SimpliRoute Public API — Etapa 9: TMS — Transportation Providers, Documents y Vehicle Block/Unblock

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base TMS declarada:** `https://api-gateway.simpliroute.com/tms/api/v1`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre exhaustivamente la documentación pública oficial encontrada para el módulo TMS de SimpliRoute:

- disponibilidad contractual del servicio;
- base URL;
- autenticación;
- Transportation Provider;
- create/list/retrieve/update/delete;
- campos, defaults y status codes;
- asignación de Transportation Provider a Vehicle;
- TMS Documents;
- upload multipart;
- upsert;
- metadata de archivos;
- expiration date;
- update de expiration por `document_id`;
- bloqueo de Vehicle;
- desbloqueo de Vehicle;
- diferencias entre `api-gateway.simpliroute.com` y `api.simpliroute.com`;
- inconsistencias entre documentación inglesa y española;
- reglas para agentes de IA.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción técnica útil; no garantía contractual. |
| `NOT_DOCUMENTED` | No especificado públicamente. |
| `NEEDS_VERIFICATION` | Existe contradicción, ambigüedad o error documental. |

---

# 3. Disponibilidad del módulo TMS

**Estado:** `OFFICIAL`

La documentación repite:

```text
IMPORTANT: This Service is only available for the clients that has contracted it.
```

Por tanto:

```text
TMS públicamente documentado != habilitado en todas las cuentas
```

Una integración MUST verificar que la cuenta tenga contratado el servicio.

---

# 4. Base URL declarada

La documentación TMS declara:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

Por tanto, modelo conceptual:

```text
TMS_BASE_URL = https://api-gateway.simpliroute.com/tms/api/v1
```

---

# 5. Inconsistencia de host en ejemplos

Aunque la base declarada es:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

varios ejemplos cURL utilizan:

```text
https://api.simpliroute.com/tms/api/v1/...
```

Esto aparece en:

- Documents;
- Vehicle Block;
- Vehicle Unblock.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla IA

Una IA MUST conservar ambas observaciones:

```text
documented TMS base:
  https://api-gateway.simpliroute.com/tms/api/v1

official examples also use:
  https://api.simpliroute.com/tms/api/v1
```

No declarar ambos como equivalentes sin validación runtime.

---

# 6. Autenticación TMS

**Estado:** `OFFICIAL`

La documentación indica:

```text
An Authorization Header containing a valid Token is required.
```

Los ejemplos usan:

```http
Authorization: Token {{TokenSR}}
```

Por tanto:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

---

# 7. Headers comunes TMS

Ejemplos modernos usan:

```http
Authorization: Token <TOKEN>
Accept: application/json
```

Para JSON bodies:

```http
Content-Type: application/json
```

Para Documents:

```http
multipart/form-data
```

El boundary debe manejarlo normalmente el cliente HTTP.

---

# 8. Transportation Provider

Representa un proveedor/transportista dentro del módulo TMS.

Base resource:

```text
/transportation-providers/
```

Operaciones oficiales en versión inglesa:

```http
POST   /transportation-providers/
GET    /transportation-providers/
GET    /transportation-providers/{id}
PUT    /transportation-providers/{id}
DELETE /transportation-providers/{id}
```

---

# 9. Crear Transportation Provider

## Endpoint

Con base TMS declarada:

```http
POST /transportation-providers/
```

URL:

```text
https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/
```

---

# 10. Create Transportation Provider — Basic Request

```json
{
  "trade_name": "FEDEX",
  "status": "active",
  "contact_person": "Doe Dawson"
}
```

---

# 11. Transportation Provider fields

| Campo | Mandatory | Tipo | Default | Descripción |
|---|:---:|---|---|---|
| `trade_name` | Sí | String | — | Nombre comercial. |
| `legal_name` | No | String | — | Nombre legal registrado. |
| `account_id` | Sí | Integer | — | Account ID correspondiente al Token. |
| `status` | No | String | `active` | Estado del provider. |
| `contact_person` | Sí | String | — | Persona de contacto. |
| `contact_email` | No | String | — | Email de contacto. |
| `phone_number` | No | String | — | Teléfono. |
| `address` | No | String | — | Dirección. |
| `tax_id_number` | No | String | — | Identificador fiscal/legal. |
| `reference` | No | String | — | Código externo utilizado por el cliente. |

---

# 12. Inconsistencia Basic Request vs mandatory `account_id`

**Estado:** `NEEDS_VERIFICATION`

La tabla declara:

```text
account_id = mandatory
```

pero Basic Request oficial:

```json
{
  "trade_name": "FEDEX",
  "status": "active",
  "contact_person": "Doe Dawson"
}
```

lo omite.

### Regla segura

Una implementación SHOULD enviar:

```text
account_id
```

cuando lo conozca, porque la tabla formal lo marca obligatorio.

No usar el ejemplo mínimo como prueba de que es opcional.

---

# 13. `account_id`

La descripción dice:

```text
Account’s id corresponding to the Token
```

Esto implica que el Account ID debe corresponder a la cuenta autenticada.

### Error si no coincide

`NOT_DOCUMENTED`.

No asumir status específico.

---

# 14. `status`

Default oficial:

```text
active
```

Enum completo:

```text
NOT_DOCUMENTED
```

No inventar:

```text
inactive
blocked
deleted
```

como valores soportados.

---

# 15. `reference`

Código de identificación externo.

Unicidad:

```text
NOT_DOCUMENTED
```

No usar automáticamente como idempotency key.

---

# 16. Transportation Provider ID

El endpoint usa:

```text
{id}
```

y la asignación a Vehicle declara:

```text
transportation_provider_id -> UUID
```

Por tanto:

```text
TransportationProvider.id = UUID
```

según contrato de asociación.

---

# 17. Create Transportation Provider — status codes

Oficiales:

| Código | Significado |
|---:|---|
| `201` | Successful creation |
| `422` | Payload has formatting errors |
| `500` | Server error |

### Ausencias

La tabla de creación no menciona:

```text
400
401
403
```

Esto NO significa que sean imposibles globalmente.

No inventar una lista exhaustiva.

---

# 18. List Transportation Providers

## Endpoint

```http
GET /transportation-providers/
```

URL:

```text
https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/
```

Body:

```text
empty
```

---

# 19. List status codes

| Código | Significado |
|---:|---|
| `200` | Successful request/list |
| `500` | Server error |

La documentación inglesa describe `200` como “Successful creation” en esa tabla, lo cual es claramente un wording incorrecto para GET.

Estado:

```text
OFFICIAL_TEXT typo
```

Interpretar:

```text
200 = successful list
```

---

# 20. Pagination de Transportation Providers

`NOT_DOCUMENTED`.

No se publican:

```text
limit
offset
page
cursor
```

---

# 21. Filters

`NOT_DOCUMENTED`.

No inventar query params como:

```text
status
reference
trade_name
account_id
```

---

# 22. Retrieve Transportation Provider

## Endpoint

```http
GET /transportation-providers/{id}
```

Body:

```text
empty
```

Path param:

```text
id = Transportation Provider ID
```

---

# 23. Retrieve status codes

| Código | Significado |
|---:|---|
| `200` | Successful retrieval |
| `404` | Resource doesn't exist |
| `500` | Server error |

La tabla oficial inglesa vuelve a usar wording “Successful creation” para `200`.

Estado:

```text
OFFICIAL_TEXT typo
```

---

# 24. Update Transportation Provider

## Endpoint canónico de la documentación inglesa

```http
PUT /transportation-providers/{id}
```

Body:

```text
same shape as Creation Request
```

---

# 25. Error en documentación española de Update

La versión española muestra:

```text
HTTP method: GET
```

para “Actualizar”.

La documentación inglesa oficial muestra:

```text
PUT
```

Estado:

```text
NEEDS_VERIFICATION / translation-documentation bug
```

### Regla IA

Usar:

```http
PUT
```

porque:

- coincide con la versión inglesa actual;
- coincide con la semántica “Update”;
- los status codes describen actualización.

MUST NOT usar GET con body para update.

---

# 26. PUT body

La documentación dice:

```text
Body: Same as presented in Creation Request.
```

Por tanto acepta conceptualmente:

```text
trade_name
legal_name
account_id
status
contact_person
contact_email
phone_number
address
tax_id_number
reference
```

---

# 27. PUT complete vs partial

`NOT_DOCUMENTED`.

Aunque es PUT, no se explica si campos omitidos:

- quedan iguales;
- se borran;
- toman defaults;
- producen error.

### Regla segura

Enviar el recurso completo conocido cuando se use PUT.

---

# 28. Update status codes

| Código | Significado |
|---:|---|
| `200` | Successful update |
| `400` | Wrong request |
| `403` | User without authorization |
| `404` | Resource doesn't exist |
| `422` | Payload has formatting errors |
| `500` | Server error |

---

# 29. `401` vs `403`

Update publica `403` pero no `401`.

Otros servicios TMS publican `401`.

No asumir que TMS usa consistentemente sólo uno.

Modelo:

```text
401 -> authentication failure
403 -> authorization failure
```

según semántica HTTP, pero endpoint-specific behavior debe seguir la tabla oficial.

---

# 30. Delete Transportation Provider

## Endpoint canónico inglés

```http
DELETE /transportation-providers/{id}
```

Body:

```text
empty
```

---

# 31. Error en documentación española de Delete

La versión española muestra:

```text
HTTP method: GET
```

para “Eliminar”.

La versión inglesa oficial muestra:

```text
DELETE
```

Estado:

```text
NEEDS_VERIFICATION / translation-documentation bug
```

### Regla

Usar:

```http
DELETE
```

MUST NOT usar GET para eliminar.

---

# 32. Delete status codes

| Código | Significado |
|---:|---|
| `204` | Successful deletion |
| `400` | Wrong request |
| `403` | User without authorization |
| `404` | Resource doesn't exist |
| `500` | Server error |

---

# 33. Delete response body

Para HTTP `204`:

```text
response body should normally be empty
```

La documentación sólo especifica status.

Body exacto:

```text
NOT_DOCUMENTED
```

---

# 34. Assign Transportation Provider to Vehicle

## Endpoint

```http
POST /vehicles/transportation-providers
```

URL con base declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1/vehicles/transportation-providers
```

---

# 35. Bulk assignment

**Estado:** `OFFICIAL`

El endpoint permite asignar varios providers en una sola request.

Root:

```text
Array
```

Ejemplo:

```json
[
  {
    "vehicle_id": 2,
    "transportation_provider_id": "14383454-keur-64f7-232e-901434a8f5ga"
  },
  {
    "vehicle_id": 3,
    "transportation_provider_id": "42383454-ba4a-4ff7-b52e-90544e8f5e44"
  }
]
```

---

# 36. Assignment fields

| Campo | Mandatory | Tipo | Descripción |
|---|:---:|---|---|
| `vehicle_id` | Sí | Integer | Vehicle ID. |
| `transportation_provider_id` | Sí | UUID | Transportation Provider ID. |

---

# 37. Description errors in assignment table

La descripción oficial dice para:

```text
vehicle_id -> Commercial name for the provider
transportation_provider_id -> Registered name in administrative institutions
```

Estas descripciones no corresponden a los nombres/tipos.

Estado:

```text
OFFICIAL_TABLE copy/paste error
```

### Regla IA

Interpretar según field name + type:

```text
vehicle_id -> ID del Vehicle
transportation_provider_id -> UUID del Transportation Provider
```

---

# 38. Assignment semantics

La documentación dice:

```text
creating a relation between them
```

No especifica cardinalidad exacta:

- un Vehicle → un Provider;
- un Vehicle → múltiples Providers;
- Provider → múltiples Vehicles.

El endpoint acepta varias relaciones en array, pero eso no define restricciones por Vehicle.

Estado:

```text
NOT_DOCUMENTED
```

---

# 39. Assignment update/unassign

No se publican endpoints para:

```text
remove provider from vehicle
replace assignment
list assignments
```

No inventarlos.

---

# 40. Assignment status codes

| Código | Significado |
|---:|---|
| `200` | Successful request |
| `404` | Resource doesn't exist |
| `500` | Server error |

No se publica `422` para este endpoint.

---

# 41. Batch assignment maximum

`NOT_DOCUMENTED`.

No existe máximo oficial de relaciones por request.

---

# 42. TMS Documents

**Estado:** `OFFICIAL`

Permite asociar documentos a entidades TMS.

Ejemplos mencionan:

```text
Vehicle
User
```

Pero la tabla de `entity_type` publicada especifica como valor permitido:

```text
vehicle
```

### Estado

```text
NEEDS_VERIFICATION
```

El texto general menciona User, pero el enum visible sólo documenta `vehicle`.

Una IA MUST limitarse a valores oficialmente enumerados salvo nueva documentación.

---

# 43. Documents base endpoint

```text
/documents/
```

Operaciones publicadas:

```http
POST /documents/
POST /documents/{document_id}
```

No se publican GET/DELETE en esta sección.

---

# 44. Create / Update Document — Upsert

## Endpoint

```http
POST /documents/
```

Base declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1/documents/
```

Ejemplo usa alternativamente:

```text
https://api.simpliroute.com/tms/api/v1/documents/
```

Estado host:

```text
NEEDS_VERIFICATION
```

---

# 45. Content-Type

**Estado:** `OFFICIAL`

Debe enviarse:

```text
multipart/form-data
```

No JSON puro.

---

# 46. Multipart fields

La request contiene:

```text
data
files
```

## `data`

JSON serializado como campo multipart.

## `files`

Uno o más archivos binarios.

---

# 47. Regla crítica: no enviar URL

**Estado:** `OFFICIAL`

La API:

```text
does not expect a URL
```

El documento debe enviarse como:

```text
binary file using multipart/form-data
```

MUST NOT enviar:

```json
{
  "file_url": "https://..."
}
```

como sustituto del upload binario.

---

# 48. Documents — `data` example

```json
{
  "entity_type": "vehicle",
  "related_entity_id": 442100,
  "expiration_date": "2026-03-13 12:00:00.000000",
  "document_type_id": "4a15c62f-0eab-41a1-a1fb-8062d048ad45",
  "files": [
    {
      "original_name": "Documentacion_Retool_Gestion_Documental_TMS.pdf"
    }
  ]
}
```

---

# 49. Document data fields

| Campo | Mandatory | Tipo | Descripción |
|---|:---:|---|---|
| `entity_type` | Sí | String | Tipo de entidad TMS. Valor publicado: `vehicle`. |
| `related_entity_id` | Sí | Integer | ID de entidad relacionada. |
| `document_type_id` | Sí | UUID | ID del tipo de documento configurado. |
| `expiration_date` | No | Timestamp | `YYYY-MM-DD HH:mm:ss.ffffff`. |
| `files` | Sí | Array | Metadata de archivos. |
| `files[].original_name` | Sí | String | Nombre original del archivo. |

---

# 50. Binary multipart field

| Campo | Mandatory | Tipo | Descripción |
|---|:---:|---|---|
| `files` | Sí | File | Binary file(s) enviados por multipart. |

---

# 51. Metadata `files` vs multipart `files`

Hay dos conceptos con el mismo nombre:

## Dentro de `data`

```json
{
  "files": [
    {
      "original_name": "document.pdf"
    }
  ]
}
```

Esto es metadata.

## Multipart real

```text
-F "files=@document.pdf"
```

Esto es el binario.

### Regla crítica

Ambos son necesarios según documentación.

El array metadata NO reemplaza al archivo binario.

---

# 52. `original_name`

**Estado:** `OFFICIAL`

Debe coincidir con:

```text
uploaded binary file name
```

Ejemplo:

```text
data.files[0].original_name = "document.pdf"
multipart filename          = "document.pdf"
```

---

# 53. Múltiples archivos

El texto dice:

```text
one or more files fields
```

y el metadata es array.

Esto confirma soporte conceptual para varios archivos.

### Mapping metadata ↔ binaries

Más allá de nombre original:

```text
NOT_DOCUMENTED
```

No se define índice explícito o file ID.

---

# 54. `document_type_id`

UUID de tipo documental configurado en el sistema.

Endpoint para listar Document Types:

```text
NOT_DOCUMENTED en esta sección
```

Una IA no debe inventarlo.

El ID debe obtenerse de configuración/otra fuente oficial del cliente.

---

# 55. Upsert key

**Estado:** `OFFICIAL`

El POST `/documents/` actúa como upsert cuando ya existe documento para la misma combinación:

```text
entity_type
related_entity_id
document_type_id
```

Key conceptual:

```text
(entity_type, related_entity_id, document_type_id)
```

---

# 56. Upsert behavior

Si no existe combinación:

```text
create document
```

Response:

```text
201
```

Si ya existe:

```text
update expiration_date
```

Response:

```text
200
```

---

# 57. ¿Upsert reemplaza archivo?

La documentación dice que el mismo endpoint puede usarse para:

```text
update expiration_date
```

cuando documento ya existe.

No especifica claramente si un nuevo binario:

- reemplaza archivos anteriores;
- agrega archivos;
- es ignorado;
- es requerido para update.

Estado:

```text
NOT_DOCUMENTED
```

No asumir file replacement semantics.

---

# 58. Expiration Date

Formato oficial:

```text
YYYY-MM-DD HH:mm:ss.ffffff
```

Ejemplo:

```text
2026-03-13 12:00:00.000000
```

Timezone:

```text
NOT_DOCUMENTED
```

No asumir UTC.

---

# 59. `expiration_date` nullable

La creación permite:

```text
expiration_date = optional
```

pero la documentación dice explícitamente:

```text
There is no explicit action to remove an expiration date
(setting expiration_date to null).
Only create or update is supported.
```

### Regla IA

MUST NOT intentar:

```json
{
  "expiration_date": null
}
```

para “borrar” la expiración.

Ese comportamiento no está soportado/documentado.

---

# 60. Documents Upsert — response codes

| Código | Significado |
|---:|---|
| `201` | Successful creation |
| `200` | Successful update |
| `400` | Wrong request |
| `401` | Unauthorized |
| `422` | Payload formatting/validation errors |
| `500` | Server error |

---

# 61. `403` en Documents

No aparece en la tabla Documents.

No asumir que nunca pueda aparecer a nivel gateway, pero no documentarlo como status endpoint-specific.

---

# 62. Update Expiration Date by `document_id`

## Endpoint

```http
POST /documents/{document_id}
```

URL declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1/documents/{document_id}
```

Ejemplo usa `api.simpliroute.com`.

---

# 63. HTTP method de expiration update

Es:

```http
POST
```

NO:

```text
PATCH
PUT
```

Una IA MUST usar el método publicado.

---

# 64. Expiration update request

Se envía como multipart con campo:

```text
data
```

Ejemplo:

```json
{
  "expiration_date": "2026-06-30 12:00:00.000000"
}
```

No se adjunta archivo en el ejemplo.

---

# 65. `expiration_date` required en document-id update

Sí.

Tabla:

```text
expiration_date -> mandatory
```

---

# 66. Document ID

Ejemplo:

```text
0306f5db-ac39-4edb-8f0c-a54369b4381b
```

Tipo observado:

```text
UUID
```

---

# 67. Expiration update status codes

| Código | Significado |
|---:|---|
| `200` | Successful update |
| `400` | Wrong request |
| `401` | Unauthorized |
| `404` | Resource doesn't exist |
| `422` | Payload formatting errors |
| `500` | Server error |

---

# 68. Documents GET

`NOT_DOCUMENTED`.

No se publica:

```http
GET /documents/
GET /documents/{id}
```

No inventarlos.

---

# 69. Documents DELETE

`NOT_DOCUMENTED`.

No se publica forma de eliminar documento.

No inferir desde CRUD convencional.

---

# 70. Remove expiration date

Explícitamente no soportado/documentado.

No inventar endpoint alternativo.

---

# 71. File size limits

`NOT_DOCUMENTED`.

No se publican:

- MB máximos;
- cantidad máxima;
- MIME whitelist;
- extensiones;
- antivirus;
- checksum.

---

# 72. Allowed MIME types

`NOT_DOCUMENTED`.

El ejemplo usa PDF, pero eso no prueba que sólo PDF esté permitido.

---

# 73. Document Type configuration

El ID se describe como:

```text
document type configured in the system
```

No se documenta API de configuración/descubrimiento en esta sección.

---

# 74. Entity types

Tabla visible publica:

```text
vehicle
```

Texto introductorio menciona:

```text
Vehicle or User
```

### Estado

```text
NEEDS_VERIFICATION
```

Regla estricta para IA:

```text
documented enum = ["vehicle"]
```

hasta encontrar tabla que enumere `user`.

---

# 75. Vehicle Block

**Estado:** `OFFICIAL`

Permite bloquear un Vehicle e impedir que sea usado en procesos operativos.

---

# 76. Block Vehicle endpoint

```http
POST /vehicles/{vehicle_id}/block
```

URL con base declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1/vehicles/{vehicle_id}/block
```

Ejemplo:

```text
https://api.simpliroute.com/tms/api/v1/vehicles/442100/block
```

Host:

```text
NEEDS_VERIFICATION
```

---

# 77. Block request body

No existe body.

Ejemplo:

```bash
curl -X POST \
  'https://api.simpliroute.com/tms/api/v1/vehicles/442100/block' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

---

# 78. Block Vehicle path param

| Campo | Mandatory | Tipo | Descripción |
|---|:---:|---|---|
| `vehicle_id` | Sí | Integer | Vehicle ID a bloquear. |

---

# 79. Block status codes

| Código | Significado |
|---:|---|
| `200` | Successful request |
| `401` | Unauthorized |
| `404` | Resource doesn't exist |
| `500` | Server error |

---

# 80. Block idempotency

Comportamiento si Vehicle ya está bloqueado:

```text
NOT_DOCUMENTED
```

No asumir:

- 200;
- 409;
- error;
- no-op.

---

# 81. Consecuencia del bloqueo

La descripción oficial dice:

```text
preventing it from being used in operational processes
```

No define exhaustivamente qué procesos:

- routing;
- planning;
- dispatch;
- tracking;
- TMS assignment.

Estado:

```text
PARTIALLY_DOCUMENTED
```

---

# 82. Unblock Vehicle

Permite reactivar un Vehicle previamente bloqueado para procesos operativos.

---

# 83. Unblock endpoint

```http
POST /vehicles/{vehicle_id}/unblock
```

URL declarada:

```text
https://api-gateway.simpliroute.com/tms/api/v1/vehicles/{vehicle_id}/unblock
```

Ejemplo:

```text
https://api.simpliroute.com/tms/api/v1/vehicles/442100/unblock
```

---

# 84. Unblock request body

Empty.

Headers:

```http
Authorization: Token <TOKEN>
Accept: application/json
```

---

# 85. Unblock path param

```text
vehicle_id
```

Mandatory Integer.

---

# 86. Unblock status codes

| Código | Significado |
|---:|---|
| `200` | Successful request |
| `401` | Unauthorized |
| `404` | Resource doesn't exist |
| `500` | Server error |

---

# 87. Unblock idempotency

Comportamiento si Vehicle ya está desbloqueado:

```text
NOT_DOCUMENTED
```

---

# 88. Vehicle ID consistency

TMS usa:

```text
vehicle_id -> Integer
```

Esto coincide con Vehicles API principal donde Vehicle ID es entero.

Ejemplo:

```text
442100
```

---

# 89. TMS Vehicle vs main Vehicle resource

TMS Block/Unblock opera sobre `vehicle_id` pero NO crea un Vehicle distinto.

Conceptualmente referencia la misma entidad Vehicle.

Estado:

```text
INFERRED from IDs/resource naming
```

---

# 90. Provider assignment vs Vehicle default_driver

Son relaciones completamente distintas:

```text
Vehicle.default_driver
Vehicle <-> TransportationProvider
```

No confundir Provider con Driver/User.

---

# 91. Transportation Provider vs Courier Provider

SimpliRoute también tiene un módulo:

```text
Couriers / Providers
```

fuera de TMS.

`Transportation Provider` de TMS no debe asumirse idéntico a Courier.

Son dominios distintos hasta que documentación lo declare.

---

# 92. Provider contact fields

Campos:

```text
contact_person
contact_email
phone_number
address
```

La documentación no publica:

- email validation;
- phone format;
- max lengths;
- country code requirements.

No inventar validaciones contractuales.

---

# 93. `tax_id_number`

String.

No se publica formato por país.

---

# 94. `legal_name`

Optional String.

No existe relación publicada con `trade_name`.

---

# 95. Update status default

Create declara:

```text
status default = active
```

En PUT, si se omite `status`, comportamiento:

```text
NOT_DOCUMENTED
```

No asumir que se preserva o vuelve a active.

---

# 96. Provider PATCH

`NOT_DOCUMENTED`.

No se publica:

```http
PATCH /transportation-providers/{id}
```

No inventarlo.

---

# 97. Provider bulk create

`NOT_DOCUMENTED`.

Create usa object body.

No asumir array bulk.

---

# 98. Provider bulk delete

`NOT_DOCUMENTED`.

---

# 99. Provider list response schema

La documentación no muestra JSON de response.

Campos devueltos exactos:

```text
NOT_DOCUMENTED
```

Aunque probablemente reflejen modelo de creación más `id`, no inventarlo.

---

# 100. Provider create response schema

Tampoco muestra JSON body.

Sólo status:

```text
201
```

No asumir que devuelve resource completo.

---

# 101. Provider update response schema

No mostrado.

No asumir que devuelve resource completo.

---

# 102. Documents response schema

No se muestra body para 200/201.

No asumir fields como:

```text
id
url
files
created_at
```

---

# 103. Block/Unblock response schema

Sólo status code.

No body documentado.

---

# 104. TMS Error Body

La documentación lista status codes pero no schemas de error.

No asumir:

```json
{
  "message": "..."
}
```

---

# 105. 422 semantics

TMS usa explícitamente:

```text
Payload has formatting errors
```

o:

```text
formatting or validation errors
```

Por tanto 422 debe tratarse como problema de payload/validación.

No retry ciego.

---

# 106. 400 vs 422

Ambos aparecen en TMS.

Interpretación prudente:

```text
400 -> wrong request
422 -> request understood but payload validation/formatting issue
```

Pero la distinción exacta del backend no está documentada.

---

# 107. 401

Documents + Block/Unblock publican:

```text
401 Unauthorized
```

Provider update/delete publican `403` pero no `401`.

Una IA SHOULD soportar ambos.

---

# 108. 403

Transportation Provider Update/Delete:

```text
User without authorization
```

Esto sugiere permisos/roles adicionales posibles.

No se publica matriz de permisos.

---

# 109. TMS account permissions

`NOT_DOCUMENTED`.

No se especifica:

- admin-only;
- scopes;
- roles;
- organization restrictions.

Sólo se exige Token válido y contratación del servicio.

---

# 110. Rate limits

`NOT_DOCUMENTED`.

---

# 111. Pagination

`NOT_DOCUMENTED`.

---

# 112. Timeouts

`NOT_DOCUMENTED`.

---

# 113. Idempotency

No hay política global.

Casos:

```text
POST provider create -> idempotency NOT_DOCUMENTED
POST assignment       -> NOT_DOCUMENTED
POST block            -> NOT_DOCUMENTED
POST unblock          -> NOT_DOCUMENTED
POST documents        -> has explicit UPSERT identity
```

Documents es la única operación donde existe semántica de deduplicación/upsert explícita.

---

# 114. Upsert de Documents no equivale a Idempotency-Key

La key es de negocio:

```text
entity_type
related_entity_id
document_type_id
```

No existe header:

```text
Idempotency-Key
```

documentado.

---

# 115. Ejemplo Create Transportation Provider recomendado

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "trade_name": "Carrier Demo",
    "legal_name": "Carrier Demo S.A.",
    "account_id": 12345,
    "status": "active",
    "contact_person": "Operations Contact",
    "contact_email": "ops@example.com",
    "phone_number": "+5491100000000",
    "address": "Direccion 123",
    "tax_id_number": "TAX-123",
    "reference": "ERP-CARRIER-01"
  }'
```

Datos ficticios.

---

# 116. Ejemplo List Providers

```bash
curl \
  'https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

---

# 117. Ejemplo Retrieve Provider

```bash
curl \
  'https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/<PROVIDER_UUID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

---

# 118. Ejemplo Update Provider

```bash
curl -X PUT \
  'https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/<PROVIDER_UUID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "trade_name": "Carrier Demo",
    "legal_name": "Carrier Demo S.A.",
    "account_id": 12345,
    "status": "active",
    "contact_person": "New Contact",
    "contact_email": "new@example.com",
    "phone_number": "+5491100000000",
    "address": "Direccion 123",
    "tax_id_number": "TAX-123",
    "reference": "ERP-CARRIER-01"
  }'
```

---

# 119. Ejemplo Delete Provider

```bash
curl -X DELETE \
  'https://api-gateway.simpliroute.com/tms/api/v1/transportation-providers/<PROVIDER_UUID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

Expected:

```text
204
```

---

# 120. Ejemplo Assign Provider to Vehicle

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/vehicles/transportation-providers' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '[
    {
      "vehicle_id": 442100,
      "transportation_provider_id": "<PROVIDER_UUID>"
    }
  ]'
```

---

# 121. Ejemplo Document Upsert

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/documents/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json' \
  -F 'data={
    "entity_type": "vehicle",
    "related_entity_id": 442100,
    "expiration_date": "2026-12-31 23:59:59.000000",
    "document_type_id": "<DOCUMENT_TYPE_UUID>",
    "files": [
      {
        "original_name": "insurance.pdf"
      }
    ]
  }' \
  -F 'files=@insurance.pdf'
```

---

# 122. Ejemplo Update Expiration

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/documents/<DOCUMENT_UUID>' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json' \
  -F 'data={
    "expiration_date": "2027-06-30 12:00:00.000000"
  }'
```

---

# 123. Ejemplo Block Vehicle

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/vehicles/442100/block' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

---

# 124. Ejemplo Unblock Vehicle

```bash
curl -X POST \
  'https://api-gateway.simpliroute.com/tms/api/v1/vehicles/442100/unblock' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Accept: application/json'
```

---

# 125. Endpoint inventory

| Método | Endpoint | Propósito |
|---|---|---|
| POST | `/transportation-providers/` | Crear Transportation Provider |
| GET | `/transportation-providers/` | Listar Transportation Providers |
| GET | `/transportation-providers/{id}` | Obtener Provider |
| PUT | `/transportation-providers/{id}` | Actualizar Provider |
| DELETE | `/transportation-providers/{id}` | Eliminar Provider |
| POST | `/vehicles/transportation-providers` | Asignar Provider(s) a Vehicle(s) |
| POST | `/documents/` | Crear/actualizar Document por upsert |
| POST | `/documents/{document_id}` | Actualizar expiration date |
| POST | `/vehicles/{vehicle_id}/block` | Bloquear Vehicle |
| POST | `/vehicles/{vehicle_id}/unblock` | Desbloquear Vehicle |

Base declarada para todos:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

---

# 126. Endpoints NO documentados

No inventar:

```text
PATCH /transportation-providers/{id}
POST /transportation-providers/bulk
DELETE /transportation-providers/bulk
GET /vehicles/transportation-providers
DELETE /vehicles/transportation-providers
GET /documents/
GET /documents/{document_id}
DELETE /documents/{document_id}
PATCH /documents/{document_id}
GET /document-types/
POST /vehicles/{vehicle_id}/status
```

---

# 127. Inconsistencias oficiales detectadas

| Tema | Problema | Estado |
|---|---|---|
| TMS base host | declara `api-gateway`, ejemplos usan `api.simpliroute.com` | `NEEDS_VERIFICATION` |
| Provider Create | `account_id` mandatory pero Basic Request lo omite | `NEEDS_VERIFICATION` |
| Provider Update ES | dice GET; EN dice PUT | `OFFICIAL_TRANSLATION bug` |
| Provider Delete ES | dice GET; EN dice DELETE | `OFFICIAL_TRANSLATION bug` |
| Provider List 200 | description dice “Successful creation” | `OFFICIAL_TEXT typo` |
| Provider Retrieve 200 | description dice “Successful creation” | `OFFICIAL_TEXT typo` |
| Assignment descriptions | copy/paste incorrecto | `OFFICIAL_TABLE typo` |
| Documents entity type | texto menciona User; tabla sólo permite `vehicle` | `NEEDS_VERIFICATION` |
| Documents host | base api-gateway, cURL api.simpliroute.com | `NEEDS_VERIFICATION` |
| Block/Unblock host | misma inconsistencia | `NEEDS_VERIFICATION` |
| Files metadata/binary | mismo nombre `files` para dos niveles | `OFFICIAL` pero requiere cuidado |
| Expiration timezone | no publicada | `NOT_DOCUMENTED` |

---

# 128. Reglas MUST para IA

Una IA MUST:

1. verificar que TMS esté contratado;
2. usar `Authorization: Token ...`;
3. considerar `api-gateway.simpliroute.com/tms/api/v1` como base declarada;
4. registrar que ejemplos usan host alternativo;
5. usar POST para crear Provider;
6. usar GET para list/retrieve;
7. usar PUT para update;
8. usar DELETE para delete;
9. enviar `account_id` cuando implemente Create según tabla formal;
10. tratar Provider ID como UUID;
11. tratar Vehicle ID como Integer;
12. usar array en assignment;
13. enviar Documents como multipart;
14. enviar binarios, no URLs;
15. mantener `original_name` alineado con filename;
16. usar key de upsert `(entity_type, related_entity_id, document_type_id)`;
17. usar formato de expiración publicado;
18. usar POST para update de expiration por document ID;
19. usar POST sin body para block/unblock;
20. manejar 422 como validation/payload error.

---

# 129. Reglas MUST NOT para IA

MUST NOT:

1. asumir que TMS está activo para toda cuenta;
2. usar GET para actualizar Provider por error de traducción;
3. usar GET para eliminar Provider;
4. inventar PATCH Provider;
5. asumir `reference` es único;
6. asumir Provider status enum más allá de `active`;
7. asumir un Vehicle sólo puede tener un Provider;
8. inventar endpoint de unassignment;
9. enviar Document como URL;
10. confundir metadata `files` con binary `files`;
11. enviar `expiration_date: null` esperando borrar fecha;
12. inventar GET/DELETE Documents;
13. inventar API de Document Types;
14. asumir `user` es `entity_type` soportado sólo por texto introductorio;
15. asumir block/unblock son idempotentes;
16. asumir bloqueo sólo afecta optimizer o sólo TMS.

---

# 130. Aspectos NOT_DOCUMENTED

```text
Provider response body schemas
Provider pagination
Provider filters
Provider status enum
Provider reference uniqueness
Provider account_id mismatch behavior
Provider update partial-vs-complete semantics
Provider assignment cardinality
Provider unassignment endpoint
Provider assignment listing
Document response schemas
Document Type discovery API
Document deletion
Document retrieval
Document file replacement semantics on upsert
Document max file count
Document max file size
Document MIME types
Document expiration timezone
Document original filename collision behavior
Document entity types beyond vehicle
Block already-blocked behavior
Unblock already-unblocked behavior
Exact processes disabled by block
TMS rate limits
TMS timeouts
TMS idempotency beyond document upsert
TMS permission/role matrix
```

---

# 131. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones verificadas:

```text
TMS: Transportation provider
Creation Request
List Request
Retrieve resource Request
Update Request
Delete Request
Assign Transportation Provider to Vehicle

TMS: Documents
Creation / Update Request (Upsert)
Update Expiration Date Request (By document_id)

TMS: Vehicles – Block / Unblock
Block Vehicle Request
Unblock Vehicle Request
```

Hechos clave confirmados:

```text
TMS contracted-service requirement
declared api-gateway base URL
Token authentication
Transportation Provider CRUD
Provider create fields/defaults
specific HTTP codes
Vehicle/provider bulk relation endpoint
Documents multipart binary upload
Documents upsert key
201 create / 200 update
expiration date update endpoint
Block/Unblock endpoints
```

Fecha:

```text
2026-08-10
```

---

# 132. Estado final

**ETAPA 9 COMPLETADA**

Cobertura:

```text
TMS Transportation Providers
Provider CRUD
Provider ↔ Vehicle assignment
TMS Documents
multipart file upload
Document upsert
expiration dates
Vehicle Block
Vehicle Unblock
TMS errors/statuses
host/documentation inconsistencies
```

La siguiente etapa recomendada es:

```text
10-gps-integration.md
```

Deberá cubrir:

- GPS integration;
- ingest endpoint si está públicamente disponible;
- frecuencia de envío;
- pérdida de señal;
- reenvío/buffering;
- payload GPS;
- latitude/longitude;
- timestamps;
- vehicleId;
- providerName;
- temperature;
- alert object;
- catálogo de alerts;
- restricciones;
- tipos;
- edge cases;
- partes que requieren Professional Services.
