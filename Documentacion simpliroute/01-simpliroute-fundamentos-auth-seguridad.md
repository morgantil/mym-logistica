# SimpliRoute Public API — Etapa 1: Fundamentos, autenticación y seguridad

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Objetivo:** definir el contrato transversal que debe conocer cualquier integración o agente de IA antes de consumir endpoints específicos.

---

# 1. Propósito de este documento

Este documento describe los fundamentos comunes de la API pública de SimpliRoute:

- arquitectura y protocolo;
- bases URL;
- autenticación;
- headers;
- formatos de request/response;
- seguridad;
- códigos HTTP generales;
- diferencias entre API principal, Datamart y TMS;
- restricciones de acceso públicamente documentadas;
- reglas de implementación para IA;
- aspectos NO documentados que no deben asumirse.

Este archivo debe leerse antes de implementar cualquier endpoint de los módulos posteriores.

---

# 2. Convenciones de confiabilidad

Cada afirmación se clasifica con estas etiquetas:

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | SimpliRoute lo declara explícitamente en su documentación pública. |
| `OFFICIAL_EXAMPLE` | Aparece en un ejemplo oficial, pero no necesariamente está descrito como regla contractual. |
| `INFERRED` | Deducción técnica basada en material oficial. No debe tratarse como garantía de SimpliRoute. |
| `NOT_DOCUMENTED` | La documentación pública revisada no define ese comportamiento. |
| `NEEDS_VERIFICATION` | La documentación pública presenta una inconsistencia, ambigüedad o información incompleta. |

## Regla para agentes de IA

Una IA:

- MUST usar información `OFFICIAL` como contrato prioritario.
- MUST distinguir ejemplos de requisitos normativos.
- MUST NOT inventar valores no documentados.
- MUST NOT asumir que un comportamiento de un endpoint se aplica automáticamente a todos.
- MUST marcar las inconsistencias en lugar de resolverlas mediante suposición.
- MUST tratar tokens, JWT, API keys y headers de autenticación como secretos.

---

# 3. Arquitectura general

**Estado:** `OFFICIAL`

SimpliRoute describe su API principal como un conjunto de endpoints REST.

Base URL declarada:

```text
https://api.simpliroute.com
```

Características declaradas por SimpliRoute:

- endpoints REST;
- URLs orientadas a recursos;
- uso de verbos HTTP;
- códigos de respuesta HTTP para indicar errores;
- autenticación HTTP mediante header;
- respuestas JSON;
- errores también expresados en JSON;
- soporte de CORS.

## 3.1 Construcción de URL

Forma general:

```text
{BASE_URL}{PATH}
```

Ejemplo:

```text
https://api.simpliroute.com/v1/accounts/me/
```

donde:

```text
BASE_URL = https://api.simpliroute.com
PATH     = /v1/accounts/me/
```

---

# 4. HTTPS

## 4.1 Base oficial

**Estado:** `OFFICIAL`

La base URL presentada por SimpliRoute utiliza HTTPS:

```text
https://api.simpliroute.com
```

## 4.2 Ejemplos históricos con HTTP

**Estado:** `NEEDS_VERIFICATION`

En algunas secciones antiguas de la documentación, especialmente Accounting, existen ejemplos que contienen:

```text
http://api.simpliroute.com/...
```

mientras que la introducción oficial y gran parte de la documentación moderna declaran:

```text
https://api.simpliroute.com
```

### Regla de implementación

Una integración nueva SHOULD usar:

```text
https://api.simpliroute.com
```

y MUST NOT interpretar los ejemplos históricos con `http://` como recomendación de seguridad.

Esto se basa en que la base oficial declarada actualmente es HTTPS.

---

# 5. Familias de API y autenticación

SimpliRoute expone más de una superficie HTTP con contratos de autenticación distintos.

## 5.1 API principal

**Estado:** `OFFICIAL`

Base:

```text
https://api.simpliroute.com
```

Autenticación:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Ejemplo:

```bash
curl -X GET \
  'https://api.simpliroute.com/v1/accounts/me/' \
  -H 'Authorization: Token <SIMPLIROUTE_API_TOKEN>' \
  -H 'Content-Type: application/json'
```

---

## 5.2 Datamart API

**Estado:** `OFFICIAL`

Datamart usa una base y un esquema de autenticación diferentes.

Base:

```text
https://api-gateway.simpliroute.com/datamart
```

Autenticación:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

SimpliRoute indica que el token de Datamart se obtiene mediante Customer Support.

Ejemplo conceptual:

```bash
curl --location \
  'https://api-gateway.simpliroute.com/datamart/v1/visits' \
  -H 'Authorization: Bearer <DATAMART_TOKEN>'
```

### Regla crítica

```text
Token <...>    !=    Bearer <...>
```

Una IA MUST NOT reutilizar automáticamente el API Token de la API principal como Bearer token de Datamart.

---

## 5.3 TMS API

**Estado:** `OFFICIAL` + `NEEDS_VERIFICATION`

Para servicios TMS, la documentación declara esta base:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

y requiere:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Sin embargo, varios ejemplos de cURL TMS muestran URLs del tipo:

```text
https://api.simpliroute.com/tms/api/v1/...
```

### Inconsistencia oficial

La documentación pública contiene dos hosts en el contexto TMS:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

y, en ejemplos:

```text
https://api.simpliroute.com/tms/api/v1
```

### Regla para IA

Hasta documentar y validar endpoint por endpoint:

```text
TMS_BASE_URL = NEEDS_VERIFICATION
```

No se debe convertir una de las dos variantes en "verdad oficial única" sin registrar la discrepancia.

---

# 6. Autenticación de la API principal

## 6.1 Header

**Estado:** `OFFICIAL`

Todas las llamadas que requieren autenticación utilizan:

```http
Authorization: Token <API_KEY>
```

Formato exacto:

```text
Authorization
:
Token
<espacio>
TOKEN
```

Ejemplo:

```http
Authorization: Token abc123
```

NO:

```http
Authorization: Bearer abc123
```

para la API principal.

---

# 7. Endpoint de cuenta/autenticación

## GET `/v1/accounts/me/`

**Estado:** `OFFICIAL`

### URL

```text
https://api.simpliroute.com/v1/accounts/me/
```

### Método

```http
GET
```

### Headers

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

### Ejemplo cURL

```bash
curl -X GET \
  'https://api.simpliroute.com/v1/accounts/me/' \
  -H 'Authorization: Token <SIMPLIROUTE_API_TOKEN>' \
  -H 'Content-Type: application/json'
```

### Propósito documentado

SimpliRoute presenta este endpoint dentro de su sección de autenticación y lo utiliza como llamada de ejemplo para comprobar el uso del API token.

### Response schema

**Estado:** `NOT_DOCUMENTED` en la sección específica revisada.

La documentación muestra la llamada, pero no define en ese apartado un contrato exhaustivo de campos del response.

Una IA MUST NOT inventar el schema de `/v1/accounts/me/`.

---

# 8. Obtención del API token principal

**Estado:** `OFFICIAL`

SimpliRoute indica que el token puede obtenerse desde la información de perfil de la cuenta en su aplicación:

```text
https://app2.simpliroute.com/#/uprofile/info
```

La documentación también ofrece registro/trial para cuentas nuevas.

## Regla operativa

El token:

- representa credencial de acceso;
- debe ser reemplazado en los ejemplos por el token real del entorno;
- no es el token ficticio mostrado en la documentación.

---

# 9. Tokens ficticios en la documentación oficial

**Estado:** `OFFICIAL`

SimpliRoute aclara que los tokens presentes en sus ejemplos son falsos.

Por ejemplo:

```text
12345678900987sr
```

debe considerarse:

```text
EXAMPLE_ONLY
```

Nunca debe almacenarse como credencial de producción.

---

# 10. Seguridad del API token

## 10.1 No exponer en frontend

**Estado:** `OFFICIAL`

La introducción de SimpliRoute indica que, aunque existe soporte CORS y puede interactuarse desde una aplicación client-side, el secreto/API key nunca debe exponerse en código público del cliente.

### Consecuencia

Patrón inseguro:

```javascript
fetch("https://api.simpliroute.com/v1/routes/visits/", {
  headers: {
    Authorization: "Token REAL_PRODUCTION_TOKEN"
  }
});
```

si ese JavaScript se entrega públicamente al navegador.

Patrón recomendado:

```text
Frontend
   |
   v
Backend propio
   |
   | Authorization: Token <secret>
   v
SimpliRoute
```

---

# 11. Recomendaciones de gestión de secretos

Las siguientes son buenas prácticas de implementación.

**Estado:** `INFERRED / INDUSTRY_BEST_PRACTICE`

No deben confundirse con requisitos contractuales adicionales de SimpliRoute.

Un consumidor SHOULD:

- guardar tokens en secret managers o variables de entorno protegidas;
- evitar hardcodear credenciales;
- evitar versionarlas en Git;
- ocultarlas en logs;
- rotarlas si existe sospecha de exposición;
- restringir acceso interno al secreto;
- separar credenciales de desarrollo, test y producción cuando el esquema de cuenta lo permita;
- nunca devolver el token al frontend;
- evitar incluirlo en mensajes de error;
- redactarlo en sistemas de observabilidad.

Ejemplo:

```env
SIMPLIROUTE_API_TOKEN=***
```

Código conceptual:

```text
token = secret_store.get("SIMPLIROUTE_API_TOKEN")
```

---

# 12. CORS

**Estado:** `OFFICIAL`

SimpliRoute declara soporte de Cross-Origin Resource Sharing (CORS).

Sin embargo:

```text
CORS support != permission to expose API credentials
```

La propia documentación advierte que el secreto no debe quedar en código público client-side.

---

# 13. Headers comunes

## 13.1 Authorization

Para API principal:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Para Datamart:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

---

## 13.2 Content-Type JSON

La documentación utiliza repetidamente:

```http
Content-Type: application/json
```

para endpoints cuyos bodies son JSON.

Ejemplo:

```http
POST /v1/routes/visits/
Content-Type: application/json
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

---

## 13.3 Accept

**Estado:** `OFFICIAL_EXAMPLE`

Algunos endpoints, en particular ejemplos TMS, utilizan:

```http
Accept: application/json
```

No está documentado globalmente como header obligatorio para toda la API.

Por lo tanto:

```text
Accept: application/json
```

puede enviarse cuando corresponda, pero una IA MUST NOT marcarlo globalmente como mandatory salvo que el endpoint lo requiera explícitamente.

---

# 14. Content types distintos de JSON

No todos los requests utilizan JSON.

## 14.1 JSON

Común:

```http
Content-Type: application/json
```

---

## 14.2 multipart/form-data

**Estado:** `OFFICIAL`

Existen endpoints que requieren archivos binarios.

Ejemplo: TMS Documents.

La documentación declara que el archivo debe enviarse como binario usando:

```text
multipart/form-data
```

y NO como URL.

Otro ejemplo: carga de imágenes de visitas:

```http
POST /v1/routes/visits/multiple/pictures/
```

con parámetros de formulario como:

```text
visits
image
```

### Regla IA

MUST NOT serializar archivos binarios dentro de JSON cuando el endpoint oficial exige multipart.

---

# 15. JSON como formato de respuesta

**Estado:** `OFFICIAL`

SimpliRoute declara:

- todas las respuestas de API usan JSON;
- los errores también usan JSON.

## Precaución

La forma exacta del JSON de error NO es necesariamente uniforme entre todos los servicios.

Por ejemplo, existen secciones oficiales con formas diferentes:

### Ejemplo de error

```json
{
  "statusCode": 400,
  "message": "Country value is required"
}
```

### Otro ejemplo 5XX

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

### Regla crítica

Una IA MUST NOT implementar un único parser rígido del tipo:

```text
error.message siempre existe
```

a menos que el endpoint específico garantice ese schema.

---

# 16. Verbos HTTP

SimpliRoute usa los verbos HTTP estándares.

Ejemplos públicos:

```text
GET
POST
PUT
PATCH
DELETE
```

## Convención típica

| Método | Uso general observado |
|---|---|
| `GET` | recuperar/listar recursos |
| `POST` | crear recursos o ejecutar acciones |
| `PUT` | actualización completa o endpoints de acción/configuración |
| `PATCH` | actualización parcial |
| `DELETE` | eliminación |

### Regla

**Estado:** `OFFICIAL` para endpoints concretos; `INFERRED` como generalización.

No debe asumirse CRUD uniforme en todos los recursos.

El método exacto debe provenir de la referencia del endpoint.

---

# 17. PUT vs PATCH

En recursos donde la documentación distingue ambos:

- `PATCH` se usa como actualización parcial;
- `PUT` se presenta como actualización completa.

Ejemplo Visit:

```http
PATCH /v1/routes/visits/{visit_id}/
PUT   /v1/routes/visits/{visit_id}/
```

En PATCH, la documentación indica explícitamente que los parámetros no enviados permanecen sin cambios.

### Regla para IA

No usar PUT como reemplazo automático de PATCH.

No asumir que PUT preservará campos omitidos salvo que la documentación del recurso lo garantice.

---

# 18. Trailing slash `/`

La documentación frecuentemente usa rutas terminadas en `/`:

```text
/v1/accounts/me/
/v1/routes/visits/
/v1/accounts/drivers/
```

pero existen ejemplos sin slash final en algunas familias:

```text
/tms/api/v1/vehicles/{vehicle_id}/block
```

### Estado

`NEEDS_VERIFICATION` como regla global.

### Recomendación

Copiar exactamente el path documentado para cada endpoint.

No construir una regla universal de añadir/quitar `/`.

---

# 19. Versionado

La mayoría de endpoints públicos principales utilizan prefijo:

```text
/v1/
```

TMS:

```text
/tms/api/v1/
```

Datamart:

```text
/datamart/v1/
```

### Estado

`OFFICIAL`

### No documentado

La referencia revisada NO define públicamente una política global detallada de:

- lifecycle de versiones;
- fecha de retiro de v1;
- SLA de deprecación;
- estrategia de semantic versioning.

Por lo tanto:

```text
API_VERSION_DEPRECATION_POLICY = NOT_DOCUMENTED
```

---

# 20. Códigos HTTP generales

SimpliRoute publica una tabla general de errores.

| Código | Significado oficial |
|---:|---|
| `400` | Bad Request — request inválido; revisar tipos e información enviada. |
| `401` | Unauthorized — API key incorrecta. |
| `404` | Not Found — no se encontraron resultados/recurso. |
| `405` | Method Not Allowed — método HTTP inválido para el endpoint. |
| `406` | Not Acceptable — se solicitó un formato que no es JSON. |
| `500` | Internal Server Error — problema interno del servidor; intentar nuevamente más tarde. |
| `503` | Service Unavailable — servicio temporalmente fuera de línea/mantenimiento; intentar más tarde. |

---

# 21. Códigos adicionales documentados por módulos

La tabla general NO contiene todos los códigos observados en endpoints específicos.

Ejemplos públicos adicionales:

```text
200
201
204
403
422
```

Por ejemplo, Couriers documenta:

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `400 Validation error`
- `500 Internal server error`

TMS Documents documenta, según operación:

- `200`
- `201`
- `400`
- `401`
- `404`
- `422`
- `500`

### Regla crítica

La tabla general de Errors no debe interpretarse como lista exhaustiva de todos los status codes que puede emitir toda la plataforma.

Cada endpoint tendrá su propia tabla en los documentos posteriores.

---

# 22. Interpretación recomendada de errores

## 400 Bad Request

**OFFICIAL**

Significa request inválido, incluyendo problemas de datos/tipos.

IA SHOULD:

- validar payload;
- revisar tipos;
- revisar campos obligatorios;
- no reintentar infinitamente sin modificar el request.

---

## 401 Unauthorized

**OFFICIAL**

La tabla general lo asocia con API key incorrecta.

IA SHOULD revisar:

```text
Authorization header presente
scheme correcto: Token vs Bearer
token correcto
token de la API correcta
```

---

## 403 Forbidden

**OFFICIAL para endpoints específicos**

No figura en la tabla global histórica, pero sí está publicado en APIs como Couriers/TMS.

Puede representar falta de autorización/permisos para la operación.

No debe confundirse con `401`.

---

## 404 Not Found

**OFFICIAL**

Recurso/resultados no encontrados.

El significado específico puede variar según endpoint.

---

## 405 Method Not Allowed

**OFFICIAL**

Método incorrecto.

Ejemplo conceptual:

```text
POST a endpoint que sólo admite GET
```

---

## 406 Not Acceptable

**OFFICIAL**

La tabla general lo relaciona con solicitar un formato distinto de JSON.

---

## 422

**OFFICIAL para módulos específicos**

TMS documenta `422` para payload con errores de formato o validación en determinados endpoints.

No debe generalizarse como respuesta universal de todos los endpoints.

---

## 500 Internal Server Error

**OFFICIAL**

Problema interno del servidor.

La documentación general indica intentar nuevamente luego.

---

## 503 Service Unavailable

**OFFICIAL**

Servicio temporalmente indisponible o en mantenimiento.

---

# 23. Retry

## 23.1 500

La documentación indica:

```text
Try again later
```

por lo que existe una indicación explícita de reintento posterior.

## 23.2 503

También indica:

```text
Please try again later
```

## 23.3 Estrategia de backoff

**Estado:** `NOT_DOCUMENTED`

La documentación pública general revisada no especifica:

- cantidad máxima de retries;
- exponential backoff;
- jitter;
- header `Retry-After`;
- tiempos de espera.

### Recomendación de ingeniería

`INFERRED / BEST_PRACTICE`

Un cliente robusto puede implementar exponential backoff con límites para fallos transitorios, pero NO debe presentar parámetros concretos como regla oficial de SimpliRoute.

---

# 24. Rate limits / throttling

**Estado:** `NOT_DOCUMENTED` para API general.

En la documentación pública revisada no se encontró una política global del tipo:

```text
N requests / second
N requests / minute
429 Too Many Requests
X-RateLimit-*
```

Tampoco se encontró `429` en la referencia pública revisada.

### Regla IA

MUST NOT inventar límites.

MUST NOT programar lógica dependiente de headers `X-RateLimit-*` como si fueran garantizados.

---

# 25. Excepción: recomendaciones de frecuencia GPS

GPS sí posee recomendaciones explícitas de frecuencia.

**Estado:** `OFFICIAL`

SimpliRoute recomienda aproximadamente:

- máximo 1 dato por vehículo cada 20 segundos;
- para flotas de más de 20 vehículos: 1 dato por minuto por vehículo.

En recuperación tras pérdida de señal, la documentación habla de reenvío de datos acumulados con un máximo de tiempo de 10 segundos entre ellos.

Esto es específico de GPS y NO equivale a un rate limit global de la API REST.

---

# 26. Timeouts

**Estado:** `NOT_DOCUMENTED`

No se encontró un timeout HTTP contractual global publicado.

Una IA MUST NOT afirmar:

```text
timeout = 30 seconds
```

o cualquier otro valor como regla oficial.

El cliente deberá definir su timeout local según necesidades de implementación.

---

# 27. Idempotencia

**Estado:** `NOT_DOCUMENTED` como política global.

No se encontró en la referencia general una convención documentada como:

```http
Idempotency-Key: ...
```

ni garantías globales de idempotencia para POST.

### Regla IA

MUST NOT asumir que repetir:

```http
POST /...
```

es seguro.

Antes de reintentar operaciones de creación se debe consultar el comportamiento específico del recurso, IDs/referencias disponibles y documentación correspondiente.

---

# 28. Correlation IDs / Request IDs

**Estado:** `NOT_DOCUMENTED`

No se encontró una convención global pública garantizada para:

```text
X-Request-ID
Correlation-ID
trace-id
```

No asumirla.

---

# 29. User-Agent

**Estado:** `NOT_DOCUMENTED`

No se documenta obligación global de un `User-Agent` particular.

---

# 30. Account context y Related-Account

En la sección Couriers existe un header adicional:

```http
Related-Account: <AccountIdSR>
```

marcado como opcional.

Esquema publicado:

| Header | Valor |
|---|---|
| `Authorization` | `Token {{TokenSR}}` |
| `Related-Account` | `{{AccountIdSR}}` opcional |

### Restricciones adicionales de Couriers

Para esa funcionalidad, la documentación indica:

- el usuario debe ser administrador;
- la cuenta debe tener habilitado el courier add-on.

### Regla IA

MUST NOT añadir `Related-Account` a todos los endpoints por defecto.

Su uso se documentará en el módulo Couriers.

---

# 31. Funcionalidades condicionadas por contratación/add-ons

La existencia pública de un endpoint NO significa necesariamente que todas las cuentas puedan utilizarlo.

Ejemplos oficiales:

## Couriers

Requiere:

```text
admin user
courier add-on enabled
```

## TMS

La documentación señala explícitamente que ciertos servicios sólo están disponibles para clientes que los hayan contratado.

## Extra fields

La documentación indica que pueden requerir habilitación en la cuenta y contacto con Customer Success.

### Regla IA

Separar:

```text
PUBLICLY_DOCUMENTED
```

de:

```text
AVAILABLE_FOR_EVERY_ACCOUNT
```

No son equivalentes.

---

# 32. Datamart: token separado

Datamart requiere token obtenido por Customer Support.

Base:

```text
https://api-gateway.simpliroute.com/datamart
```

Auth:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

Esto debe modelarse como una configuración separada.

Ejemplo de configuración:

```yaml
simpliroute:
  api:
    base_url: https://api.simpliroute.com
    token: ${SIMPLIROUTE_API_TOKEN}

  datamart:
    base_url: https://api-gateway.simpliroute.com/datamart
    bearer_token: ${SIMPLIROUTE_DATAMART_TOKEN}
```

---

# 33. Datamart pagination

Aunque se documentará exhaustivamente en su módulo, hay una diferencia transversal importante.

**Estado:** `OFFICIAL`

Datamart devuelve hasta:

```text
500 resultados por página
```

y usa:

```text
offset
limit
```

Ejemplo:

```text
/v1/visits?offset=500
```

o:

```text
/v1/visits?limit=10&offset=20
```

Response header:

```http
Content-Range: ...
```

Para resultados superiores a 100.000, el total puede no entregarse salvo que se envíe:

```http
Prefer: count=estimated
```

### Regla

Esta paginación pertenece a **Datamart**.

MUST NOT extrapolarse automáticamente a `/v1/routes/visits/` ni a otros endpoints de la API principal.

---

# 34. JSON arrays vs objects

SimpliRoute utiliza ambos formatos dependiendo del endpoint.

Ejemplo de creación de visitas:

```json
[
  {
    "title": "Example",
    "address": "Example address",
    "planned_date": "2026-08-10"
  }
]
```

Otros endpoints esperan objeto:

```json
{
  "visits": [123, 456]
}
```

### Regla IA

MUST respetar el root JSON documentado:

```text
array != object
```

No envolver o desenvolver payloads arbitrariamente.

---

# 35. Tipos de identificadores

La API pública usa distintos tipos de identificador según recurso.

En la documentación aparecen:

- enteros;
- UUID;
- strings/references;
- tracking IDs;
- IDs de cuenta;
- IDs de visita;
- IDs de ruta;
- IDs de vehículo.

### Regla IA

Nunca convertir todos los IDs al mismo tipo.

El tipo exacto será especificado recurso por recurso.

---

# 36. Fechas y horas

No existe una única forma global documentada para todos los campos.

Se observan, entre otros:

## Date

```text
YYYY-MM-DD
```

Ejemplo:

```text
2026-08-10
```

## ISO 8601 timestamps

Ejemplo:

```text
2024-04-24T14:20:45.446Z
```

## Time

Ejemplo:

```text
HH:mm:ss
```

## Otros formatos históricos específicos

Algunas integraciones, como GPS, documentan formatos propios.

### Regla IA

MUST usar el formato declarado por cada campo.

MUST NOT normalizar automáticamente todos los timestamps antes de verificar el contrato.

---

# 37. Timezone

**Estado:** `PARTIALLY_DOCUMENTED`

Algunos endpoints/campos utilizan:

- ISO 8601 con `Z`;
- timestamps con offset;
- fechas sin zona;
- GPS explícitamente UTC.

No se encontró una política global única que declare una timezone universal para todos los recursos.

### Regla IA

No asumir UTC para cualquier campo sólo porque otros endpoints lo usan.

Documentar campo por campo.

---

# 38. Null vs campo omitido

La documentación contiene numerosos ejemplos con:

```json
null
```

pero no existe una regla global que declare que:

```text
null == omitted
```

### Regla IA

MUST distinguir:

- campo omitido;
- campo presente con `null`;
- string vacío `""`;
- array vacío `[]`.

No asumir equivalencia semántica.

---

# 39. Empty values

Ejemplos oficiales utilizan valores como:

```json
"contact_name": ""
```

y:

```json
"contact_email": null
```

Esto demuestra que el API puede representar ausencia de distintas maneras según campo.

No generalizar una política de normalización sin documentación específica.

---

# 40. Case sensitivity

**Estado:** `NOT_DOCUMENTED` globalmente.

No se encontró una política general para:

- nombres de campos;
- valores enum;
- query params;
- references.

Los ejemplos deben copiarse exactamente.

---

# 41. Authentication failure flow

Algoritmo recomendado para una IA:

```text
1. Identificar qué familia API se va a consumir.
2. Si API principal:
      Authorization: Token <api_token>
3. Si Datamart:
      Authorization: Bearer <datamart_token>
4. Si TMS:
      usar Token, pero verificar host/base del endpoint.
5. Si retorna 401:
      verificar token, scheme y entorno.
6. Si retorna 403:
      verificar permisos/add-on/rol/contratación del servicio.
7. Nunca imprimir el token en logs.
```

---

# 42. Ejemplo de cliente HTTP seguro

Ejemplo conceptual, no SDK oficial:

```python
import os
import requests

BASE_URL = "https://api.simpliroute.com"
TOKEN = os.environ["SIMPLIROUTE_API_TOKEN"]

headers = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

response = requests.get(
    f"{BASE_URL}/v1/accounts/me/",
    headers=headers,
    timeout=30,  # valor local de ejemplo, NO oficial
)

response.raise_for_status()
data = response.json()
```

### Importante

```text
timeout=30
```

es sólo una decisión del consumidor del ejemplo.

SimpliRoute no publica ese timeout como contrato global.

---

# 43. Ejemplo de cliente Datamart

```python
import os
import requests

BASE_URL = "https://api-gateway.simpliroute.com/datamart"
TOKEN = os.environ["SIMPLIROUTE_DATAMART_TOKEN"]

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
}

response = requests.get(
    f"{BASE_URL}/v1/visits?limit=100&offset=0",
    headers=headers,
)
```

No usar:

```python
"Authorization": f"Token {TOKEN}"
```

en Datamart.

---

# 44. Logging seguro

Recomendado:

```text
GET /v1/routes/visits/?planned_date=2026-08-10 -> 200
```

No recomendado:

```text
Authorization: Token abcdef123456...
```

Una IA generadora de integración SHOULD agregar filtros de redacción:

```text
Authorization -> ***
api_token      -> ***
bearer_token   -> ***
```

---

# 45. Manejo recomendado de status codes

Pseudocódigo:

```text
response = call()

if 200 <= status < 300:
    parse_success()

elif status == 400:
    surface_validation_error()
    do_not_retry_same_payload_blindly()

elif status == 401:
    check_credentials()

elif status == 403:
    check_permissions_account_addon()

elif status == 404:
    handle_not_found()

elif status == 405:
    developer_error_wrong_http_method()

elif status == 406:
    verify_requested_response_format()

elif status == 422:
    inspect_endpoint_specific_validation_error()

elif status in [500, 503]:
    classify_as_transient_candidate()
    retry_with_local_policy_if_safe()

else:
    preserve_status_and_body_for_diagnostics()
```

Esta estrategia combina códigos oficiales con buenas prácticas y NO representa un SDK oficial.

---

# 46. Retry y operaciones mutables

Especial cuidado con:

```text
POST
PUT
PATCH
DELETE
```

Como no existe política global pública de idempotencia, un fallo de red ambiguo puede generar situaciones como:

```text
cliente no recibió response
pero servidor sí creó el recurso
```

Una IA SHOULD:

- usar referencias externas/IDs de negocio cuando el recurso las soporte;
- consultar si el recurso ya existe antes de recrearlo cuando sea viable;
- evitar retry automático ciego de POST;
- documentar estrategia específica por recurso.

---

# 47. Seguridad en webhooks

Los webhooks se documentarán completamente en una etapa posterior.

Desde el punto de vista de fundamentos:

- SimpliRoute permite configurar URL destino;
- permite configurar headers asociados al webhook;
- dichos headers pueden contener datos de autenticación definidos por el integrador.

### Regla

Un secreto de webhook configurado por el cliente también debe tratarse como secreto.

No debe confundirse:

```text
Authorization usado para llamar SimpliRoute
```

con:

```text
Authorization/header que SimpliRoute enviará a TU webhook
```

Son direcciones de autenticación distintas.

---

# 48. Credenciales y scopes

**Estado:** `NOT_DOCUMENTED` globalmente.

La documentación principal no expone un modelo OAuth público general con scopes del tipo:

```text
visits:read
routes:write
```

La autenticación principal documentada es mediante API Token.

Datamart utiliza Bearer token.

Una IA MUST NOT inventar OAuth scopes.

---

# 49. OAuth

**Estado:** `NOT_DOCUMENTED` como mecanismo general público de la API principal.

No implementar OAuth 2.0 para `/v1/routes/...` sólo por convención de otras APIs.

Usar:

```http
Authorization: Token ...
```

---

# 50. API key en query string

**Estado:** `NOT_DOCUMENTED`

No se documenta autenticación como:

```text
?api_key=...
?token=...
```

Por lo tanto MUST usar header según la documentación.

---

# 51. Basic Auth

**Estado:** `NOT_DOCUMENTED`

No usar:

```http
Authorization: Basic ...
```

para la API principal.

---

# 52. Bearer en API principal

**Estado:** `NOT_DOCUMENTED / INCORRECT_CONTRACT`

La documentación de API principal exige:

```http
Authorization: Token ...
```

Bearer está documentado para Datamart.

Por tanto una IA no debe sustituir el scheme.

---

# 53. Seguridad de datos sensibles

Las entidades logísticas pueden contener:

- nombres;
- teléfonos;
- emails;
- direcciones;
- coordenadas;
- fotografías;
- firmas;
- datos operativos;
- información de entregas.

SimpliRoute documenta campos de este tipo en sus recursos.

### Recomendación de implementación

`BEST_PRACTICE`

El integrador SHOULD:

- limitar logging de payloads;
- proteger backups;
- controlar accesos;
- cifrar secretos;
- cumplir políticas de privacidad aplicables;
- evitar volcar PII completa en errores y trazas.

Este apartado es orientación de seguridad y no pretende reemplazar términos legales de SimpliRoute.

---

# 54. Ambigüedades detectadas en documentación oficial

## 54.1 TMS host

Declaración:

```text
https://api-gateway.simpliroute.com/tms/api/v1
```

Ejemplos:

```text
https://api.simpliroute.com/tms/api/v1/...
```

Estado:

```text
NEEDS_VERIFICATION
```

---

## 54.2 Accounting HTTP vs HTTPS

Algunos ejemplos muestran:

```text
http://api.simpliroute.com
```

mientras la base global oficial es:

```text
https://api.simpliroute.com
```

Regla:

```text
usar HTTPS para integraciones nuevas
```

---

## 54.3 Error schema no uniforme

La documentación muestra múltiples shapes.

Estado:

```text
NO_GLOBAL_ERROR_BODY_SCHEMA_CONFIRMED
```

---

# 55. Aspectos no documentados globalmente

Al 2026-08-10, en la referencia pública revisada no se encontró una definición global explícita para:

| Tema | Estado |
|---|---|
| Rate limit API principal | `NOT_DOCUMENTED` |
| HTTP 429 global | `NOT_DOCUMENTED` |
| Headers `X-RateLimit-*` | `NOT_DOCUMENTED` |
| Timeout servidor global | `NOT_DOCUMENTED` |
| Idempotency-Key | `NOT_DOCUMENTED` |
| Política global de idempotencia | `NOT_DOCUMENTED` |
| SLA | `NOT_DOCUMENTED` en referencia técnica revisada |
| Retry-After | `NOT_DOCUMENTED` |
| Correlation/request ID | `NOT_DOCUMENTED` |
| OAuth scopes API principal | `NOT_DOCUMENTED` |
| Refresh token API principal | `NOT_DOCUMENTED` |
| Expiración global del API Token | `NOT_DOCUMENTED` |
| Rotación automática de token | `NOT_DOCUMENTED` |
| Sandbox API separado | `NOT_DOCUMENTED` |
| Política global de timezone | `NOT_DOCUMENTED` |
| Política global de trailing slash | `NOT_DOCUMENTED` |
| Schema universal de errores | `NOT_DOCUMENTED` |
| Límite global de tamaño de payload | `NOT_DOCUMENTED` |
| Compresión HTTP requerida | `NOT_DOCUMENTED` |

Una IA MUST preservar estos `UNKNOWN` en lugar de completar valores plausibles.

---

# 56. Configuración recomendada para una aplicación

Ejemplo:

```yaml
simpliroute:
  main_api:
    base_url: https://api.simpliroute.com
    auth_scheme: Token
    token_env: SIMPLIROUTE_API_TOKEN

  datamart:
    base_url: https://api-gateway.simpliroute.com/datamart
    auth_scheme: Bearer
    token_env: SIMPLIROUTE_DATAMART_TOKEN

  tms:
    documented_base_url: https://api-gateway.simpliroute.com/tms/api/v1
    example_base_url: https://api.simpliroute.com/tms/api/v1
    auth_scheme: Token
    verification_status: NEEDS_VERIFICATION
```

---

# 57. Reglas MUST / MUST NOT para IA

## MUST

Una IA que programe contra SimpliRoute MUST:

1. identificar la familia API antes de escoger autenticación;
2. usar `Token` en API principal;
3. usar `Bearer` en Datamart;
4. enviar JSON cuando el endpoint espere JSON;
5. respetar multipart cuando el endpoint requiera archivo;
6. preservar métodos HTTP exactos;
7. respetar schemas endpoint por endpoint;
8. tratar 401 y 403 de forma diferenciada;
9. preservar cuerpos de error para diagnóstico sin loguear secretos;
10. consultar los documentos específicos antes de construir payloads.

## MUST NOT

MUST NOT:

1. inventar endpoint;
2. inventar query params;
3. inventar campos;
4. inventar enums;
5. asumir rate limits;
6. asumir idempotencia;
7. hardcodear tokens;
8. exponer tokens en frontend;
9. usar Bearer para API principal por defecto;
10. usar Token para Datamart por defecto;
11. asumir que todos los endpoints comparten error schema;
12. asumir que todos los endpoints usan `application/json`;
13. tratar ejemplos HTTP históricos como preferibles a HTTPS;
14. asumir que una API pública está habilitada en todas las cuentas.

---

# 58. Checklist previo a implementar cualquier endpoint

Antes de programar:

```text
[ ] ¿Cuál es la familia API?
[ ] ¿Cuál es el base URL exacto?
[ ] ¿Qué auth scheme usa?
[ ] ¿Necesita add-on/contratación?
[ ] ¿Qué método HTTP usa?
[ ] ¿Qué Content-Type usa?
[ ] ¿Qué path params requiere?
[ ] ¿Qué query params acepta?
[ ] ¿El body raíz es objeto o array?
[ ] ¿Cuáles campos son required?
[ ] ¿Qué campos permiten null?
[ ] ¿Qué enums existen?
[ ] ¿Qué date/time format usa?
[ ] ¿Cuál es el response success?
[ ] ¿Qué status codes documenta ese endpoint?
[ ] ¿El POST es seguro de reintentar?
[ ] ¿Hay identificador externo para deduplicación?
[ ] ¿La documentación contiene una ambigüedad?
```

---

# 59. Fuentes oficiales verificadas

Fuente principal:

```text
https://documentation.simpliroute.com/
```

Secciones públicas utilizadas en esta etapa:

- Introduction
- Authentication
- Errors
- Datamart
- Couriers / Providers → Security and Requirements
- TMS: Transportation provider
- TMS: Documents
- TMS: Vehicles – Block / Unblock
- GPS Integration
- ejemplos de Visits / Checkout / Webhooks para verificar headers y formatos

Fecha de revisión:

```text
2026-08-10
```

---

# 60. Estado final de la Etapa 1

**COMPLETADO**

Queda establecido el contrato transversal:

```text
API principal
  Base: https://api.simpliroute.com
  Auth: Authorization: Token <TOKEN>

Datamart
  Base: https://api-gateway.simpliroute.com/datamart
  Auth: Authorization: Bearer <TOKEN>

TMS
  Base declarada: https://api-gateway.simpliroute.com/tms/api/v1
  Ejemplos también usan: https://api.simpliroute.com/tms/api/v1
  Auth: Authorization: Token <TOKEN>
  Estado host: NEEDS_VERIFICATION
```

La documentación pública NO define un rate limit global, 429 global, política de idempotencia, timeout global ni un schema de error universal.

La siguiente etapa recomendada es:

```text
02-visits-items-checkout.md
```

que deberá documentar exhaustivamente:

- Visit Object;
- Property Object;
- Extra fields;
- Observations;
- Tags;
- Items;
- creación individual y masiva;
- retrieve;
- sellers;
- agregar items;
- DELETE individual;
- DELETE masivo;
- query por fecha;
- PATCH;
- PUT;
- Visit detail;
- checkout;
- validación de time windows;
- proceso de checkout completo relacionado con Visits;
- schemas request/response;
- tipos;
- required/optional/null;
- errores y edge cases.
