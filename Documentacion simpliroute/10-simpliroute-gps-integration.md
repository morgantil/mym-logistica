# SimpliRoute Public API — Etapa 10: GPS Integration

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Endpoint GPS exacto:** `NOT_PUBLICLY_DOCUMENTED`  
**Setup técnico:** requiere contacto con Professional Services según la documentación oficial

---

# 1. Objetivo

Este documento cubre toda la información pública oficial encontrada para la integración GPS de SimpliRoute:

- alcance de la integración;
- limitación de acceso a detalles técnicos;
- método HTTP publicado;
- endpoint no publicado;
- frecuencia recomendada;
- comportamiento ante pérdida de señal;
- uso de colas locales;
- reenvío de datos almacenados;
- envío individual de objetos;
- payload GPS;
- coordenadas;
- timestamp UTC;
- `vehicleId`;
- `providerName`;
- objeto `temperature`;
- deprecación del objeto `temperature`;
- objeto `alert`;
- array `alerts`;
- catálogo de nombres de alertas disponibles;
- responses publicados;
- manejo de alertas inválidas;
- ambigüedades e inconsistencias para agentes de IA.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción útil, no garantía contractual. |
| `NOT_DOCUMENTED` | La referencia pública no define el comportamiento. |
| `NEEDS_VERIFICATION` | Existe inconsistencia o ambigüedad documental. |

---

# 3. Disponibilidad y setup

**Estado:** `OFFICIAL`

SimpliRoute declara que puede integrarse con sistemas GPS para recibir información de vehículos.

Sin embargo, la documentación pública dice explícitamente:

```text
Please contact our Professional Services team to obtain technical details on how to set up this integration.
```

Por tanto:

```text
GPS integration = publicly described
exact onboarding/setup = not public
exact ingestion endpoint = not public
```

---

# 4. Endpoint GPS

La documentación dice:

```text
the following information must be sent, by POST method, to the endpoint
```

pero NO publica la URL del endpoint.

Por tanto:

```text
HTTP method = POST
endpoint URL = NOT_PUBLICLY_DOCUMENTED
```

### Regla crítica para IA

MUST NOT inventar:

```text
/v1/gps/
/v1/tracking/
/gps/locations/
/v1/vehicles/location/
```

ni cualquier otra URL.

El endpoint debe obtenerse de Professional Services / documentación entregada al cliente.

---

# 5. Autenticación

La sección pública GPS no publica:

- header Authorization;
- API Token;
- Bearer;
- API key especial;
- Basic Auth;
- mTLS.

Estado:

```text
NOT_DOCUMENTED
```

### Regla

MUST NOT asumir automáticamente:

```http
Authorization: Token <TOKEN>
```

aunque la API principal utilice ese esquema.

La configuración GPS puede depender del setup entregado por Professional Services.

---

# 6. Content-Type

La documentación muestra JSON de entrada, pero no publica explícitamente:

```http
Content-Type: application/json
```

Estado:

```text
INFERRED FROM PAYLOAD
```

Una implementación probablemente use JSON, pero el header exacto debe validarse con la especificación privada del endpoint.

---

# 7. Frecuencia recomendada — flotas pequeñas

**Estado:** `OFFICIAL`

SimpliRoute recomienda enviar como máximo:

```text
1 dato por vehículo cada 20 segundos
```

para el caso general.

Esto se presenta como frecuencia óptima para visualizar correctamente las rutas en el mapa.

---

# 8. Frecuencia recomendada — flotas mayores

Para flotas de:

```text
más de 20 vehículos
```

SimpliRoute recomienda:

```text
1 dato por minuto por vehículo
```

---

# 9. No confundir recomendación con rate limit contractual

La documentación usa lenguaje de recomendación:

```text
It is recommended
```

No declara:

- HTTP 429;
- bloqueo;
- rechazo si se supera;
- cuota hard;
- rate-limit headers.

Por tanto:

```text
20 sec / 60 sec = recommended sending frequency
not documented hard API rate limit
```

---

# 10. Regla práctica de frecuencia

```text
fleet_size <= 20:
    recommended interval >= 20 seconds per vehicle

fleet_size > 20:
    recommended interval >= 60 seconds per vehicle
```

Esta traducción algorítmica refleja el texto oficial.

---

# 11. Pérdida de señal

**Estado:** `OFFICIAL`

Si un vehículo pierde señal por:

- áreas fuera de cobertura satelital;
- factores que provoquen pérdida de señal en el dispositivo;

SimpliRoute recomienda guardar localmente los datos que no pudieron enviarse.

---

# 12. Uso de queues locales

La documentación recomienda:

```text
queues
```

para persistir datos GPS no enviados.

Flujo:

```text
GPS device/provider
   |
   | no signal
   v
local queue
   |
   | signal restored
   v
send stored observations
```

---

# 13. Reenvío de datos almacenados

Cuando vuelve la señal, los datos acumulados pueden enviarse con:

```text
máximo 10 segundos entre cada objeto
```

hasta vaciar la cola.

---

# 14. Alcance especial de los 10 segundos

**Estado:** `OFFICIAL`

La regla de 10 segundos aplica **sólo** a:

```text
datos almacenados localmente debido a pérdida de señal
```

Los vehículos que permanecen con cobertura deben seguir usando la frecuencia normal:

```text
20 sec general
60 sec/vehicle for fleet > 20
```

---

# 15. Orden de reenvío

La documentación no declara explícitamente:

```text
FIFO required
```

aunque el uso de queue lo sugiere.

Estado:

```text
INFERRED
```

### Recomendación

SHOULD reenviar en orden temporal ascendente para preservar trayectoria.

Pero no presentarlo como requisito contractual oficial.

---

# 16. Envío independiente de objetos

**Estado:** `OFFICIAL`

SimpliRoute dice:

```text
the data must be sent independently
```

y advierte que enviar un arreglo con todos los objetos puede causar errores de comunicación.

---

# 17. Contradicción: ejemplo con array

La misma sección posteriormente publica un Input example cuyo root es:

```json
[
  {
    "...": "..."
  }
]
```

es decir, un array.

Esto contradice el texto:

```text
data must be sent independently
an array with all objects can cause errors
```

Estado:

```text
NEEDS_VERIFICATION
```

### Regla segura

Para producción:

```text
send one GPS observation per POST
```

porque ésa es la instrucción textual explícita.

No usar batching sólo porque el ejemplo visual está envuelto en array.

---

# 18. Payload mínimo publicado

Ejemplo:

```json
{
  "latitude": -33.4311548,
  "longitude": -70.5701852,
  "timestamp": "2019-02-20 10:35:00-00",
  "vehicleId": "JKCT-81",
  "providerName": "LOCALIZAGPS_AGROSUPER"
}
```

---

# 19. Campos GPS principales

| Campo | Descripción oficial |
|---|---|
| `latitude` | Número decimal, hasta 6 dígitos decimales. |
| `longitude` | Número decimal, hasta 6 dígitos decimales. |
| `timestamp` | Fecha/hora UTC, formato `YYYY-MM-DD HH:II:SS-00`. |
| `vehicleId` | Vehicle ID en el sistema SimpliRoute. |
| `temperature` | Datos de temperatura; backward compatible pero deprecated. |
| `alert` | Objeto de alerta. |
| `providerName` | Nombre del proveedor de información GPS. |

El ejemplo extendido también publica:

```text
alerts
```

como array de alertas adicionales.

---

# 20. Required fields

La tabla pública no posee columna Mandatory.

Por tanto:

```text
required matrix = NOT_DOCUMENTED
```

Aunque ubicación, timestamp, vehicleId y providerName aparecen en ejemplos básicos, no debe afirmarse formalmente que todos son mandatory sin la especificación privada.

---

# 21. `latitude`

Descripción:

```text
Decimal number up to 6 decimal digits
```

Ejemplo contiene:

```text
-33.4311548
```

que posee más de 6 decimales.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla segura

SHOULD redondear/no exceder 6 decimales si se desea seguir la descripción formal.

Pero el servidor aparentemente ha sido ejemplificado con mayor precisión.

---

# 22. `longitude`

Misma inconsistencia:

Descripción:

```text
up to 6 decimal digits
```

Ejemplo:

```text
-70.5701852
```

tiene más de seis.

Estado:

```text
NEEDS_VERIFICATION
```

---

# 23. Rango geográfico

No se documentan validaciones explícitas:

```text
latitude [-90,90]
longitude [-180,180]
```

Aunque son estándares geográficos, no están declarados por SimpliRoute en esta sección.

Una integración SHOULD validarlos como buena práctica, no como contrato SimpliRoute.

---

# 24. Timestamp

Formato oficial:

```text
YYYY-MM-DD HH:II:SS-00
```

Ejemplo:

```text
2019-02-20 10:35:00-00
```

Timezone:

```text
UTC
```

---

# 25. `HH:II:SS`

La documentación escribe:

```text
HH:II:SS
```

donde `II` parece representar minutos.

Formato habitual sería:

```text
HH:mm:ss
```

Estado:

```text
OFFICIAL_FORMAT_NOTATION / possible notation typo
```

Debe preservarse el ejemplo literal:

```text
2019-02-20 10:35:00-00
```

---

# 26. Offset `-00`

El timestamp usa:

```text
-00
```

y la descripción dice UTC.

No se publica soporte para:

```text
Z
+00:00
-03:00
```

### Regla IA

No asumir ISO 8601 completo intercambiable.

Usar el formato exacto entregado por Professional Services / ejemplo público si no existe otra indicación.

---

# 27. Timestamp del dato vs hora de recepción

El timestamp representa la fecha/hora de la medición.

Esto es especialmente importante durante reenvío de cola:

```text
do not replace stored timestamp with resend time
```

La conservación del timestamp original es `INFERRED` pero esencial para representar correctamente datos históricos.

---

# 28. `vehicleId`

Descripción oficial:

```text
Vehicle ID in SimpliRoute system
```

Ejemplo básico:

```text
JKCT-81
```

Mientras la API Vehicles principal normalmente usa IDs enteros como:

```text
442100
```

Estado:

```text
NEEDS_VERIFICATION
```

### Implicación

`vehicleId` de la integración GPS puede referirse a:

- identificador configurado para GPS;
- patente/referencia externa;
- ID interno;

pero el ejemplo no coincide claramente con el ID numérico de Vehicle API.

MUST confirmar el mapping durante setup con Professional Services.

---

# 29. No mapear `vehicleId` automáticamente a Vehicle.id

Una IA MUST NOT hacer:

```text
gps.vehicleId = vehicle.id
```

sin confirmar.

Puede requerirse mapping externo:

```text
GPS provider vehicle identifier -> SimpliRoute vehicle mapping
```

---

# 30. `providerName`

Descripción:

```text
Name of the vehicle GPS information provider
```

Ejemplo:

```text
LOCALIZAGPS_AGROSUPER
```

Required:

```text
NOT_DOCUMENTED
```

Enum:

```text
NOT_DOCUMENTED
```

No asumir que es libre o pre-registrado; probablemente forma parte del setup.

---

# 31. Temperature object

**Estado:** `OFFICIAL`

Shape:

```json
{
  "value": 2.4,
  "alert_type": null,
  "alert_message": null
}
```

---

# 32. Temperature fields

| Campo | Descripción |
|---|---|
| `value` | Temperatura decimal en grados Celsius. |
| `alert_type` | `"min"` si está bajo límite; `"max"` si está sobre límite. |
| `alert_message` | Mensaje enviado al supervisor de camiones/carga refrigerada. |

---

# 33. Temperatura — unidad

Unidad explícita:

```text
degrees Celsius
```

No Fahrenheit.

---

# 34. `alert_type`

Valores oficialmente mencionados:

```text
min
max
```

y ejemplos muestran:

```json
null
```

Por tanto:

```text
"min"
"max"
null
```

son estados observados.

Enum completo:

```text
PARTIALLY_DOCUMENTED
```

No inventar `normal`, `low`, `high`.

---

# 35. Temperature object deprecated

**Estado:** `OFFICIAL`

La documentación dice que `temperature` es:

```text
backwards compatible but deprecated
```

y recomienda enviar temperatura dentro del objeto de alertas.

### Regla IA

Para nuevas integraciones:

```text
PREFER alert/alerts for temperature
AVOID designing around top-level temperature
```

aunque debe soportarse lectura/escritura legacy si el cliente lo requiere.

---

# 36. Alert Object

Shape:

```json
{
  "name": "door",
  "type": "open",
  "value": true,
  "message": "open door alert"
}
```

---

# 37. Alert fields

| Campo | Descripción |
|---|---|
| `name` | Identificador del tipo de alerta. |
| `type` | Tipo/subtipo de alerta. |
| `value` | Valor de alerta. |
| `message` | Mensaje al supervisor. |

---

# 38. Tipos de `value`

Ejemplos muestran:

```json
true
```

y:

```json
4
```

Por tanto:

```text
alert.value type = polymorphic / NOT_FORMALLY_TYPED
```

Puede ser boolean, number u otros tipos según alerta.

Una IA MUST NOT tiparlo universalmente como string.

---

# 39. `type`

También es dinámico por alerta.

Ejemplos:

```text
open
ºC
```

No existe enum global.

Debe interpretarse de acuerdo con `name`.

---

# 40. `message`

String human-readable para supervisor.

Max length:

```text
NOT_DOCUMENTED
```

---

# 41. `alert` singular

Top-level payload publica:

```text
alert
```

como un objeto.

Ejemplo:

```json
{
  "alert": {
    "name": "door",
    "type": "open",
    "value": true,
    "message": "open door alert"
  }
}
```

---

# 42. `alerts` plural

La sección Alerts dice:

```text
It is possible to send additional variables through an array of objects
```

y muestra:

```json
{
  "alerts": [
    {
      "name": "general",
      "type": "ºC",
      "value": 4,
      "message": "temperature is lower than 5 degrees"
    }
  ]
}
```

---

# 43. `alert` + `alerts` simultáneos

El ejemplo extendido contiene ambos:

```text
alert
alerts
```

Por tanto, la documentación muestra coexistencia.

Semántica exacta de diferencia:

```text
NOT_DOCUMENTED
```

No se explica por qué una alerta va en singular y otras en plural.

---

# 44. Recomendación para nuevas variables

Dado que la documentación dice que variables adicionales pueden enviarse mediante array:

```text
alerts[]
```

un integrador SHOULD preferir esa estructura para múltiples sensores.

Pero esto es una interpretación de diseño; la especificación privada puede indicar requisitos adicionales.

---

# 45. Catálogo oficial de `name`

Nombres publicados:

```text
temperature
geofence
speed
humidity
door
estado
brake
temperature_2
temperature_3
jamming
tiredness
fuel_cap
fuel_variation
driver_door_open
speeding
loss_of_load
no_smoking o smoking
Demurrage
```

---

# 46. Casing de alert names

Hay inconsistencias:

```text
temperature
door
...
Demurrage
```

La mayoría son lowercase, `Demurrage` está capitalizado.

Case sensitivity:

```text
NOT_DOCUMENTED
```

### Regla

Copiar el valor exactamente como lo publique/configure SimpliRoute.

No normalizar automáticamente a lowercase sin coordinación.

---

# 47. `no_smoking o smoking`

La tabla literalmente dice:

```text
no_smoking o smoking
```

donde `o` es probablemente español para “or”.

Estado:

```text
NEEDS_VERIFICATION
```

Posibles values de name podrían ser:

```text
no_smoking
smoking
```

pero la tabla no permite afirmar con absoluta certeza si son dos nombres separados.

### Regla IA

No enviar:

```text
"no_smoking o smoking"
```

como name sin confirmación.

Marcar ambos posibles identifiers para verificar con Professional Services.

---

# 48. `temperature_2` y `temperature_3`

Esto confirma soporte público conceptual de varios sensores de temperatura.

No se documenta:

- sensor mapping;
- unidad distinta;
- límites;
- calibración.

Se presume Celsius por familia de temperatura, pero sólo `temperature` legacy declara unidad.

Estado:

```text
PARTIALLY_DOCUMENTED
```

---

# 49. `humidity`

No se documenta unidad:

```text
percent?
relative humidity?
```

Estado:

```text
NOT_DOCUMENTED
```

No asumir `%` como contrato aunque sea probable.

---

# 50. `speed` / `speeding`

No se documentan unidades:

```text
km/h
mph
m/s
```

Estado:

```text
NOT_DOCUMENTED
```

---

# 51. `fuel_variation`

No se documenta unidad:

```text
liters
percentage
absolute
```

Estado:

```text
NOT_DOCUMENTED
```

---

# 52. `geofence`

No se documenta enum de `type`, por ejemplo:

```text
enter
exit
```

No inventarlo.

---

# 53. Response exitoso publicado

Ejemplo:

```json
{
  "status": "Tracked",
  "id": "2408269119724499",
  "daily_status": "Updated"
}
```

---

# 54. Response fields

| Campo | Tipo observado | Valor ejemplo |
|---|---|---|
| `status` | String | `Tracked` |
| `id` | String | `"2408269119724499"` |
| `daily_status` | String | `Updated` |

Enums completos:

```text
NOT_DOCUMENTED
```

No asumir que `Tracked`/`Updated` son los únicos valores.

---

# 55. Response `id`

No se explica qué representa:

- tracking record ID;
- GPS record ID;
- daily tracking entity;
- event ID.

Estado:

```text
NOT_DOCUMENTED
```

No usarlo como Vehicle ID.

---

# 56. Invalid alerts response

Ejemplo:

```json
{
  "status": "Tracked",
  "id": "2408269119724499",
  "daily_status": "Updated",
  "invalid_alerts": [],
  "invalid_alert": []
}
```

---

# 57. `invalid_alerts` vs `invalid_alert`

La documentación muestra ambos campos simultáneamente:

```text
invalid_alerts
invalid_alert
```

ambos arrays.

No explica la diferencia.

Estado:

```text
NEEDS_VERIFICATION
```

Una IA SHOULD soportar ambos al parsear.

---

# 58. Registro aun con alertas inválidas

El ejemplo se titula:

```text
API response when exist one or more invalid alerts
```

pero mantiene:

```json
{
  "status": "Tracked"
}
```

Esto sugiere que la posición puede almacenarse aunque alguna alerta sea inválida.

Estado:

```text
OFFICIAL_EXAMPLE / INFERRED semantics
```

No asumir atomicidad entre tracking y alerts.

---

# 59. HTTP status codes GPS

La sección GPS no publica:

- 200;
- 201;
- 400;
- 401;
- etc.

Sólo muestra JSON response.

Por tanto:

```text
HTTP success status = NOT_DOCUMENTED
HTTP error codes = NOT_DOCUMENTED for GPS endpoint
```

No extrapolar automáticamente la tabla global si el endpoint puede pertenecer a infraestructura específica.

---

# 60. Error body GPS

`NOT_DOCUMENTED`.

El único error-like output publicado es la presencia de:

```text
invalid_alerts
invalid_alert
```

en un response que sigue siendo `Tracked`.

---

# 61. Batching

Texto oficial:

```text
send data independently
array can cause errors
```

Por tanto diseño recomendado:

```text
1 HTTP POST = 1 vehicle observation
```

El ejemplo array debe tratarse como inconsistencia visual/documental.

---

# 62. Queue model recomendado

Pseudocódigo:

```text
on GPS sample:
    record {
        original_timestamp,
        latitude,
        longitude,
        vehicleId,
        providerName,
        variables
    }

    if network available:
        send sample
    else:
        enqueue sample

on connectivity restored:
    while queue not empty:
        send oldest sample
        wait <= 10 seconds
```

La espera exacta puede ser menor a 10 segundos según wording:

```text
maximum time of 10 seconds between each one
```

---

# 63. Diferencia entre “maximum” y “minimum” durante replay

El texto dice:

```text
maximum time of 10 seconds between each one
```

Esto significa literalmente:

```text
interval <= 10 seconds
```

No:

```text
interval >= 10 seconds
```

Sin embargo, la intención operativa podría ser limitar frecuencia.

Estado:

```text
NEEDS_VERIFICATION wording
```

### Regla

No fijar un scheduler definitivo únicamente desde esta frase; confirmar con Professional Services.

---

# 64. Orden temporal

Para datos almacenados, conservar:

```text
timestamp original
```

y SHOULD enviar FIFO.

Si se envían posiciones viejas fuera de orden, la documentación no explica cómo se actualiza `daily_status`.

Estado:

```text
NOT_DOCUMENTED
```

---

# 65. Datos duplicados

No se documenta deduplicación por:

- timestamp;
- coordinates;
- providerName;
- vehicleId.

No existe idempotency key pública.

Un retry podría crear registros duplicados o ser deduplicado internamente; comportamiento:

```text
NOT_DOCUMENTED
```

---

# 66. Idempotencia

```text
NOT_DOCUMENTED
```

No reintentar indefinidamente sin registrar el resultado.

Para pérdidas de response, estrategia debe acordarse con setup GPS.

---

# 67. Orden de eventos por Vehicle

No existe garantía pública de ordering en servidor.

No asumir que un POST posterior siempre reemplaza correctamente a uno anterior si timestamps llegan desordenados.

---

# 68. Maximum queue size

`NOT_DOCUMENTED`.

El proveedor debe dimensionar almacenamiento local según:

- frecuencia;
- duración potencial de pérdida;
- número de vehículos.

---

# 69. Retención de datos GPS

`NOT_DOCUMENTED`.

No se publica:

- días de storage;
- resolución histórica;
- agregación;
- cleanup.

---

# 70. Accuracy

No hay campo publicado:

```text
accuracy
hdop
satellites
```

No inventarlo.

---

# 71. Heading

No hay campo publicado:

```text
heading
bearing
course
```

No inventarlo.

---

# 72. Speed como campo principal

No existe:

```text
speed
```

top-level en payload base.

La velocidad se modela potencialmente como alert/variable con:

```text
name = speed
```

No inventar top-level `speed`.

---

# 73. Altitude

`NOT_DOCUMENTED`.

No existe campo top-level publicado.

---

# 74. Device ID

`NOT_DOCUMENTED`.

Sólo:

```text
vehicleId
providerName
```

son identificadores del ejemplo.

---

# 75. Driver ID

No forma parte del GPS payload publicado.

La relación con driver se resuelve mediante Vehicle/ruta/configuración interna.

No inventar `driverId`.

---

# 76. Route ID

Tampoco se envía:

```text
route_id
```

en el payload GPS público.

SimpliRoute debe correlacionar posición de Vehicle con operación existente.

Cómo:

```text
NOT_DOCUMENTED
```

---

# 77. Visit ID

No se envía Visit ID.

GPS es telemetría de vehículo, no checkout de visita.

---

# 78. GPS vs Start Route Event

No confundir:

GPS integration:

```text
vehicle position telemetry
```

Start Route:

```http
POST /v1/events/register/
type=ROUTE_STARTED
```

Son flujos distintos.

---

# 79. GPS vs Webhooks

GPS:

```text
external provider -> SimpliRoute
```

Webhooks:

```text
SimpliRoute -> external system
```

Direcciones opuestas.

---

# 80. GPS vs Datamart

La documentación Datamart no lista un dataset GPS específico entre los recursos públicos enumerados.

Por tanto:

```text
read GPS telemetry via Datamart = NOT_DOCUMENTED
```

No inventar `/v1/gps`.

---

# 81. Temperature deprecation migration

Legacy:

```json
{
  "temperature": {
    "value": 2.4,
    "alert_type": "min",
    "alert_message": "..."
  }
}
```

Recomendado conceptualmente:

```json
{
  "alerts": [
    {
      "name": "temperature",
      "type": "...",
      "value": 2.4,
      "message": "..."
    }
  ]
}
```

### Importante

El type exacto para temperatura dentro de `alerts` no está formalmente definido.

El ejemplo `alerts` usa:

```text
name = general
type = ºC
```

No copiar esa traducción como contrato de `temperature`.

---

# 82. Alert validation

Existe concepto de:

```text
invalid alerts
```

lo que implica que SimpliRoute valida nombres/shape en alguna medida.

Reglas exactas:

```text
NOT_DOCUMENTED
```

---

# 83. Unknown alert names

Comportamiento exacto:

```text
PARTIALLY_DOCUMENTED
```

Pueden aparecer en:

```text
invalid_alerts / invalid_alert
```

pero no se muestra contenido de esos arrays.

---

# 84. Alert type matrix

No existe una tabla:

```text
name -> allowed type -> allowed value type
```

Por tanto una IA MUST NOT inventar, por ejemplo:

```text
door.type = open|closed
geofence.type = enter|exit
speed.value = km/h
```

aunque sean intuitivos.

---

# 85. Professional Services es parte obligatoria del workflow

Dado que faltan públicamente:

- endpoint;
- auth;
- exact required fields;
- alert schemas por tipo;
- mapping vehicleId;
- provider registration;

el proceso real debe incluir:

```text
Professional Services setup
```

Esto NO significa que la integración no pueda documentarse; significa que la documentación pública tiene un límite explícito.

---

# 86. Configuración interna recomendada

Ejemplo:

```yaml
simpliroute_gps:
  endpoint: ${SIMPLIROUTE_GPS_ENDPOINT}
  auth:
    scheme: ${SIMPLIROUTE_GPS_AUTH_SCHEME}
    credential: ${SIMPLIROUTE_GPS_CREDENTIAL}
  provider_name: ${SIMPLIROUTE_GPS_PROVIDER_NAME}
```

No hardcodear endpoint/auth hasta recibirlos oficialmente.

---

# 87. DTO GPS recomendado

```json
{
  "latitude": -34.6037,
  "longitude": -58.3816,
  "timestamp": "2026-08-10 21:00:00-00",
  "vehicleId": "<MAPPED_VEHICLE_IDENTIFIER>",
  "providerName": "<REGISTERED_PROVIDER>",
  "alerts": [
    {
      "name": "door",
      "type": "open",
      "value": true,
      "message": "Door opened"
    }
  ]
}
```

El ejemplo usa fields oficiales, pero valores son ficticios.

---

# 88. Validation local recomendada

```text
[ ] endpoint fue entregado oficialmente
[ ] auth fue entregada oficialmente
[ ] vehicleId mapping está confirmado
[ ] providerName está confirmado
[ ] timestamp está en UTC
[ ] timestamp sigue formato requerido
[ ] latitude/longitude son números válidos
[ ] precisión coordinadas acorde al contrato confirmado
[ ] alert.name está soportado
[ ] alert.type/value coinciden con spec privada del tipo
[ ] no se está enviando batch si la integración exige objetos individuales
```

---

# 89. Catálogo de alertas para IA

| `name` publicado | Tipo/value documentado |
|---|---|
| `temperature` | No completo; temperatura Celsius conceptual |
| `geofence` | No documentado |
| `speed` | No documentado |
| `humidity` | No documentado |
| `door` | Ejemplo `type=open`, `value=true` |
| `estado` | No documentado |
| `brake` | No documentado |
| `temperature_2` | No documentado |
| `temperature_3` | No documentado |
| `jamming` | No documentado |
| `tiredness` | No documentado |
| `fuel_cap` | No documentado |
| `fuel_variation` | No documentado |
| `driver_door_open` | No documentado |
| `speeding` | No documentado |
| `loss_of_load` | No documentado |
| `no_smoking` / `smoking` | Naming ambiguo en tabla |
| `Demurrage` | No documentado |

---

# 90. Endpoint inventory de esta etapa

Único contrato público:

| Método | Endpoint | Estado |
|---|---|---|
| `POST` | GPS ingestion endpoint | `NOT_PUBLICLY_DOCUMENTED`; entregado por Professional Services |

No existen públicamente endpoints documentados para:

```text
GET GPS positions
GET latest Vehicle position
DELETE GPS data
PATCH GPS data
GET alerts catalog API
GET GPS providers
POST provider registration
```

---

# 91. Response contract público

Response exitoso observado:

```json
{
  "status": "Tracked",
  "id": "2408269119724499",
  "daily_status": "Updated"
}
```

Response con alertas inválidas observado:

```json
{
  "status": "Tracked",
  "id": "2408269119724499",
  "daily_status": "Updated",
  "invalid_alerts": [],
  "invalid_alert": []
}
```

No existe tabla formal de response fields.

---

# 92. Inconsistencias oficiales detectadas

| Tema | Problema | Estado |
|---|---|---|
| Endpoint | texto dice POST “to the endpoint”, URL ausente | `NOT_PUBLICLY_DOCUMENTED` |
| Auth | no publicada | `NOT_DOCUMENTED` |
| Batching | texto exige independientes, ejemplo root array | `NEEDS_VERIFICATION` |
| Latitude precision | dice max 6 decimales, ejemplo >6 | `NEEDS_VERIFICATION` |
| Longitude precision | dice max 6 decimales, ejemplo >6 | `NEEDS_VERIFICATION` |
| Timestamp notation | usa `II` para minutos | `NEEDS_VERIFICATION` |
| vehicleId | dice SimpliRoute Vehicle ID, ejemplo alfanumérico | `NEEDS_VERIFICATION` |
| Temperature | deprecated pero aún en ejemplo | `OFFICIAL legacy` |
| alert vs alerts | ambos existen, diferencia no explicada | `NEEDS_VERIFICATION` |
| invalid_alerts vs invalid_alert | ambos aparecen, diferencia no explicada | `NEEDS_VERIFICATION` |
| no_smoking o smoking | naming ambiguo | `NEEDS_VERIFICATION` |
| Demurrage casing | distinto al resto | `NEEDS_VERIFICATION` |
| Queue resend 10 sec | wording “maximum” ambiguo operacionalmente | `NEEDS_VERIFICATION` |

---

# 93. Reglas MUST para IA

Una IA MUST:

1. reconocer que el endpoint GPS exacto no es público;
2. obtener setup desde Professional Services;
3. usar POST según contrato público;
4. no asumir auth de la API principal;
5. respetar frecuencia recomendada;
6. implementar buffering ante pérdida de señal;
7. preservar timestamps originales en datos almacenados;
8. enviar observaciones individualmente como regla textual;
9. usar UTC;
10. tratar `vehicleId` como mapping que debe verificarse;
11. preservar `providerName`;
12. preferir alerts sobre temperature legacy;
13. soportar `alert` y `alerts` al parsear/crear según setup;
14. usar sólo nombres de alerts publicados/configurados;
15. manejar `invalid_alerts` e `invalid_alert`.

---

# 94. Reglas MUST NOT para IA

MUST NOT:

1. inventar URL del endpoint GPS;
2. inventar Token/Bearer auth;
3. asumir que GPS usa `/v1/...`;
4. asumir batching está soportado;
5. reemplazar timestamp histórico al reenviar;
6. mapear `vehicleId` directamente a Vehicle.id sin validación;
7. asumir `providerName` libre;
8. diseñar nueva integración sólo con `temperature` deprecated;
9. inventar units de humidity/speed/fuel;
10. inventar enums de alert.type;
11. inventar types de alert.value;
12. asumir HTTP success code;
13. usar response.id como Vehicle ID;
14. asumir alertas inválidas invalidan todo el tracking;
15. inventar read endpoints de posiciones.

---

# 95. Aspectos NOT_DOCUMENTED públicamente

```text
GPS endpoint URL
authentication scheme
authentication credentials
Content-Type explícito
mandatory field matrix
HTTP success status
HTTP error statuses
error response schema
vehicleId mapping rules
providerName registration rules
alert name/type/value matrix
alert validation rules
invalid_alerts content schema
difference invalid_alert vs invalid_alerts
duplicate detection
idempotency
retry on HTTP errors
network timeout
TLS requirements
rate limiting hard
maximum queue size
data retention
GPS read/query API
GPS history API
latest-location API
device identifiers
accuracy
heading
altitude
satellite count
speed unit
humidity unit
fuel unit
geofence type enum
file/message limits
```

---

# 96. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones verificadas:

```text
GPS Integration
Frequency for sending data
Loss of signal and sending of stored local data
Integration of GPS and variable data with SimpliRoute
Payload details
Temperature object
Alert Object
Alerts
Available alerts
```

Hechos clave confirmados:

```text
Professional Services required for setup details
POST method
exact endpoint omitted publicly
20-second recommendation
1 minute/vehicle for fleets >20
local queue recommendation
stored-data replay guidance
independent object sending
GPS payload fields
UTC timestamp format
temperature deprecated
alert/alerts objects
published alert names
Tracked/Updated response examples
invalid alert fields
```

Fecha:

```text
2026-08-10
```

---

# 97. Estado final

**ETAPA 10 COMPLETADA**

Cobertura:

```text
GPS ingestion public contract
frequency
loss of signal
local queues
replay
payload
coordinates
UTC timestamps
vehicle/provider mapping caveats
temperature
alerts
alert catalog
responses
public-documentation limitations
```

La siguiente etapa recomendada es:

```text
11-datamart-complete-reference.md
```

Deberá cubrir:

- Datamart base URL;
- Bearer authentication;
- pagination;
- Content-Range;
- estimated counts;
- todos los datasets publicados;
- `select`;
- conditional filters;
- operadores `eq`, `gt`, `lt`;
- sorting si está publicado;
- relaciones de junction datasets;
- diferencias entre Datamart y API operacional.
