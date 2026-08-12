# SimpliRoute Public API — Etapa 4: Vehicles, Users/Drivers, Skills, Zones y Fleets

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API principal:** `https://api.simpliroute.com`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre de forma exhaustiva la superficie pública encontrada para:

- Vehicles;
- Create/List/Get/PATCH/PUT/DELETE de Vehicles;
- Vehicle capacities;
- horarios y descansos;
- drivers y co-drivers asociados;
- skills;
- `extra_properties`;
- Users/Drivers;
- Create/List/Get/PUT/DELETE de Drivers;
- Skills;
- Zones;
- Fleets;
- relaciones entre estos recursos;
- restricciones de cuenta;
- inconsistencias documentales;
- reglas MUST/MUST NOT para agentes de IA.

Debe leerse junto con las etapas previas.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción razonable; no garantía contractual. |
| `NOT_DOCUMENTED` | No especificado públicamente. |
| `NEEDS_VERIFICATION` | Existe inconsistencia, ambigüedad o documentación incompleta. |

---

# 3. Modelo conceptual

La documentación separa claramente varias entidades:

```text
Vehicle
Driver/User
Skill
Zone
Fleet
```

Relaciones principales:

```text
Vehicle.default_driver -> Driver.id
Vehicle.codrivers[] -> Driver/User IDs
Vehicle.skills[] -> Skill.id
Zone.vehicles[] -> Vehicle.id
Fleet.vehicles[] -> Vehicle.id
Fleet.users[] -> User.id
Visit.skills_required[] -> Skill.id
Visit.skills_optional[] -> Skill.id
```

---

# 4. Vehicles

**Estado:** `OFFICIAL`

SimpliRoute indica que la entidad de entrega está separada de la entidad Vehicle para permitir mejor seguimiento del rendimiento del vehículo y otras métricas internas.

Familia:

```text
/v1/routes/vehicles/
```

Operaciones publicadas:

```http
POST   /v1/routes/vehicles/
GET    /v1/routes/vehicles/
GET    /v1/routes/vehicles/{vehicle_id}/
PATCH  /v1/routes/vehicles/{vehicle_id}/
PUT    /v1/routes/vehicles/{vehicle_id}/
DELETE /v1/routes/vehicles/{vehicle_id}/
```

---

# 5. Crear Vehicle

## Endpoint

```http
POST /v1/routes/vehicles/
```

## Headers

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

## Ejemplo oficial completo

```json
{
  "name": "Camión-1",
  "capacity": 1000,
  "default_driver": null,
  "location_start_address": "1 Calle A, Guatemala City, Guatemala",
  "location_end_address": "1 Calle A, Guatemala City, Guatemala",
  "location_end_latitude": "14.582131",
  "location_end_longitude": "-90.487034",
  "location_start_latitude": "14.582131",
  "location_start_longitude": "-90.487034",
  "skills": [],
  "capacity2": "1",
  "capacity3": "1",
  "cost": null,
  "shift_start": null,
  "shift_end": null,
  "reference_id": "12AB",
  "license_plate": "ABCD",
  "min_load": 0,
  "min_load_2": 0,
  "min_load_3": 0,
  "max_visit": null,
  "max_time": null,
  "rest_time_start": null,
  "rest_time_end": null,
  "rest_time_duration": null,
  "codrivers": [],
  "extra_properties": {
    "insurance_number": "INS-123",
    "maintenance_date": "2024-12-31",
    "color": "red"
  }
}
```

---

# 6. Vehicle request fields

La tabla formal de la documentación describe expresamente:

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `name` | String | Nombre del vehículo. |
| `capacity` | Integer | Capacidad máxima. |
| `default_driver` | String/Null | Driver ID asignado o `null`. |
| `location_start_address` | String | Dirección inicial. |
| `location_start_latitude` | Float | Latitud inicial. |
| `location_start_longitude` | Float | Longitud inicial. |
| `location_end_address` | String | Dirección final. |
| `location_end_latitude` | Float | Latitud final. |
| `location_end_longitude` | Float | Longitud final. |
| `skills` | Array | Skills/capacidades asignadas al vehículo. |
| `extra_properties` | Object | Diccionario opcional de propiedades extra. |

Además, los ejemplos oficiales publican:

```text
capacity2
capacity3
cost
shift_start
shift_end
reference_id
license_plate
min_load
min_load_2
min_load_3
max_visit
max_time
rest_time_start
rest_time_end
rest_time_duration
codrivers
```

Estado de tipos para estos últimos:

```text
OFFICIAL_EXAMPLE
```

La página no incluye una tabla formal completa para todos ellos.

---

# 7. Inconsistencia `capacity2` vs `capacity_2`

**Estado:** `NEEDS_VERIFICATION`

En request oficial:

```json
{
  "capacity2": "1",
  "capacity3": "1"
}
```

En response:

```json
{
  "capacity_2": 1.0,
  "capacity_3": 1.0
}
```

Por tanto:

```text
write field: capacity2 / capacity3
read field: capacity_2 / capacity_3
```

según ejemplos públicos.

Una IA MUST NOT asumir que los nombres son intercambiables.

---

# 8. Vehicle response

Ejemplo representativo:

```json
{
  "id": 487294,
  "name": "Camión-1",
  "shift_start": null,
  "shift_end": null,
  "capacity": 1000.0,
  "capacity_2": 1.0,
  "capacity_3": 1.0,
  "default_driver": null,
  "location_start_address": "1 Calle A, Guatemala City, Guatemala",
  "location_start_latitude": "14.582131",
  "location_start_longitude": "-90.487034",
  "location_end_address": "1 Calle A, Guatemala City, Guatemala",
  "location_end_latitude": "14.582131",
  "location_end_longitude": "-90.487034",
  "skills": [],
  "created": "2024-06-26T16:28:39.193486Z",
  "modified": "2024-06-26T16:28:39.193486Z",
  "color": "#FF8C00",
  "reference_id": "12AB",
  "license_plate": "ABCD",
  "cost": null,
  "min_load": 0,
  "min_load_2": 0,
  "min_load_3": 0,
  "max_visit": null,
  "rest_time_start": null,
  "rest_time_end": null,
  "rest_time_duration": null,
  "deleted": false,
  "max_time": null,
  "codrivers": [],
  "status": "active",
  "extra_properties": {
    "insurance_number": "INS-123",
    "maintenance_date": "2024-12-31",
    "color": "red"
  }
}
```

---

# 9. Vehicle response fields

Campos observados:

```text
id
name
shift_start
shift_end
capacity
capacity_2
capacity_3
default_driver
location_start_address
location_start_latitude
location_start_longitude
location_end_address
location_end_latitude
location_end_longitude
skills
created
modified
color
reference_id
license_plate
cost
min_load
min_load_2
min_load_3
max_visit
rest_time_start
rest_time_end
rest_time_duration
deleted
max_time
codrivers
status
extra_properties
```

---

# 10. Vehicle ID

Ejemplo:

```json
{
  "id": 487294
}
```

Tipo observado:

```text
Integer
```

No se publica una tabla formal específica del response, pero todos los ejemplos modernos muestran entero.

---

# 11. `name`

Nombre humano del vehículo.

Ejemplo:

```text
Camión-1
```

Required:

`NOT_DOCUMENTED`.

Longitud máxima:

`NOT_DOCUMENTED`.

Unicidad:

`NOT_DOCUMENTED`.

---

# 12. Capacidades

SimpliRoute soporta hasta tres dimensiones de capacidad:

```text
capacity
capacity2 / capacity_2
capacity3 / capacity_3
```

que corresponden conceptualmente a:

```text
Visit.load
Visit.load_2
Visit.load_3
```

La unidad física no está fijada globalmente.

MUST NOT asumir:

```text
kg
m3
pallets
```

sin configuración del negocio.

---

# 13. Minimum Loads

Campos publicados:

```text
min_load
min_load_2
min_load_3
```

Ejemplo:

```json
{
  "min_load": 0,
  "min_load_2": 0,
  "min_load_3": 0
}
```

Semántica detallada:

`PARTIALLY_DOCUMENTED`.

Por nombre y contexto son mínimos de carga del vehículo, pero la sección Vehicles no explica comportamiento algorítmico completo.

Se documentará nuevamente en Optimization si existen reglas específicas.

---

# 14. `max_visit`

Campo publicado:

```text
max_visit
```

Ejemplo:

```json
{
  "max_visit": null
}
```

Semántica precisa, unidad y validación:

`NOT_DOCUMENTED` en Vehicles.

Probablemente representa máximo de visitas, pero una IA no debe convertir esta deducción en contrato hasta la sección Optimization.

---

# 15. `max_time`

Ejemplo:

```json
{
  "max_time": null
}
```

Semántica/unidad exacta:

`NOT_DOCUMENTED` en Vehicles.

---

# 16. Shift

Campos:

```text
shift_start
shift_end
```

Ejemplos:

```json
{
  "shift_start": null,
  "shift_end": null
}
```

Formato cuando existe:

`NOT_DOCUMENTED` formalmente en Vehicles.

En otras áreas de SimpliRoute los horarios utilizan `HH:mm:ss`, pero no debe extrapolarse como garantía sin verificación.

---

# 17. Rest Time

Campos:

```text
rest_time_start
rest_time_end
rest_time_duration
```

Ejemplos:

```json
{
  "rest_time_start": null,
  "rest_time_end": null,
  "rest_time_duration": null
}
```

La optimización tiene una sección específica de Rest Time que documentará el comportamiento algorítmico.

---

# 18. `cost`

Ejemplo:

```json
{
  "cost": null
}
```

Unidad monetaria y semántica exacta:

`NOT_DOCUMENTED` en Vehicles.

No asumir moneda.

---

# 19. `reference_id`

Ejemplo:

```json
{
  "reference_id": "12AB"
}
```

Sirve como referencia externa según naming, pero la sección no define:

- unicidad;
- required;
- longitud;
- idempotencia.

Por tanto:

```text
reference_id uniqueness = NOT_DOCUMENTED
```

---

# 20. `license_plate`

Ejemplo:

```json
{
  "license_plate": "ABCD"
}
```

Validación/formato por país:

`NOT_DOCUMENTED`.

---

# 21. `default_driver`

Tipo oficial:

```text
String / Null
```

Descripción:

```text
assigned driver ID or null
```

Sin embargo, Driver IDs en Users se muestran como enteros.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla

Tratarlo como identificador opaco del Driver.

---

# 22. `codrivers`

Ejemplo:

```json
{
  "codrivers": []
}
```

La sección Vehicles no define tabla formal del tipo/semántica.

Visit Detail también expone `codrivers`.

Interpretación:

```text
OFFICIAL_EXAMPLE
```

No inventar campos internos del objeto si el array eventualmente contiene objetos en vez de IDs.

---

# 23. `color`

Vehicle response expone:

```json
{
  "color": "#FF8C00"
}
```

No aparece en el request completo publicado para creación.

Por tanto:

```text
Vehicle.color writable = NOT_DOCUMENTED
```

No enviar automáticamente `color` al crear Vehicle.

---

# 24. `status`

Ejemplo:

```json
{
  "status": "active"
}
```

Enum completo:

`NOT_DOCUMENTED`.

No inventar:

```text
inactive
blocked
deleted
```

aunque puedan existir internamente.

---

# 25. `deleted`

Ejemplo:

```json
{
  "deleted": false
}
```

No implica necesariamente hard-delete o soft-delete específico.

Semántica DELETE:

`NOT_DOCUMENTED`.

---

# 26. List Vehicles

## Endpoint

```http
GET /v1/routes/vehicles/
```

## Query param publicado

```text
include_extra_properties
```

Tipo:

```text
Boolean
```

Optional:

```text
yes
```

Default:

```text
false
```

---

# 27. List sin extra properties

Request conceptual:

```http
GET /v1/routes/vehicles/
```

No incluye:

```text
extra_properties
```

en el response por defecto.

---

# 28. List con extra properties

```http
GET /v1/routes/vehicles/?include_extra_properties=true
```

Response incluye:

```json
{
  "extra_properties": {
    "insurance_number": "INS-123"
  }
}
```

### Regla IA

Si la integración depende de `extra_properties`, MUST enviar:

```text
include_extra_properties=true
```

en lecturas List/Get.

---

# 29. Get Vehicle

## Endpoint

```http
GET /v1/routes/vehicles/{vehicle_id}/
```

## Query param

```text
include_extra_properties
```

Boolean, opcional, default `false`.

Response root:

```text
Object
```

según ejemplo moderno.

---

# 30. PATCH Vehicle

## Endpoint

```http
PATCH /v1/routes/vehicles/{vehicle_id}/
```

Semántica oficial:

```text
Only fields sent in the request will be updated.
```

Ejemplo:

```json
{
  "name": "Camión-1-Updated",
  "extra_properties": {
    "insurance_number": "INS-456",
    "new_property": "new_value"
  }
}
```

---

# 31. Extra Properties — estructura

`extra_properties` es un objeto key-value:

```json
{
  "insurance_number": "INS-123",
  "maintenance_date": "2024-12-31",
  "color": "red"
}
```

Restricciones oficiales:

- keys max 254 bytes UTF-8;
- values max 254 bytes UTF-8;
- no duplicate property names en el mismo request;
- los valores se almacenan como strings;
- números, fechas u otros tipos se convierten a strings;
- los nombres de propiedades son inmutables;
- operaciones atómicas.

---

# 32. Extra Properties en POST

**Estado:** `OFFICIAL`

En POST:

```text
null values are ignored
```

Ejemplo:

```json
{
  "extra_properties": {
    "foo": null
  }
}
```

no crea `foo`.

---

# 33. Extra Properties en PATCH

**Estado:** `OFFICIAL`

PATCH usa modo merge:

```text
sent properties -> create/update
omitted properties -> unchanged
```

Para borrar una propiedad:

```json
{
  "extra_properties": {
    "insurance_number": null
  }
}
```

Regla:

```text
PATCH null -> delete property
```

---

# 34. Extra Properties en PUT

**Estado:** `OFFICIAL`

PUT usa modo replace para el diccionario enviado.

Si se envía:

```json
{
  "extra_properties": {
    "a": "1",
    "b": "2"
  }
}
```

el conjunto final será exactamente:

```text
a
b
```

Las propiedades anteriores no incluidas se eliminan.

---

# 35. Eliminar todas las Extra Properties con PUT

Enviar:

```json
{
  "extra_properties": {}
}
```

Resultado:

```text
all extra properties deleted
```

---

# 36. PUT con `extra_properties: null`

La documentación declara:

```text
null or omitted -> existing properties remain unchanged
```

Por tanto:

```json
{
  "extra_properties": null
}
```

NO equivale a borrar todo.

---

# 37. PUT con valores null dentro del diccionario

Regla oficial:

```text
null values are ignored
```

Para eliminar una propiedad en PUT:

```text
no incluirla en el diccionario final
```

No usar `null`.

---

# 38. Atomicidad de Extra Properties

**Estado:** `OFFICIAL`

Todas las operaciones de extra properties son atómicas.

Si falla una operación:

```text
entire request rolled back
```

Esto es importante para integraciones que actualizan varias propiedades simultáneamente.

---

# 39. Property names immutable

Una vez creada una key:

```text
property name cannot be renamed
```

Para cambiar el nombre:

```text
1. crear nueva property
2. opcionalmente eliminar la anterior
```

---

# 40. PUT Vehicle

## Endpoint

```http
PUT /v1/routes/vehicles/{vehicle_id}/
```

Semántica oficial:

```text
Updates a vehicle with complete data.
All fields should be sent in the request.
```

### Regla

Para el Vehicle general:

```text
PUT -> complete update
```

No usar PUT para un cambio pequeño salvo que se envíen los datos completos esperados.

---

# 41. DELETE Vehicle

## Endpoint

```http
DELETE /v1/routes/vehicles/{vehicle_id}/
```

La documentación usa `{vehicles_id}` en el heading, pero conceptualmente es ID de un Vehicle.

Response/status:

`NOT_DOCUMENTED`.

---

# 42. Paginación Vehicles

`NOT_DOCUMENTED`.

No existe query param público documentado para:

```text
limit
offset
page
cursor
```

en `/v1/routes/vehicles/`.

---

# 43. Filtros Vehicles

Único query param explícitamente publicado:

```text
include_extra_properties
```

No inventar:

```text
status
reference_id
license_plate
driver
fleet
```

como query params.

---

# 44. Users / Drivers

**Estado:** `OFFICIAL`

SimpliRoute define un User en esta sección como:

> un courier que hará entregas mediante la mobile app.

La API utiliza path:

```text
/v1/accounts/drivers/
```

aunque el título de la sección sea `Users`.

### Regla conceptual

En este contexto:

```text
User / Driver
```

están estrechamente relacionados.

No asumir que todos los usuarios internos de la plataforma son obligatoriamente conductores, porque los responses también muestran roles.

---

# 45. List Users

## Endpoint

```http
GET /v1/accounts/drivers/
```

Response:

```json
[
  {
    "id": 114,
    "username": "user2",
    "name": "",
    "phone": "",
    "email": "",
    "is_owner": false,
    "is_admin": false,
    "is_driver": true,
    "old_id": 1477,
    "created": "2016-06-24T20:47:06.859895Z",
    "modified": "2016-06-30T20:04:51.043122Z",
    "last_login": null
  }
]
```

---

# 46. User response fields

Campos observados:

```text
id
username
name
phone
email
is_owner
is_admin
is_driver
is_router_jr
is_monitor
is_coordinator
is_router
is_staff
old_id
created
modified
last_login
```

No todos aparecen en todos los ejemplos.

---

# 47. User ID

Ejemplos:

```json
{
  "id": 40779
}
```

Tipo observado:

```text
Integer
```

---

# 48. Create User

## Endpoint

```http
POST /v1/accounts/drivers/
```

Body oficial:

```json
[
  {
    "username": "testtest2",
    "name": "Conductor 1",
    "phone": "",
    "email": "",
    "is_admin": false,
    "password": "driver",
    "is_driver": true
  }
]
```

### Root

Array.

La documentación no muestra object root individual.

---

# 49. Create User — request fields observados

| Campo | Tipo observado |
|---|---|
| `username` | String |
| `name` | String |
| `phone` | String |
| `email` | String |
| `is_admin` | Boolean |
| `password` | String |
| `is_driver` | Boolean |

Required exactos:

`NOT_DOCUMENTED`.

---

# 50. Password security

La documentación usa un password trivial en ejemplo:

```text
driver
```

Esto es sólo ejemplo.

Una IA MUST NOT recomendar copiar ese password en producción.

Política de complejidad:

`NOT_DOCUMENTED`.

---

# 51. Create User response

Ejemplo:

```json
[
  {
    "id": 40779,
    "username": "testtest2",
    "name": "Conductor 1",
    "phone": "",
    "email": "",
    "is_owner": false,
    "is_admin": false,
    "is_driver": true,
    "is_router_jr": false,
    "is_monitor": false,
    "is_coordinator": false,
    "is_router": false,
    "is_staff": false,
    "old_id": null,
    "created": "2020-03-19T19:13:45.178268Z",
    "modified": "2020-03-19T19:13:45.223900Z",
    "last_login": null
  }
]
```

---

# 52. Get User

## Endpoint

```http
GET /v1/accounts/drivers/{user_id}/
```

Response oficial:

```json
[
  {
    "id": 203,
    "username": "driver33",
    "name": "Driver 3",
    "phone": "",
    "email": "",
    "is_owner": false,
    "is_admin": false,
    "is_driver": true,
    "old_id": 1979,
    "created": "2016-08-01T20:23:31.966307Z",
    "modified": "2016-08-01T20:23:32.158526Z",
    "last_login": null
  }
]
```

### Nota importante

El endpoint singular devuelve un **array** en el ejemplo oficial.

Una IA MUST NOT asumir object root.

---

# 53. Update User

## Endpoint

```http
PUT /v1/accounts/drivers/{user_id}/
```

Body:

```json
[
  {
    "username": "driver3",
    "name": "Driver 3",
    "email": "",
    "is_admin": false,
    "password": "driver"
  }
]
```

Response también se muestra como array.

---

# 54. PATCH User

`NOT_DOCUMENTED`.

La sección Users no publica:

```http
PATCH /v1/accounts/drivers/{user_id}/
```

No inventarlo.

---

# 55. DELETE User

## Endpoint

```http
DELETE /v1/accounts/drivers/{user_id}/
```

Response/status:

`NOT_DOCUMENTED`.

---

# 56. Roles de usuario

Ejemplos muestran:

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

Pero la documentación no define:

- permisos exactos;
- jerarquía;
- combinaciones válidas;
- cuáles son writeable;
- reglas por plan comercial.

Por tanto:

```text
role semantics = PARTIALLY_DOCUMENTED
```

---

# 57. `old_id`

Aparece en responses.

Semántica:

`NOT_DOCUMENTED`.

No usarlo como clave estable de integración salvo confirmación adicional.

---

# 58. `last_login`

Timestamp/null.

Usable como información de lectura, pero no se documenta como writeable.

---

# 59. Users pagination/filtering

`NOT_DOCUMENTED`.

No extrapolar query params.

---

# 60. Skills

## Endpoint

```http
GET /v1/routes/skills/
```

Headers:

```http
Authorization: Token <TOKEN>
Content-Type: application/json
```

---

# 61. Skill Object

Response:

```json
[
  {
    "id": 295,
    "skill": "frío",
    "created": "2017-01-24T21:06:42.545448Z",
    "modified": "2017-01-24T21:06:42.545683Z"
  }
]
```

Campos:

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `id` | int | ID único. |
| `skill` | String | Nombre de la skill. |
| `created` | Date | Timestamp de creación. |
| `modified` | Date | Timestamp de modificación. |

---

# 62. Semántica de Skills

**Estado:** `OFFICIAL`

SimpliRoute explica que Skills son etiquetas/restricciones usadas por el algoritmo.

Ejemplo conceptual oficial:

```text
Visit requires "COLD"
Vehicle must also have "COLD"
```

Relación:

```text
Visit.skills_required[] -> Skill.id
Vehicle.skills[] -> Skill.id
```

---

# 63. Skills required vs optional

Visits soportan:

```text
skills_required
skills_optional
```

Vehicle usa:

```text
skills
```

La sección Skills explica la coincidencia obligatoria de required skill.

Semántica algorítmica exacta de `skills_optional`:

`NOT_DOCUMENTED` aquí.

Se revisará en Optimization.

---

# 64. Create/Update/Delete Skill

`NOT_DOCUMENTED`.

La referencia pública sólo expone:

```http
GET /v1/routes/skills/
```

No inventar CRUD.

---

# 65. Zones

## Endpoint

```http
GET /v1/zones/
```

## Feature availability

**Estado:** `OFFICIAL`

Si el módulo no está habilitado, SimpliRoute indica contactar a soporte para activarlo.

Por tanto:

```text
publicly documented != enabled on every account
```

---

# 66. Zone Object

Ejemplo:

```json
[
  {
    "id": 67664,
    "name": "ZONA-TEST2",
    "coordinates": [
      {
        "lat": "-12.105433",
        "lng": "-77.017408"
      },
      {
        "lat": "-12.099576",
        "lng": "-77.017308"
      }
    ],
    "vehicles": [
      28202
    ],
    "enabled": true,
    "schedules": [
      "Monday",
      "Saturday",
      "Thursday",
      "Friday",
      "Tuesday",
      "Sunday",
      "Wednesday"
    ]
  }
]
```

---

# 67. Zone fields

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `id` | int | ID único de zona. |
| `name` | string | Nombre. |
| `coordinates` | array | Coordenadas que definen el área. |
| `lat` | string | Latitud. |
| `lng` | string | Longitud. |
| `vehicles` | array | IDs de Vehicles asignados. |
| `enabled` | boolean | Zona habilitada. |
| `schedules` | array | Días en que la zona está activa. |

---

# 68. Semántica de Zones

**Estado:** `OFFICIAL`

Zones permite:

```text
definir/dibujar zonas custom en el mapa
asignarlas a vehículos
asegurar que esos vehículos operen dentro de esas áreas
```

Esto representa una restricción geográfica de operación.

---

# 69. Zone coordinates

Shape:

```json
{
  "lat": "-12.105433",
  "lng": "-77.017408"
}
```

Tipos oficiales:

```text
string
```

No transformar obligatoriamente a JSON number al enviar a un endpoint hipotético de escritura, porque no existe escritura pública documentada aquí.

---

# 70. Zone schedules

Valores observados:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

La tabla indica listas de días.

Case sensitivity:

`NOT_DOCUMENTED`.

Copiar spelling exacto publicado.

---

# 71. Zone CRUD

Sólo se publica:

```http
GET /v1/zones/
```

No están documentados:

```text
POST
PUT
PATCH
DELETE
```

para Zones.

No inventarlos.

---

# 72. Fleets

## Endpoint

```http
GET /v1/fleets/
```

## Feature availability

**Estado:** `OFFICIAL`

Si Fleet no está habilitado, se debe solicitar activación.

---

# 73. Fleet Object

Ejemplo:

```json
[
  {
    "id": 33867,
    "name": "Almacén A",
    "vehicles": [
      404639,
      297117,
      312450,
      280202
    ],
    "users": [
      185434,
      183371,
      247042,
      295087
    ],
    "created": "2022-01-27T22:53:43.254711Z",
    "modified": "2024-02-29T17:56:34.177789Z"
  }
]
```

---

# 74. Fleet fields

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `id` | int | ID único de Fleet. |
| `name` | string | Nombre. |
| `vehicles` | array | IDs de vehículos. |
| `users` | array | IDs de usuarios. |
| `created` | string | Timestamp de creación. |
| `modified` | string | Timestamp de modificación. |

---

# 75. Semántica de Fleets

**Estado:** `OFFICIAL`

Fleet permite:

- organizar vehículos en flotas;
- asignar flotas a usuarios;
- restringir acceso de usuarios para que sólo vean los vehículos asignados.

Ejemplo conceptual:

```text
Fleet "Almacén A"
  vehicles -> Vehicle IDs
  users    -> User IDs
```

---

# 76. Fleet CRUD

Sólo se publica:

```http
GET /v1/fleets/
```

No se publican:

```text
POST
PUT
PATCH
DELETE
```

No inventarlos.

---

# 77. Relación Vehicle ↔ Driver

Vehicle puede contener:

```text
default_driver
```

Route también contiene:

```text
driver
```

### Regla conceptual

`default_driver` NO implica necesariamente que todas las Routes del vehículo siempre usarán ese driver.

Una Route tiene asociación explícita con Driver.

Por tanto:

```text
Vehicle.default_driver = default/preferred assignment
Route.driver            = actual route assignment
```

La segunda parte es `INFERRED` por estructura de API y debe tratarse con cautela.

---

# 78. Relación Vehicle ↔ Co-drivers

Vehicle response/request publica:

```text
codrivers
```

pero la documentación no define:

- tipo exacto;
- cantidad máxima;
- jerarquía;
- permisos.

Tratar como feature parcialmente documentada.

---

# 79. Relación Vehicle ↔ Skills

Vehicle:

```json
{
  "skills": [295, 296]
}
```

Visit:

```json
{
  "skills_required": [295]
}
```

Regla oficial:

```text
si Visit requiere Skill, Vehicle debe tener esa Skill
```

---

# 80. Relación Vehicle ↔ Zone

Zone:

```json
{
  "vehicles": [28202]
}
```

Esto asigna vehículos a restricciones geográficas.

La escritura/asignación se realiza desde sistema/UI u otras APIs no publicadas en esta referencia.

---

# 81. Relación Vehicle ↔ Fleet

Fleet:

```json
{
  "vehicles": [404639]
}
```

Representa agrupación organizativa/acceso.

---

# 82. Relación Fleet ↔ User

Fleet:

```json
{
  "users": [185434]
}
```

SimpliRoute explica que sirve para limitar qué vehículos pueden ver usuarios concretos.

---

# 83. Vehicle vs Fleet ID en Visit

Visit Object puede contener:

```text
vehicle
fleet
```

Esto permite correlacionar la ejecución con estos recursos.

No asumir que `fleet` siempre estará presente.

---

# 84. Capacidades y cargas

Relación conceptual:

```text
Vehicle.capacity   <-> Visit.load
Vehicle.capacity_2 <-> Visit.load_2
Vehicle.capacity_3 <-> Visit.load_3
```

La función exacta de optimización se documentará en la etapa Optimization.

---

# 85. Horario de vehículo y optimización

Campos:

```text
shift_start
shift_end
rest_time_start
rest_time_end
rest_time_duration
max_time
```

afectan conceptualmente disponibilidad temporal.

Pero su semántica algorítmica completa pertenece al módulo Optimization.

No deducir fórmulas aquí.

---

# 86. Vehicle Extra Properties no son Route Properties

Son recursos/conceptos distintos.

Vehicle:

```json
{
  "extra_properties": {
    "insurance_number": "INS-123"
  }
}
```

Route:

```json
{
  "color": "#0000FF",
  "is_start_blocked": false
}
```

MUST NOT confundirlos.

---

# 87. `color` dentro de extra_properties vs Vehicle.color

Ejemplo Vehicle:

```json
{
  "color": "#FF8C00",
  "extra_properties": {
    "color": "red"
  }
}
```

Esto demuestra que son **dos campos distintos**.

Una IA MUST preservar:

```text
vehicle.color
vehicle.extra_properties["color"]
```

como valores independientes.

---

# 88. Extra Properties types

La documentación declara que todos los values se almacenan como strings.

Por ejemplo:

Input conceptual:

```json
{
  "extra_properties": {
    "year": 2025
  }
}
```

puede almacenarse como:

```json
{
  "year": "2025"
}
```

No depender de numeric type al leer.

---

# 89. UTF-8 byte length

El límite oficial es:

```text
254 bytes
```

NO:

```text
254 characters
```

Para caracteres multibyte:

```text
len(text) != UTF-8 byte length
```

Una IA que valide correctamente SHOULD calcular bytes UTF-8.

Ejemplo conceptual:

```python
len(value.encode("utf-8")) <= 254
```

---

# 90. Duplicate keys

JSON estándar no debería contener keys repetidas, pero la documentación menciona explícitamente que duplicate property names no están permitidos.

No construir payloads mediante mecanismos que puedan producir duplicates.

---

# 91. Status codes Vehicles/Users/Skills/Zones/Fleets

Las secciones revisadas no publican tablas detalladas de códigos por endpoint.

Por tanto:

```text
success status exacto = NOT_DOCUMENTED
```

para las operaciones de esta etapa, salvo los códigos globales definidos en Etapa 1.

No hardcodear `201`, `204`, etc. como garantía oficial.

---

# 92. Error schemas específicos

`NOT_DOCUMENTED`.

Usar estrategia de parsing flexible descrita en Etapa 1.

---

# 93. Idempotencia

No existe garantía específica.

Especial cuidado con:

```http
POST /v1/routes/vehicles/
POST /v1/accounts/drivers/
```

No reintentar ciegamente tras timeout ambiguo.

---

# 94. Required fields Vehicle

La página dice “Example Request with all available fields”, pero sólo la tabla describe campos, sin columna Required.

Por tanto:

```text
required matrix = NOT_DOCUMENTED
```

No asumir que todos los fields mostrados son required.

---

# 95. Required fields User

También:

```text
NOT_DOCUMENTED
```

Aunque `username` y `password` parecen estructuralmente importantes, no deben declararse obligatorios contractualmente sin evidencia explícita.

---

# 96. Vehicle field writability

Confirmados como input por Create/PUT example:

```text
name
capacity
default_driver
location_start_address
location_end_address
location_end_latitude
location_end_longitude
location_start_latitude
location_start_longitude
skills
capacity2
capacity3
cost
shift_start
shift_end
reference_id
license_plate
min_load
min_load_2
min_load_3
max_visit
max_time
rest_time_start
rest_time_end
rest_time_duration
codrivers
extra_properties
```

---

# 97. Vehicle fields no confirmados como input

Response-only o no demostrados como writable:

```text
id
created
modified
color
deleted
status
capacity_2
capacity_3
```

No enviarlos salvo otra documentación específica.

---

# 98. Users fields no confirmados como input

Response muestra roles adicionales:

```text
is_owner
is_router_jr
is_monitor
is_coordinator
is_router
is_staff
old_id
created
modified
last_login
```

pero los ejemplos Create/Update no demuestran su writability.

No enviarlos automáticamente.

---

# 99. Query params

## Vehicles

Documentado:

```text
include_extra_properties
```

## Users

Ninguno documentado.

## Skills

Ninguno documentado.

## Zones

Ninguno documentado.

## Fleets

Ninguno documentado.

---

# 100. Paginación

No documentada en ninguno de estos endpoints.

MUST NOT extrapolar Datamart.

---

# 101. Bulk operations

Create User usa array body, pero la documentación no declara explícitamente máximo batch.

Vehicles Create usa object body.

No asumir bulk Vehicle create.

---

# 102. Feature flags / activación

Confirmado:

```text
Zones -> requiere activación si no está habilitado
Fleets -> requiere activación si no está habilitado
```

Skills no se marca en esta sección como addon.

Extra properties de Vehicle tampoco.

---

# 103. Seguridad Users

Al crear/actualizar User puede enviarse:

```text
password
```

El password es un secreto.

Una IA SHOULD:

- no loguearlo;
- no devolverlo a frontend;
- no persistirlo en texto plano propio;
- no copiar passwords de ejemplos;
- ocultarlo en trazas.

Estas son buenas prácticas, no una extensión del protocolo oficial.

---

# 104. Ejemplo de creación de Vehicle seguro

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/routes/vehicles/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Camion-01",
    "capacity": 1000,
    "default_driver": null,
    "location_start_address": "Deposito Central",
    "location_start_latitude": "-34.6037",
    "location_start_longitude": "-58.3816",
    "location_end_address": "Deposito Central",
    "location_end_latitude": "-34.6037",
    "location_end_longitude": "-58.3816",
    "skills": [],
    "capacity2": "0",
    "capacity3": "0",
    "reference_id": "ERP-VEH-01",
    "license_plate": "AA000AA",
    "min_load": 0,
    "min_load_2": 0,
    "min_load_3": 0,
    "codrivers": [],
    "extra_properties": {
      "insurance_number": "POL-123"
    }
  }'
```

Los valores son ficticios.

---

# 105. Ejemplo PATCH de Extra Properties

Agregar/modificar sin tocar el resto:

```bash
curl -X PATCH \
  'https://api.simpliroute.com/v1/routes/vehicles/<VEHICLE_ID>/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "extra_properties": {
      "insurance_number": "POL-456",
      "maintenance_date": "2026-09-01"
    }
  }'
```

---

# 106. Eliminar una Extra Property

```bash
curl -X PATCH \
  'https://api.simpliroute.com/v1/routes/vehicles/<VEHICLE_ID>/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "extra_properties": {
      "insurance_number": null
    }
  }'
```

Según contrato oficial:

```text
insurance_number deleted
other properties unchanged
```

---

# 107. Reemplazar todas las Extra Properties

```bash
curl -X PUT \
  'https://api.simpliroute.com/v1/routes/vehicles/<VEHICLE_ID>/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "...vehicle complete fields...": "...",
    "extra_properties": {
      "maintenance_date": "2026-09-01"
    }
  }'
```

Resultado para `extra_properties`:

```text
only maintenance_date remains
```

---

# 108. Eliminar todas las Extra Properties

Usando PUT completo:

```json
{
  "extra_properties": {}
}
```

---

# 109. List Vehicles con extra properties

```bash
curl \
  'https://api.simpliroute.com/v1/routes/vehicles/?include_extra_properties=true' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 110. Create Driver

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounts/drivers/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "username": "driver01",
      "name": "Conductor 01",
      "phone": "+5491100000000",
      "email": "driver01@example.com",
      "is_admin": false,
      "password": "<STRONG_SECRET>",
      "is_driver": true
    }
  ]'
```

---

# 111. Skill discovery

Antes de asignar skills:

```bash
curl \
  'https://api.simpliroute.com/v1/routes/skills/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json'
```

Guardar:

```text
Skill.id
```

para usarlo en:

```text
Vehicle.skills
Visit.skills_required
Visit.skills_optional
```

---

# 112. Zone discovery

```bash
curl \
  'https://api.simpliroute.com/v1/zones/' \
  -H 'Authorization: Token <TOKEN>'
```

Si no está habilitado:

```text
feature activation may be required
```

---

# 113. Fleet discovery

```bash
curl \
  'https://api.simpliroute.com/v1/fleets/' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 114. Endpoint inventory

| Método | Endpoint | Propósito |
|---|---|---|
| POST | `/v1/routes/vehicles/` | Crear Vehicle |
| GET | `/v1/routes/vehicles/` | Listar Vehicles |
| GET | `/v1/routes/vehicles/{vehicle_id}/` | Obtener Vehicle |
| PATCH | `/v1/routes/vehicles/{vehicle_id}/` | Actualización parcial |
| PUT | `/v1/routes/vehicles/{vehicle_id}/` | Actualización completa |
| DELETE | `/v1/routes/vehicles/{vehicle_id}/` | Eliminar Vehicle |
| GET | `/v1/accounts/drivers/` | Listar Users/Drivers |
| POST | `/v1/accounts/drivers/` | Crear User/Driver |
| GET | `/v1/accounts/drivers/{user_id}/` | Obtener User/Driver |
| PUT | `/v1/accounts/drivers/{user_id}/` | Actualizar User/Driver |
| DELETE | `/v1/accounts/drivers/{user_id}/` | Eliminar User/Driver |
| GET | `/v1/routes/skills/` | Listar Skills |
| GET | `/v1/zones/` | Listar Zones |
| GET | `/v1/fleets/` | Listar Fleets |

---

# 115. Recursos NO publicados como CRUD

No inventar:

```text
POST /v1/routes/skills/
PUT /v1/routes/skills/{id}/
DELETE /v1/routes/skills/{id}/

POST /v1/zones/
PUT /v1/zones/{id}/
PATCH /v1/zones/{id}/
DELETE /v1/zones/{id}/

POST /v1/fleets/
PUT /v1/fleets/{id}/
PATCH /v1/fleets/{id}/
DELETE /v1/fleets/{id}/

PATCH /v1/accounts/drivers/{id}/
```

porque no aparecen en la referencia pública revisada.

---

# 116. Inconsistencias detectadas

| Tema | Problema | Estado |
|---|---|---|
| `capacity2` / `capacity3` | request sin underscore, response con underscore | `NEEDS_VERIFICATION` |
| `default_driver` | tabla String, User ID observado Integer | `NEEDS_VERIFICATION` |
| Coordinates | tabla Float, ejemplos response String | `NEEDS_VERIFICATION` |
| Vehicle color | aparece en response pero no request | `PARTIALLY_DOCUMENTED` |
| Vehicle status | sólo `active` mostrado | `PARTIALLY_DOCUMENTED` |
| User Get | endpoint singular devuelve array | `OFFICIAL_EXAMPLE` |
| User Update | PUT body y response son arrays | `OFFICIAL_EXAMPLE` |
| `old_id` | aparece, semántica ausente | `NOT_DOCUMENTED` |
| `max_visit` | nombre sugiere máximo visitas, sin contrato detallado | `PARTIALLY_DOCUMENTED` |
| `max_time` | sin unidad/semántica detallada | `NOT_DOCUMENTED` |
| `cost` | sin moneda/unidad | `NOT_DOCUMENTED` |
| `codrivers` | estructura no especificada | `PARTIALLY_DOCUMENTED` |

---

# 117. Reglas MUST para IA

Una IA MUST:

1. usar endpoint Vehicle CRUD exactamente como está publicado;
2. usar `include_extra_properties=true` cuando necesite esas properties;
3. distinguir `capacity2` write de `capacity_2` read;
4. respetar semántica POST/PATCH/PUT de `extra_properties`;
5. calcular límite de 254 en bytes UTF-8, no caracteres;
6. preservar atomicidad conceptual de extra properties;
7. usar PATCH para cambios parciales de Vehicle;
8. enviar datos completos al usar PUT Vehicle;
9. tratar Driver IDs como identificadores;
10. usar Skill IDs obtenidos del endpoint oficial;
11. requerir coincidencia Vehicle skill para Visit required skill;
12. considerar Zones/Fleets como módulos habilitables;
13. usar Fleet.users y Fleet.vehicles como relaciones de acceso;
14. mantener password fuera de logs;
15. no inventar CRUD faltante.

---

# 118. Reglas MUST NOT para IA

MUST NOT:

1. asumir que `capacity` está en kg;
2. asumir que `cost` está en una moneda concreta;
3. asumir que `reference_id` es único;
4. enviar `capacity_2` en request sólo porque aparece en response;
5. usar `null` para borrar property en PUT;
6. asumir que `extra_properties: null` borra properties;
7. renombrar una extra property existente;
8. asumir que Vehicle.color y `extra_properties.color` son lo mismo;
9. asumir que `status` sólo puede ser `active`;
10. inventar PATCH de User;
11. inventar CRUD de Skills;
12. inventar CRUD de Zones;
13. inventar CRUD de Fleets;
14. asumir que todos los usuarios son sólo drivers;
15. asumir que Zone está activa todos los días si `schedules` no se conoce.

---

# 119. Aspectos NOT_DOCUMENTED

```text
Vehicle required fields exactos
Vehicle status enum
Vehicle name uniqueness
Vehicle reference_id uniqueness
Vehicle max_visit semantics exacta
Vehicle max_time unit
Vehicle cost unit/currency
Vehicle shift time format exacto
Vehicle delete response/status
Vehicle pagination
Vehicle filter set beyond include_extra_properties
User required fields exactos
User password policy
User role permission matrix
User pagination
User filtering
Skill create/update/delete
Zone create/update/delete
Fleet create/update/delete
Zone max coordinates
Zone polygon validation rules
Fleet max users
Fleet max vehicles
HTTP success status exacto de cada operación
idempotency
retry
rate limits específicos
```

---

# 120. Fuentes oficiales verificadas

Fuente:

```text
https://documentation.simpliroute.com/
```

Secciones:

```text
Vehicles
Create vehicles
List Vehicle
Get Vehicle
Update Vehicle (Partial)
Update Vehicle (Complete)
Delete vehicle
Users
List Users
Create user
Get a determine user
Update user
Delete user
Skills
Zones
Fleets
List Fleets
```

Hechos clave confirmados:

- Vehicle CRUD público;
- `include_extra_properties` default false;
- Extra Properties POST/PATCH/PUT semantics;
- 254 bytes UTF-8;
- atomicidad de extra properties;
- User/Driver endpoints;
- Skill constraint behavior;
- Zones por vehículo;
- Fleets por vehículos/usuarios;
- Zones y Fleets pueden requerir habilitación.

Fecha de verificación:

```text
2026-08-10
```

---

# 121. Estado final

**ETAPA 4 COMPLETADA**

Cobertura:

```text
Vehicles
Vehicle Extra Properties
Users / Drivers
Skills
Zones
Fleets
relaciones principales
restricciones de cuenta
```

La siguiente etapa recomendada es:

```text
05-clients-custom-properties.md
```

Deberá cubrir:

- Clients;
- creación;
- listado/obtención;
- eliminación individual;
- eliminación masiva;
- actualización masiva;
- client custom properties;
- creación de custom property;
- uso de custom properties;
- ForceField;
- territory_planner addon;
- sales_visit_scheduled;
- scheduled_visit_days;
- payloads, tipos, enums, responses y edge cases.
