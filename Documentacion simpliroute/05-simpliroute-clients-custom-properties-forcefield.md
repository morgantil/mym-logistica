# SimpliRoute Public API — Etapa 5: Clients, Custom Properties y ForceField

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API principal:** `https://api.simpliroute.com`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre exhaustivamente la superficie pública oficial encontrada para:

- Clients;
- creación de clientes;
- obtención por `key`;
- eliminación individual;
- eliminación masiva;
- actualización masiva;
- custom properties de cliente;
- creación de custom property;
- uso de custom properties;
- ForceField;
- addon `territory_planner`;
- `sales_visit_scheduled`;
- `scheduled_visit_days`;
- tipos, payloads, responses;
- ambigüedades y reglas para agentes de IA.

Debe utilizarse junto con las etapas anteriores.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción técnica, no garantía contractual. |
| `NOT_DOCUMENTED` | No definido públicamente. |
| `NEEDS_VERIFICATION` | Existe ambigüedad o inconsistencia documental. |

---

# 3. Qué es un Client

**Estado:** `OFFICIAL`

SimpliRoute define un Client/Customer como:

```text
an individual or company
```

y lo presenta como un usuario final del servicio/logística.

Los Clients conforman un:

```text
client master
```

dentro de la cuenta de SimpliRoute.

Este maestro puede integrarse con ERP externos.

---

# 4. Familia principal de Clients

Endpoint base:

```text
/v1/accounts/clients/
```

Operaciones publicadas:

```http
POST   /v1/accounts/clients/
GET    /v1/accounts/clients/?key={CLIENT_KEY}
DELETE /v1/accounts/clients/{CLIENT_ID}/
DELETE /v1/accounts/clients/
PUT    /v1/accounts/clients/
```

Además:

```http
POST /v1/planner/client-properties/
```

para crear definiciones de custom properties.

---

# 5. Crear Clients

## Endpoint

```http
POST /v1/accounts/clients/
```

URL:

```text
https://api.simpliroute.com/v1/accounts/clients/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

---

# 6. Root del body de creación

**Estado:** `OFFICIAL_EXAMPLE`

El body publicado es un array:

```json
[
  {
    "...": "..."
  }
]
```

Esto permite conceptualmente crear múltiples Clients en una misma llamada.

### Máximo batch

`NOT_DOCUMENTED`.

---

# 7. Create Client — ejemplo oficial representativo

```json
[
  {
    "key": "8ede248f-8f2c-4f64-8f82-e25ec097f565",
    "title": "Torp, Lindgren and Bosco",
    "address": "8223 Langworth Creek",
    "latitude": -33.464115,
    "longitude": -70.652859,
    "load": 1,
    "load_2": 1,
    "load_3": 1,
    "window_start": null,
    "window_end": null,
    "window_start_2": null,
    "window_end_2": null,
    "duration": "00:00:10",
    "contact_name": "Dell",
    "contact_phone": "721-922-0694",
    "contact_email": "example@example.com",
    "notes": "",
    "priority_level": null,
    "skills_required": [64915, 64916, 64917],
    "skills_optional": [64915, 64916, 64917],
    "tags": [3705]
  }
]
```

---

# 8. Client fields publicados

La documentación no incluye una tabla formal completa de atributos del Client, pero los ejemplos oficiales demuestran los siguientes campos.

| Campo | Tipo observado | Descripción |
|---|---|---|
| `id` | Integer | ID interno de Client; aparece al recuperar/actualizar. |
| `key` | String | Identificador externo/del cliente. |
| `title` | String | Nombre o título del Client. |
| `address` | String | Dirección. |
| `latitude` | Number/String/null | Latitud. |
| `longitude` | Number/String/null | Longitud. |
| `load` | Number/String/null | Primera dimensión de carga. |
| `load_2` | Number/String/null | Segunda dimensión de carga. |
| `load_3` | Number/String/null | Tercera dimensión de carga. |
| `window_start` | Time/null | Inicio de ventana 1. |
| `window_end` | Time/null | Fin de ventana 1. |
| `window_start_2` | Time/null | Inicio de ventana 2. |
| `window_end_2` | Time/null | Fin de ventana 2. |
| `duration` | String time | Duración esperada. |
| `contact_name` | String/null | Contacto. |
| `contact_phone` | String/null | Teléfono. |
| `contact_email` | String/null | Email. |
| `notes` | String/null | Notas. |
| `priority_level` | Integer/null | Prioridad. |
| `skills_required` | Integer array | Skill IDs obligatorias. |
| `skills_optional` | Integer array | Skill IDs opcionales. |
| `tags` | Integer array | Tag IDs. |
| `visit_type` | String/null | Tipo de visita. |
| `status` | String | Estado, observado en actualización. |
| `custom_properties` | Object | Custom properties del cliente. |
| `sales_visit_scheduled` | Object | ForceField: ciclo/frecuencia de visitas. |
| `scheduled_visit_days` | Object | ForceField: días/semana programados. |

---

# 9. Required fields

**Estado:** `NOT_DOCUMENTED`

La sección Clients no publica una tabla de campos obligatorios.

No extrapolar automáticamente las reglas de Visit:

```text
Visit requires title/address/planned_date
```

a Client, porque son recursos diferentes.

---

# 10. `key`

El Client usa:

```text
key
```

y el endpoint de obtención filtra por:

```text
?key=...
```

Esto lo convierte en un identificador externo relevante para integración con ERP.

Ejemplo:

```json
{
  "key": "123456"
}
```

## Unicidad

`NOT_DOCUMENTED`.

Aunque parece funcionar como identificador externo, la documentación no declara explícitamente:

```text
UNIQUE(key)
```

Una IA MUST NOT asumir una constraint de unicidad sin manejar posibles múltiples resultados.

---

# 11. Client `id`

Al obtener Clients aparece:

```json
{
  "id": 68156
}
```

Ese ID es utilizado para:

```http
DELETE /v1/accounts/clients/{CLIENT_ID}/
```

y para update/delete masivos.

Modelo recomendado:

```text
Client.id  -> internal SimpliRoute ID
Client.key -> external/business identifier
```

La interpretación anterior es `INFERRED` pero fuertemente respaldada por endpoints y ejemplos.

---

# 12. Coordenadas

Create example:

```json
{
  "latitude": -33.464115,
  "longitude": -70.652859
}
```

Obtain example:

```json
{
  "latitude": "-33.464115",
  "longitude": "-70.652859"
}
```

ForceField example:

```json
{
  "latitude": "-33.047400",
  "longitude": "-71.612920"
}
```

Estado:

```text
NEEDS_VERIFICATION
```

### Regla IA

- en lectura, aceptar strings numéricos;
- no asumir un único JSON type global;
- en escritura, respetar el shape publicado para el flujo específico.

---

# 13. Loads

Campos:

```text
load
load_2
load_3
```

Ejemplos usan:

```json
1
```

```json
4.0
```

y también:

```json
"4"
```

en ForceField.

Estado:

```text
NEEDS_VERIFICATION para type normalization
```

Conceptualmente corresponden a capacidades/cargas.

No asumir unidad física.

---

# 14. Time Windows

Campos:

```text
window_start
window_end
window_start_2
window_end_2
```

Formato observado:

```text
HH:mm:ss
```

Ejemplo:

```json
{
  "window_start": "09:00:00",
  "window_end": "17:00:00"
}
```

Pueden ser:

```json
null
```

---

# 15. Duration

Ejemplo:

```text
00:00:10
```

y:

```text
00:00:00
```

Formato observado:

```text
HH:mm:ss
```

---

# 16. Priority Level

Client acepta:

```text
priority_level
```

Ejemplos:

```json
{
  "priority_level": null
}
```

La semántica general de priority_level fue documentada en Visits.

La sección Clients no redefine el enum.

---

# 17. Skills

Client puede almacenar:

```text
skills_required
skills_optional
```

Ejemplo:

```json
{
  "skills_required": [64915, 64916],
  "skills_optional": [64917]
}
```

IDs deben provenir del catálogo oficial:

```http
GET /v1/routes/skills/
```

---

# 18. Tags

Client soporta:

```text
tags
```

como array de IDs.

Los Tags se descubren mediante:

```http
GET /v1/routes/tags/
```

---

# 19. Client Master y ERP

**Estado:** `OFFICIAL`

SimpliRoute explica que POST de Clients genera el maestro de clientes para la cuenta y permite conexión con web services/ERP.

La documentación contiene una frase ambigua:

```text
Each main Client must have its own token
```

### Estado

`NEEDS_VERIFICATION`

No debe interpretarse automáticamente como:

```text
cada registro final de Client necesita API Token
```

porque la autenticación general es por cuenta y los Client records no contienen campo token.

La frase parece referirse a cuentas/clientes principales de SimpliRoute, no a cada end customer.

---

# 20. Create Client — response

Ejemplo:

```json
[
  {
    "key": "123456",
    "title": "Coop Enargas",
    "address": "",
    "latitude": null,
    "longitude": null,
    "load": null,
    "load_2": 0.0,
    "load_3": 0.0,
    "window_start": null,
    "window_end": null,
    "window_start_2": null,
    "window_end_2": null,
    "duration": "00:00:00",
    "contact_name": null,
    "contact_phone": null,
    "contact_email": null,
    "notes": null,
    "priority_level": null,
    "skills_required": [30744, 47593],
    "skills_optional": [30567],
    "tags": []
  }
]
```

### Nota

El ejemplo de creación no devuelve `id`.

Esto no significa que nunca se devuelva; sólo que no aparece en ese ejemplo.

Una IA MUST NOT depender de `id` en response de create si no lo verifica.

---

# 21. Obtener Clients

## Endpoint

```http
GET /v1/accounts/clients/?key={CLIENT_ID}
```

La documentación usa nombre de placeholder:

```text
CLIENT_ID
```

pero el query param real se llama:

```text
key
```

Ejemplo conceptual:

```http
GET /v1/accounts/clients/?key=123456
```

---

# 22. Inconsistencia `CLIENT_ID` vs `key`

**Estado:** `NEEDS_VERIFICATION`

Heading:

```text
?key={{CLIENT_ID}}
```

pero response tiene:

```text
id
key
```

y DELETE individual usa realmente Client ID en path.

### Regla IA

En:

```http
GET /v1/accounts/clients/?key=...
```

el valor debe tratarse como:

```text
Client.key
```

no necesariamente como:

```text
Client.id
```

---

# 23. Obtain Clients — response

```json
[
  {
    "id": 68156,
    "key": "123456",
    "title": "Cliente Ejemplo",
    "address": "Pedro Montt 2245, Valparaíso, V Región",
    "latitude": "-33.464115",
    "longitude": "-70.652859",
    "load": 4.0,
    "load_2": 2.0,
    "load_3": 1.0,
    "window_start": "09:00:00",
    "window_end": "17:00:00",
    "window_start_2": null,
    "window_end_2": null,
    "duration": "00:00:00",
    "contact_name": "",
    "contact_phone": "",
    "contact_email": "example@example.com",
    "notes": "Notas de Texto",
    "priority_level": null
  }
]
```

Root:

```text
Array
```

aunque se filtra por una key.

---

# 24. Uso del Client para generar Visits

**Estado:** `OFFICIAL`

SimpliRoute afirma que a través de GET Client puede obtenerse la información y el ID del Client, y con esa información pueden generarse Visits.

Esto establece relación conceptual:

```text
Client master -> Visit creation
```

Pero no existe en esta sección un endpoint:

```text
POST /clients/{id}/visits
```

No inventarlo.

---

# 25. Delete individual Client

## Endpoint

```http
DELETE /v1/accounts/clients/{CLIENT_ID}/
```

El path usa el ID interno.

Request body:

`NOT_DOCUMENTED`.

Response/status:

`NOT_DOCUMENTED`.

---

# 26. Bulk Delete Clients

## Endpoint

```http
DELETE /v1/accounts/clients/
```

Sí: el mismo collection endpoint utiliza `DELETE` con body.

Body:

```json
[
  827374,
  929382
]
```

La documentación declara explícitamente:

```text
The array must have the id of the clients that you want to delete.
```

---

# 27. DELETE con body

Esta API demuestra un caso importante:

```http
DELETE /v1/accounts/clients/
Content-Type: application/json
```

con JSON body.

Una IA/client HTTP MUST permitir body en DELETE para esta operación.

No reemplazar automáticamente por query params.

---

# 28. Bulk Delete size

`NOT_DOCUMENTED`.

No existe máximo público de IDs por llamada.

---

# 29. Update Clients

## Endpoint

```http
PUT /v1/accounts/clients/
```

Propósito oficial:

```text
updating multiple clients' information
```

Root:

```text
Array
```

---

# 30. Update Client — ejemplo

```json
[
  {
    "id": 9882409,
    "key": "168ee4c4-18bc-4537-ac34-6c3a27433698",
    "title": "client_17382015909693",
    "address": "Av. Pedro de Valdivia 2785",
    "latitude": null,
    "longitude": null,
    "load": 1.0,
    "load_2": 1.0,
    "load_3": 1.0,
    "window_start": null,
    "window_end": null,
    "window_start_2": null,
    "window_end_2": null,
    "duration": "00:00:10",
    "contact_name": "",
    "contact_phone": "",
    "contact_email": "",
    "notes": "",
    "priority_level": null,
    "skills_required": [
      64703,
      64704,
      65422,
      65423
    ],
    "skills_optional": [
      64703,
      64704,
      65422,
      65423
    ],
    "visit_type": "validator_telefonica",
    "tags": [
      3697,
      3698
    ],
    "status": "active"
  }
]
```

---

# 31. `status`

Ejemplo de update:

```text
active
```

Enum completo:

`NOT_DOCUMENTED`.

No inventar:

```text
inactive
deleted
blocked
```

---

# 32. PUT semantics de Clients

La documentación dice que el endpoint actualiza múltiples Clients, pero no define explícitamente:

```text
partial vs complete replacement
```

aunque el método es PUT.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla IA

No asumir que omitir un campo conserva su valor.

Para updates, enviar todos los datos relevantes conocidos del Client cuando sea posible.

---

# 33. PATCH Clients

`NOT_DOCUMENTED`.

No existe endpoint PATCH público en la sección.

No inventarlo.

---

# 34. Client Custom Properties

**Estado:** `OFFICIAL`

Las Custom Properties permiten agregar atributos adicionales a Clients.

Flujo oficial:

```text
1. crear definición de custom property en la cuenta
2. usar esa property al crear o modificar Clients
```

---

# 35. Crear Custom Property

## Endpoint

```http
POST /v1/planner/client-properties/
```

Headers:

```http
Authorization: Token <TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "label": "cliente_properties_integer",
  "type": "int"
}
```

---

# 36. Custom Property definition fields

| Campo | Tipo | Descripción |
|---|---|---|
| `label` | String | Nombre de la custom property. |
| `type` | String | Tipo de dato. |

Tipos oficialmente publicados:

```text
str
int
float
bool
```

---

# 37. Custom Property type enum

Enum exacto:

```text
str
int
float
bool
```

Una IA MUST NOT inventar:

```text
date
datetime
json
array
decimal
```

si no existe documentación adicional.

---

# 38. Response de Create Custom Property

`NOT_DOCUMENTED`.

La sección no muestra response ni ID generado.

---

# 39. List Custom Properties

`NOT_DOCUMENTED`.

No se publica endpoint GET para:

```text
/v1/planner/client-properties/
```

aunque podría existir internamente.

MUST NOT inventarlo.

---

# 40. Update/Delete Custom Property

No se publican:

```text
PUT
PATCH
DELETE
```

para definiciones.

No inventarlos.

---

# 41. Usar Custom Properties

Client creation/update puede contener:

```json
{
  "custom_properties": {
    "cliente_properties_string": 2123123123.32,
    "cliente_properties_bool": "dasdas",
    "cliente_properties_integer": 333,
    "cliente_properties_float": 232.3
  }
}
```

---

# 42. Inconsistencia crítica de tipos en ejemplo Custom Properties

**Estado:** `NEEDS_VERIFICATION`

La definición permite:

```text
str
int
float
bool
```

pero el ejemplo oficial usa valores aparentemente incompatibles:

```text
cliente_properties_string -> number
cliente_properties_bool   -> string
```

Por ejemplo:

```json
{
  "cliente_properties_string": 2123123123.32,
  "cliente_properties_bool": "dasdas"
}
```

### Regla IA

No usar ese ejemplo como prueba de coerción aceptada.

Para producción, SHOULD enviar valores compatibles con el `type` definido:

```text
str   -> JSON string
int   -> JSON integer
float -> JSON number
bool  -> JSON boolean
```

El comportamiento exacto de coerción/validación del servidor es:

```text
NOT_DOCUMENTED
```

---

# 43. Naming de Custom Properties

La key dentro de:

```text
custom_properties
```

coincide conceptualmente con el `label` creado.

Ejemplo:

Create definition:

```json
{
  "label": "cliente_properties_integer",
  "type": "int"
}
```

Use:

```json
{
  "custom_properties": {
    "cliente_properties_integer": 333
  }
}
```

Estado:

```text
OFFICIAL_EXAMPLE
```

---

# 44. Required custom property

No se documenta concepto de:

```text
required
nullable
default
```

para client custom properties.

---

# 45. ForceField

**Estado:** `OFFICIAL`

ForceField agrega atributos de planificación periódica de Clients.

Utiliza el mismo endpoint de creación:

```http
POST /v1/accounts/clients/
```

No es una API separada.

---

# 46. Requisito del addon

Para usar ForceField:

```text
territory_planner addon
```

debe estar activado.

Por tanto:

```text
ForceField publicly documented != enabled for every account
```

---

# 47. Nuevos atributos de ForceField

SimpliRoute declara explícitamente:

```text
sales_visit_scheduled
scheduled_visit_days
```

Se pueden utilizar en endpoints de:

```text
creating Clients
modifying Clients
retrieving Clients
```

---

# 48. ForceField Create example

```json
[
  {
    "key": "SFKK8976678",
    "title": "Cliente Ejemplo",
    "address": "Pedro Montt 2246, Valparaíso, V Región, Chile",
    "latitude": "-33.047400",
    "longitude": "-71.612920",
    "skills_required": [],
    "skills_optional": [],
    "load": "4",
    "load_2": "2",
    "load_3": "1",
    "window_start": "09:00:00",
    "window_end": "17:00:00",
    "window_start_2": null,
    "window_end_2": null,
    "duration": "00:00:00",
    "contact_name": "Cliente",
    "contact_email": "example@example.com",
    "contact_phone": "56995466337",
    "tags": [],
    "visit_type": null,
    "notes": "The doorbell is faulty",
    "priority_level": null,
    "sales_visit_scheduled": {
      "period": 7,
      "interval": 4,
      "frequency": 2
    },
    "scheduled_visit_days": {
      "any_week": [
        "Monday",
        "Tuesday"
      ]
    },
    "custom_properties": {
      "price": 100,
      "currency": "USD"
    }
  }
]
```

---

# 49. Sales Visit Schedule Object

Campos oficiales:

| Campo | Tipo | Descripción |
|---|---|---|
| `frequency` | Integer | Número de veces que el Client debe ser visitado dentro del período. |
| `period` | Integer | Duración del ciclo de visitas. |
| `interval` | Integer | Separación temporal entre visitas. |
| `seller` | Integer | Quién realiza la visita; puede ser seller o vehicle. |

---

# 50. `period`

Valores oficiales:

| Valor | Significado |
|---:|---|
| `7` | Weekly |
| `14` | Biweekly |
| `28` | Monthly |

Enum numérico:

```text
7
14
28
```

Una IA MUST NOT enviar otros valores como contrato soportado sin evidencia.

---

# 51. `frequency`

Representa:

```text
number of times a client should be visited within a given period
```

Ejemplo:

```json
{
  "period": 7,
  "frequency": 2
}
```

Conceptualmente:

```text
2 visits in a 7-day cycle
```

---

# 52. `interval`

La documentación define:

```text
time gap between visits
```

pero no declara explícitamente la unidad.

Ejemplo:

```json
{
  "period": 7,
  "interval": 4,
  "frequency": 2
}
```

Estado:

```text
NOT_DOCUMENTED unit
```

No asumir formalmente "days" aunque sea probable por contexto.

---

# 53. `seller`

Tipo:

```text
Integer
```

Descripción oficial:

```text
who conducts the visit, which can be either a seller or a vehicle
```

### Ambigüedad

Un único integer puede referir a:

```text
Seller ID
or Vehicle ID
```

La documentación no explica discriminador adicional.

Estado:

```text
NEEDS_VERIFICATION
```

Una IA MUST conocer el contexto/configuración de Territory Planner antes de asignar este campo.

---

# 54. `seller` no aparece en los ejemplos de ForceField

La tabla define `seller`, pero los payloads de ejemplo de `sales_visit_scheduled` contienen sólo:

```text
period
interval
frequency
```

Por tanto:

```text
seller optionality = NOT_DOCUMENTED
```

---

# 55. Scheduled Visit Days Object

Este objeto define días de semana en los cuales un Client debe tener visitas programadas.

Atributos:

```text
any_week
week_1
week_2
week_3
week_4
```

Cada atributo contiene array de nombres de días.

---

# 56. Day enum

Valores oficiales:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Copiar exactamente casing/spelling.

Case-insensitive support:

`NOT_DOCUMENTED`.

---

# 57. `any_week`

Usado:

```text
when there is no predefined week
```

Ejemplo:

```json
{
  "scheduled_visit_days": {
    "any_week": [
      "Monday",
      "Tuesday"
    ]
  }
}
```

---

# 58. `week_1`

Primera semana del mes.

```json
{
  "week_1": [
    "Monday",
    "Wednesday"
  ]
}
```

---

# 59. `week_2`

Segunda semana del mes.

---

# 60. `week_3`

Tercera semana del mes.

Ejemplo oficial:

```json
{
  "scheduled_visit_days": {
    "week_3": [
      "Monday",
      "Tuesday",
      "Sunday"
    ]
  }
}
```

---

# 61. `week_4`

Cuarta semana del mes.

---

# 62. Semana 5

`NOT_DOCUMENTED`.

No existe atributo publicado:

```text
week_5
```

Una IA MUST NOT inventarlo.

---

# 63. Combinación `any_week` + `week_N`

La documentación no explica si pueden coexistir en un mismo objeto.

Estado:

```text
NOT_DOCUMENTED
```

No asumir precedencia.

---

# 64. Scheduled day duplicates

Comportamiento de:

```json
["Monday", "Monday"]
```

`NOT_DOCUMENTED`.

Un cliente SHOULD deduplicar localmente.

---

# 65. ForceField segundo ejemplo

```json
{
  "sales_visit_scheduled": {
    "period": 28,
    "interval": 1,
    "frequency": 3
  },
  "scheduled_visit_days": {
    "week_3": [
      "Monday",
      "Tuesday",
      "Sunday"
    ]
  }
}
```

Esto demuestra explícitamente:

```text
monthly cycle + specific week bucket
```

---

# 66. Custom Properties dentro de ForceField example

Ejemplo:

```json
{
  "custom_properties": {
    "price": 100,
    "currency": "USD"
  }
}
```

### Problema documental

No se muestra previamente la creación de definiciones:

```text
price
currency
```

mediante `/v1/planner/client-properties/`.

Por regla general oficial, las custom properties deben crearse primero.

Una IA SHOULD asumir que esas definiciones ya existen en la cuenta del ejemplo.

---

# 67. ForceField retrieval

La documentación dice que los atributos pueden usarse en:

```text
retrieving Clients
```

pero el ejemplo Obtain Clients mostrado antes no incluye ForceField.

### Shape exacto del response

`PARTIALLY_DOCUMENTED`.

Se espera conceptualmente que aparezcan los mismos objetos, pero no existe response completo de ejemplo en ForceField.

---

# 68. ForceField update

La documentación dice que pueden usarse en:

```text
modifying Clients
```

El endpoint de modificación publicado es:

```http
PUT /v1/accounts/clients/
```

No existe endpoint ForceField PATCH separado.

---

# 69. Territory Planner availability

Si el addon no está activado:

```text
behavior/error status = NOT_DOCUMENTED
```

No inventar `403`, `400`, etc.

---

# 70. Ejemplo de creación de Client normal

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounts/clients/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "key": "ERP-CUST-1001",
      "title": "Cliente 1001",
      "address": "Av. Ejemplo 123",
      "latitude": -34.6037,
      "longitude": -58.3816,
      "load": 2,
      "load_2": 0,
      "load_3": 0,
      "window_start": "09:00:00",
      "window_end": "17:00:00",
      "duration": "00:10:00",
      "contact_name": "Contacto",
      "contact_phone": "+5491100000000",
      "contact_email": "contact@example.com",
      "notes": "",
      "priority_level": null,
      "skills_required": [],
      "skills_optional": [],
      "tags": []
    }
  ]'
```

Valores ficticios.

---

# 71. Ejemplo Obtain Client

```bash
curl \
  'https://api.simpliroute.com/v1/accounts/clients/?key=ERP-CUST-1001' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 72. Ejemplo Delete individual

```bash
curl -X DELETE \
  'https://api.simpliroute.com/v1/accounts/clients/<CLIENT_ID>/' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 73. Ejemplo Bulk Delete

```bash
curl -X DELETE \
  'https://api.simpliroute.com/v1/accounts/clients/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[12345, 67890]'
```

---

# 74. Ejemplo Bulk Update

```bash
curl -X PUT \
  'https://api.simpliroute.com/v1/accounts/clients/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "id": 12345,
      "key": "ERP-CUST-1001",
      "title": "Cliente actualizado",
      "address": "Av. Ejemplo 999",
      "latitude": null,
      "longitude": null,
      "load": 2,
      "load_2": 0,
      "load_3": 0,
      "window_start": "09:00:00",
      "window_end": "17:00:00",
      "window_start_2": null,
      "window_end_2": null,
      "duration": "00:10:00",
      "contact_name": "Contacto",
      "contact_phone": "+5491100000000",
      "contact_email": "contact@example.com",
      "notes": "",
      "priority_level": null,
      "skills_required": [],
      "skills_optional": [],
      "tags": [],
      "status": "active"
    }
  ]'
```

---

# 75. Ejemplo Create Custom Property

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/planner/client-properties/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "label": "segment_id",
    "type": "str"
  }'
```

---

# 76. Ejemplo Client con Custom Properties

```json
[
  {
    "key": "ERP-CUST-1002",
    "title": "Cliente 1002",
    "address": "Dirección",
    "custom_properties": {
      "segment_id": "PREMIUM",
      "visit_count": 12,
      "customer_score": 8.75,
      "requires_signature": true
    }
  }
]
```

Este ejemplo sólo es válido si previamente existen las definiciones correspondientes con tipos compatibles.

---

# 77. Ejemplo ForceField

```json
[
  {
    "key": "ERP-CUST-FF-001",
    "title": "Cliente ForceField",
    "address": "Dirección",
    "sales_visit_scheduled": {
      "period": 7,
      "interval": 4,
      "frequency": 2
    },
    "scheduled_visit_days": {
      "any_week": [
        "Monday",
        "Tuesday"
      ]
    }
  }
]
```

Requiere:

```text
territory_planner addon
```

---

# 78. Flujo recomendado ERP → Client Master

```text
ERP customer
   |
   | map external customer id -> key
   v
POST /v1/accounts/clients/
   |
   v
Client Master in SimpliRoute
   |
   +--> GET ?key=...
   |
   +--> PUT bulk update
   |
   +--> DELETE individual/bulk
   |
   +--> Use Client data to create Visits
```

---

# 79. Flujo recomendado Custom Properties

```text
1. Definir atributos requeridos por integración.

2. Por cada atributo:
   POST /v1/planner/client-properties/
     label
     type

3. Crear/actualizar Client:
   custom_properties = {
     label: value
   }

4. Mantener tipos compatibles con definición.
```

---

# 80. Flujo recomendado ForceField

```text
PRECONDITION:
  territory_planner enabled

Client
   |
   +--> sales_visit_scheduled
   |      period
   |      interval
   |      frequency
   |      seller (si aplica)
   |
   +--> scheduled_visit_days
          any_week / week_1..week_4
```

---

# 81. Relación Client ↔ Visit

Client contiene campos muy similares a Visit:

```text
title
address
latitude
longitude
load*
windows
duration
contact*
skills*
tags
priority_level
visit_type
```

Esto facilita usar el master como template para generar Visits.

### Pero

Client != Visit.

Client no tiene:

```text
planned_date
route
checkout
tracking_id
```

como parte del ejemplo base.

No intercambiar DTOs directamente.

---

# 82. `key` vs Visit `reference`

Para integración ERP suele ser tentador mapear:

```text
Client.key
Visit.reference
```

pero esa relación no está declarada automáticamente por SimpliRoute.

Debe ser decisión de integración.

Estado:

```text
INFERRED / APP DESIGN
```

---

# 83. IDs de Custom Properties

La API pública de creación no muestra ID de custom property.

Por tanto, el uso se realiza documentalmente por:

```text
label/key name
```

No inventar IDs.

---

# 84. Validación de type de Custom Property

Contrato deseable:

```text
str   -> string
int   -> integer
float -> number
bool  -> boolean
```

Pero debido al ejemplo inconsistente, el comportamiento de coerción servidor es:

```text
NEEDS_VERIFICATION
```

### Regla segura

Enviar tipos correctos, nunca depender de coerción.

---

# 85. Status codes

Las secciones Clients no publican success/error status codes endpoint-specific.

Por tanto:

| Endpoint | Status exacto |
|---|---|
| POST clients | `NOT_DOCUMENTED` |
| GET clients | `NOT_DOCUMENTED` |
| DELETE client | `NOT_DOCUMENTED` |
| DELETE clients bulk | `NOT_DOCUMENTED` |
| PUT clients | `NOT_DOCUMENTED` |
| POST custom property | `NOT_DOCUMENTED` |

Aplican errores globales documentados en Etapa 1.

---

# 86. Pagination

Para:

```http
GET /v1/accounts/clients/?key=...
```

no se documenta paginación.

No existe endpoint general listado sin filter documentado en esta sección como referencia de paginación.

No extrapolar Datamart.

---

# 87. Client listing completo

La documentación sólo demuestra:

```text
GET /v1/accounts/clients/?key=...
```

No declara explícitamente:

```text
GET /v1/accounts/clients/
```

como list-all, aunque el path base podría sugerirlo.

MUST NOT documentarlo como endpoint oficial hasta confirmación explícita.

---

# 88. Filters adicionales

No se publican:

```text
title=
status=
address=
tag=
skill=
```

No inventarlos.

---

# 89. Sorting

`NOT_DOCUMENTED`.

---

# 90. Batch create size

`NOT_DOCUMENTED`.

---

# 91. Batch update size

`NOT_DOCUMENTED`.

---

# 92. Batch delete size

`NOT_DOCUMENTED`.

---

# 93. Client delete cascade

No se documenta qué ocurre con Visits existentes vinculadas conceptualmente a un Client cuando se elimina el Client master.

No asumir cascade.

---

# 94. Custom Property delete impact

No existe delete público documentado.

No inventar comportamiento.

---

# 95. ForceField-generated visits

La sección define programación pero no publica aquí:

```text
cómo/cuándo se materializan las Visits
qué endpoint las genera
si se crean automáticamente
qué zona horaria usa el scheduler
```

Estado:

```text
NOT_DOCUMENTED
```

No programar un generador externo suponiendo que reemplaza lógica de SimpliRoute sin confirmación.

---

# 96. Frequency consistency

La documentación no publica reglas como:

```text
frequency <= period
interval * frequency <= period
```

No inventarlas como validaciones oficiales.

Un integrador puede aplicar reglas de negocio propias, pero deben separarse del contrato SimpliRoute.

---

# 97. scheduled_visit_days consistency

No se explica si:

```text
frequency
```

debe coincidir exactamente con cantidad de días listados.

Ejemplo:

```text
frequency=2
any_week=[Monday, Tuesday]
```

coincide, pero eso no prueba constraint universal.

Estado:

```text
NOT_DOCUMENTED
```

---

# 98. `period=28` y week buckets

Ejemplo oficial usa:

```text
period=28
week_3
```

Esto confirma que un ciclo de 28 días puede usar semana específica.

---

# 99. `period=7` y any_week

Ejemplo oficial usa:

```text
period=7
any_week
```

Confirma este patrón.

Otros patrones:

`NOT_DOCUMENTED`.

---

# 100. Endpoint inventory

| Método | Endpoint | Propósito |
|---|---|---|
| POST | `/v1/accounts/clients/` | Crear uno o múltiples Clients |
| GET | `/v1/accounts/clients/?key={CLIENT_KEY}` | Obtener Clients por key |
| DELETE | `/v1/accounts/clients/{CLIENT_ID}/` | Eliminar un Client |
| DELETE | `/v1/accounts/clients/` | Eliminar múltiples Clients por IDs |
| PUT | `/v1/accounts/clients/` | Actualizar múltiples Clients |
| POST | `/v1/planner/client-properties/` | Crear definición de Custom Property |

ForceField reutiliza:

```http
POST /v1/accounts/clients/
PUT  /v1/accounts/clients/
GET  /v1/accounts/clients/?key=...
```

según la documentación descriptiva.

---

# 101. Endpoints NO documentados

No inventar:

```text
PATCH /v1/accounts/clients/
PATCH /v1/accounts/clients/{id}/
PUT /v1/accounts/clients/{id}/
GET /v1/accounts/clients/{id}/
GET /v1/planner/client-properties/
PUT /v1/planner/client-properties/{id}/
PATCH /v1/planner/client-properties/{id}/
DELETE /v1/planner/client-properties/{id}/
POST /v1/accounts/clients/{id}/visits/
```

---

# 102. Inconsistencias detectadas

| Tema | Problema | Estado |
|---|---|---|
| Obtain placeholder | dice CLIENT_ID, query real es `key` | `NEEDS_VERIFICATION` |
| `key` uniqueness | no declarada | `NOT_DOCUMENTED` |
| Coordinates | numbers en create, strings en GET | `NEEDS_VERIFICATION` |
| Loads | number y string según ejemplo | `NEEDS_VERIFICATION` |
| PUT semantics | no aclara partial vs replace | `NEEDS_VERIFICATION` |
| Custom property values | ejemplo viola tipos nominales | `NEEDS_VERIFICATION` |
| ForceField seller | puede ser seller o vehicle con mismo Integer | `NEEDS_VERIFICATION` |
| ForceField interval | unidad no declarada | `NOT_DOCUMENTED` |
| ForceField retrieval | declarado pero sin response example | `PARTIALLY_DOCUMENTED` |
| Client token wording | frase ambigua sobre "main Client" | `NEEDS_VERIFICATION` |
| Create response ID | ejemplo no muestra `id` | `PARTIALLY_DOCUMENTED` |

---

# 103. Reglas MUST para IA

Una IA MUST:

1. usar `Token` auth;
2. usar array body en Create Clients según ejemplos oficiales;
3. distinguir `Client.id` de `Client.key`;
4. usar `key` en el filtro GET;
5. usar IDs internos en DELETE individual/bulk;
6. soportar body en HTTP DELETE masivo;
7. usar array body en PUT masivo;
8. crear custom property antes de usarla;
9. limitar type de custom property a `str|int|float|bool`;
10. enviar values compatibles con el type definido;
11. requerir addon `territory_planner` para ForceField;
12. limitar `period` a `7|14|28`;
13. usar días con nombres exactos oficiales;
14. limitar week buckets a `any_week|week_1|week_2|week_3|week_4`;
15. preservar incertidumbre sobre `interval` y `seller`.

---

# 104. Reglas MUST NOT para IA

MUST NOT:

1. usar `Client.key` como si fuera siempre `Client.id`;
2. asumir `key` unique;
3. inventar PATCH de Client;
4. inventar GET by path ID;
5. inventar list-all de Clients si no fue verificado;
6. asumir PUT es partial;
7. asumir custom properties se crean implícitamente;
8. enviar tipo incorrecto confiando en coerción del servidor;
9. inventar custom property types;
10. usar ForceField sin comprobar addon;
11. inventar `period=30`;
12. inventar `week_5`;
13. asumir `interval` está en días como regla oficial;
14. asumir `seller` siempre es Seller ID;
15. asumir que frecuencia debe coincidir con número de días programados;
16. asumir que eliminar Client elimina Visits.

---

# 105. Aspectos NOT_DOCUMENTED

```text
required fields exactos de Client
key uniqueness
Client title uniqueness
create success status
update success status
delete success status
list pagination
list-all endpoint explícito
sorting
additional filters
batch limits
PUT partial/replace semantics
PATCH support
delete cascade
custom property required/default/nullability
custom property listing
custom property update/delete
custom property coercion rules
ForceField scheduler behavior
ForceField timezone
ForceField visit materialization
interval unit
seller ID discriminator
week bucket precedence
week_5
frequency validation formulas
addon-disabled status/error
```

---

# 106. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones verificadas:

```text
Clients
Create Clients
Obtain Clients
Delete a Customer
Delete Clients
Update Clients
Client Custom Properties
Create custom property
Using Custom Properties
ForceField
```

Datos oficiales relevantes:

- `POST /v1/accounts/clients/`
- `GET /v1/accounts/clients/?key=...`
- `DELETE /v1/accounts/clients/{CLIENT_ID}/`
- `DELETE /v1/accounts/clients/` con array de IDs
- `PUT /v1/accounts/clients/`
- `POST /v1/planner/client-properties/`
- custom property types `str`, `int`, `float`, `bool`
- ForceField requiere `territory_planner`
- `sales_visit_scheduled`
- `scheduled_visit_days`
- periods `7`, `14`, `28`
- weekdays oficiales
- week buckets hasta `week_4`

Fecha:

```text
2026-08-10
```

---

# 107. Estado final

**ETAPA 5 COMPLETADA**

Cobertura:

```text
Clients
Client master
Client create/get/update/delete
Bulk delete
Bulk update
Client Custom Properties
ForceField
Territory Planner
Scheduled recurring client visits
```

La siguiente etapa recomendada es:

```text
06-optimization-complete-reference.md
```

Esa etapa será una de las más extensas y deberá cubrir:

- Optimization Instance;
- vehicles;
- deliveries/nodes;
- options;
- multiple depots;
- backhaul;
- stop routing;
- pickup & delivery;
- rest time;
- incremental routing;
- long routes;
- radial routing;
- ETA calculation;
- incompatibility validation;
- schemas completos;
- restricciones;
- response tours;
- rejected/unassigned nodes;
- métricas;
- errores;
- todos los ejemplos oficiales de optimización.
