# SimpliRoute Public API --- Etapa 12: Couriers / Providers

**Estado:** COMPLETADO\
**Fecha de verificación:** 2026-08-10\
**Fuente oficial:** `https://documentation.simpliroute.com/`\
**API base:** `https://api.simpliroute.com`\
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

## 1. Objetivo y alcance

Esta etapa documenta toda la superficie pública actual de **Couriers /
Providers**: seguridad, requisitos de cuenta, `Related-Account`, CRUD de
couriers/providers, `provider_type`, validaciones de
nombre/email/teléfono, creación de Visits con asignación asíncrona a
Couriers, códigos HTTP y diferencias respecto de **TMS Transportation
Provider**.

Convenciones:

-   `OFFICIAL`: declarado explícitamente por SimpliRoute.
-   `OFFICIAL_EXAMPLE`: aparece en un ejemplo oficial.
-   `INFERRED`: deducción técnica útil, no contrato.
-   `NOT_DOCUMENTED`: no especificado públicamente.
-   `NEEDS_VERIFICATION`: ambigüedad o inconsistencia de la referencia.

## 2. Conceptos: Courier vs Provider

SimpliRoute define:

-   **Courier**: compañía o individuo responsable de realizar entregas
    para una cuenta.
-   **Provider**: compañía o individuo responsable de proveer vehículos
    u otros recursos de transporte.

Aunque la sección se llama **Couriers / Providers**, el recurso HTTP
publicado es:

``` text
/v1/accounts/couriers/
```

y diferencia el tipo mediante:

``` text
provider_type
```

Valores oficialmente publicados:

``` text
courier
fleet_provider
```

Por lo tanto, el mismo recurso puede representar tanto un Courier como
un proveedor de flota.

## 3. Requisitos de seguridad

Todas las requests deben incluir:

``` http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Header opcional publicado:

``` http
Related-Account: <ACCOUNT_ID>
```

Requisitos adicionales:

1.  el usuario autenticado **debe ser admin**;
2.  la cuenta **debe tener habilitado el courier add-on**.

Sin estas condiciones pueden producirse respuestas `403`.

## 4. `Related-Account`

La tabla oficial publica:

``` text
Related-Account (Optional): {{AccountIdSR}}
```

Uso conceptual:

``` http
Authorization: Token <TOKEN>
Related-Account: <ACCOUNT_ID>
```

La documentación de esta sección no explica exhaustivamente:

-   cuándo es obligatorio;
-   cómo se valida que el token tenga acceso a esa cuenta;
-   si debe usarse para cuentas hijas/relacionadas;
-   qué ocurre con un Account ID válido pero fuera de alcance.

Por lo tanto:

``` text
Related-Account semantics = PARTIALLY_DOCUMENTED
```

No inventar reglas multi-account adicionales.

## 5. Inventario completo de endpoints

  -------------------------------------------------------------------------------
  Método                  Endpoint                        Función
  ----------------------- ------------------------------- -----------------------
  `POST`                  `/v1/accounts/couriers/`        Crear Courier/Provider

  `GET`                   `/v1/accounts/couriers/`        Listar activos

  `GET`                   `/v1/accounts/couriers/{id}/`   Recuperar uno

  `PUT`                   `/v1/accounts/couriers/{id}/`   Actualizar

  `DELETE`                `/v1/accounts/couriers/{id}/`   Eliminar

  `POST`                  `/v1/routes/visits/couriers/`   Crear Visits y disparar
                                                          asignación a Couriers
  -------------------------------------------------------------------------------

No se publican en esta sección:

``` text
PATCH /v1/accounts/couriers/{id}/
GET /v1/accounts/couriers/deleted/
POST /v1/accounts/couriers/bulk/
POST /v1/accounts/couriers/{id}/visits/
GET /v1/accounts/couriers/{id}/visits/
DELETE /v1/accounts/couriers/{id}/visits/{visit_id}/
```

## 6. Crear Courier / Provider

Endpoint:

``` http
POST https://api.simpliroute.com/v1/accounts/couriers/
```

Headers:

``` http
Authorization: Token <TOKEN>
Content-Type: application/json
Related-Account: <ACCOUNT_ID>   # opcional
```

Ejemplo:

``` json
{
  "trade_name": "FedEx Courier",
  "contact_person": "John Doe",
  "contact_email": "ops@example.com",
  "phone_number": "+56912345678, +56987654321",
  "provider_type": "courier"
}
```

## 7. Campos de creación

  ---------------------------------------------------------------------------------
  Campo              Tipo                    Required          Descripción
  ------------------ --------------- ------------------------- --------------------
  `trade_name`       string                     Sí             Nombre comercial

  `legal_name`       string                     No             Nombre legal
                                                               registrado

  `contact_person`   string                     Sí             Persona de contacto

  `contact_email`    string                     No             Uno o varios emails
                                                               separados por coma

  `phone_number`     string                     No             Uno o varios
                                                               teléfonos separados
                                                               por coma

  `address`          string                     No             Dirección física

  `tax_id_number`    string                     No             Identificación
                                                               legal/fiscal

  `reference`        string                     No             Referencia interna

  `provider_type`    string                     Sí             `"courier"` o
                                                               `"fleet_provider"`
  ---------------------------------------------------------------------------------

## 8. `provider_type`

Enum público:

``` text
courier
fleet_provider
```

Semántica:

``` text
courier        -> realiza entregas
fleet_provider -> provee vehículos/recursos de transporte
```

MUST NOT inventar:

``` text
transportation_provider
carrier
driver
fleet
provider
```

como valores válidos.

## 9. Response de creación

Ejemplo conceptual:

``` json
{
  "id": 12345,
  "trade_name": "FedEx Courier",
  "legal_name": "FedEx Legal Name",
  "contact_person": "John Doe",
  "contact_email": "ops@example.com",
  "phone_number": "+56912345678, +56987654321",
  "address": "123 Main St, City",
  "tax_id_number": "123456789",
  "reference": "FedEx Reference",
  "provider_type": "courier"
}
```

El `id` observado es entero.

Tipo formal de `id`:

``` text
INFERRED FROM OFFICIAL_EXAMPLE = Integer
```

## 10. Status codes de creación

    Código Significado
  -------- ----------------------------------------------------
     `201` Successfully created
     `400` Validation error
     `401` Unauthorized: token inválido o ausente
     `403` Forbidden: usuario no admin o add-on deshabilitado
     `500` Internal server error

## 11. Listar Couriers / Providers

Endpoint:

``` http
GET https://api.simpliroute.com/v1/accounts/couriers/
```

La documentación dice explícitamente:

``` text
Returns the list of active couriers for the authenticated account.
```

Por tanto el listado es de **activos**.

El ejemplo contiene tanto:

``` text
provider_type = courier
```

como:

``` text
provider_type = fleet_provider
```

Así que "List Couriers" devuelve en la práctica ambos tipos
representados por el recurso.

## 12. Response de listado

Root:

``` text
Array
```

Cada elemento expone en los ejemplos:

``` text
id
trade_name
legal_name
contact_person
contact_email
phone_number
address
tax_id_number
reference
provider_type
```

## 13. Filtros y paginación del listado

No se documentan:

``` text
provider_type=
trade_name=
reference=
limit=
offset=
page=
```

Por lo tanto:

``` text
filters = NOT_DOCUMENTED
pagination = NOT_DOCUMENTED
```

No inventarlos.

## 14. Status codes de listado

    Código Significado
  -------- -----------------------
     `200` List of couriers
     `401` Unauthorized
     `403` Forbidden
     `500` Internal server error

## 15. Recuperar Courier / Provider

Endpoint:

``` http
GET https://api.simpliroute.com/v1/accounts/couriers/{id}/
```

Devuelve el detalle del recurso específico.

Response observado:

``` json
{
  "id": 101,
  "trade_name": "Express Delivery",
  "legal_name": "Express Delivery S.A.",
  "contact_person": "Alice Smith",
  "contact_email": "alice@example.com,billing@example.com",
  "phone_number": "+56911112222,+56933334444",
  "address": "123 Main St, Santiago",
  "tax_id_number": "12345678-9",
  "reference": "Main courier for region north",
  "provider_type": "courier"
}
```

Nota documental: el ejemplo oficial publicado tiene un error JSON de
coma faltante entre `reference` y `provider_type`. Debe interpretarse
como dos propiedades separadas.

## 16. Status codes de retrieve

    Código Significado
  -------- -----------------------
     `200` Courier found
     `401` Unauthorized
     `403` Forbidden
     `404` Not found
     `500` Internal server error

## 17. Actualizar Courier / Provider

Endpoint:

``` http
PUT https://api.simpliroute.com/v1/accounts/couriers/{id}/
```

La documentación dice:

``` text
The fields are the same as in creation.
```

Pero el ejemplo oficial de `PUT` envía solamente:

``` json
{
  "trade_name": "Express Delivery Updated",
  "contact_person": "Alice Smith Updated"
}
```

y el response conserva otros campos existentes.

## 18. PUT aparentemente parcial

Esto es importante.

Aunque el método es `PUT`, el ejemplo demuestra actualización con un
subconjunto de campos.

Estado:

``` text
OFFICIAL_EXAMPLE supports partial-looking PUT
```

No obstante, la documentación no define formalmente:

-   si cualquier campo puede omitirse;
-   si `provider_type` puede omitirse siempre;
-   si enviar `null` borra un campo;
-   diferencia semántica con PATCH.

Para máxima seguridad, usar sólo campos que se quieran actualizar **si
el comportamiento ha sido validado**, siguiendo el ejemplo oficial.

## 19. Response de update

El response devuelve el recurso actualizado según el ejemplo.

Status codes:

    Código Significado
  -------- -----------------------
     `200` Courier updated
     `400` Validation error
     `401` Unauthorized
     `403` Forbidden
     `404` Not found
     `500` Internal server error

## 20. PATCH

No se documenta PATCH para este recurso.

MUST NOT inventar:

``` http
PATCH /v1/accounts/couriers/{id}/
```

aunque otras áreas de SimpliRoute sí utilicen PATCH.

## 21. Eliminar Courier / Provider

Endpoint:

``` http
DELETE https://api.simpliroute.com/v1/accounts/couriers/{id}/
```

Body:

``` text
empty / NOT_DOCUMENTED
```

Successful response:

``` text
204
```

## 22. Delete y "active couriers"

La validación de `trade_name` habla de unicidad:

``` text
only among active couriers
```

y DELETE responde `404` si está:

``` text
not found or already deleted
```

Esto sugiere un modelo de eliminación lógica/estado activo.

Estado:

``` text
INFERRED FROM OFFICIAL WORDING
```

No afirmar implementación interna de soft-delete como contrato.

## 23. Status codes de delete

    Código Significado
  -------- ------------------------------
     `204` Successfully deleted
     `401` Unauthorized
     `403` Forbidden
     `404` Not found or already deleted
     `500` Internal server error

## 24. Validación de `trade_name`

Regla oficial:

``` text
Must be unique per account (case-insensitive), only among active couriers.
```

Esto significa:

``` text
"Express"
"express"
"EXPRESS"
```

colisionan conceptualmente dentro de la misma cuenta si ambos están
activos.

Scope:

``` text
per account
```

No global.

## 25. Reutilización de nombre de un eliminado

La regla limita unicidad a:

``` text
active couriers
```

Por tanto parece permitir reutilizar el nombre de uno
eliminado/inactivo.

Estado:

``` text
INFERRED FROM OFFICIAL VALIDATION
```

Debe validarse runtime antes de depender de ello.

## 26. `contact_email`

Puede contener múltiples emails separados por coma:

``` text
ops@example.com,billing@example.com
```

Cada uno debe tener formato email válido.

No es un JSON array.

MUST enviar:

``` json
{
  "contact_email": "ops@example.com,billing@example.com"
}
```

No asumir soporte para:

``` json
{
  "contact_email": [
    "ops@example.com",
    "billing@example.com"
  ]
}
```

## 27. Normalización de emails

La documentación dice:

``` text
Extra commas or spaces in emails/phones are automatically cleaned.
```

Por tanto entradas como:

``` text
" ops@example.com, , billing@example.com "
```

son normalizadas por backend en alguna medida.

Algoritmo exacto:

``` text
NOT_DOCUMENTED
```

No depender de normalización extrema; limpiar localmente.

## 28. `phone_number`

Puede contener múltiples teléfonos separados por coma.

Cada teléfono debe cumplir:

``` text
E.164
```

Ejemplos:

``` text
+56912345678
+56987654321
```

## 29. E.164

Formato esperado conceptualmente:

``` text
+<country_code><subscriber_number>
```

No enviar formatos locales como:

``` text
09 1234 5678
(011) 1234-5678
```

si no cumplen E.164.

La validación exacta de longitud/códigos depende del estándar y backend.

## 30. Normalización de teléfonos

Espacios y comas extra son limpiados automáticamente.

Ejemplo de input oficial:

``` text
"+56912345678, +56987654321"
```

El listado puede devolver:

``` text
"+56911112222,+56933334444"
```

Esto evidencia normalización de espacios alrededor de comas.

## 31. `contact_person`

Required en creación.

Max length:

``` text
NOT_DOCUMENTED
```

## 32. `legal_name`

Optional.

Unicidad:

``` text
NOT_DOCUMENTED
```

## 33. `tax_id_number`

Optional string.

Formato fiscal por país:

``` text
NOT_DOCUMENTED
```

No imponer RUT/CUIT/RFC/etc. como regla SimpliRoute global.

## 34. `reference`

Optional string.

Unicidad:

``` text
NOT_DOCUMENTED
```

No tratarlo como idempotency key.

## 35. `address`

Optional string.

No se documenta geocoding ni validación para el Courier.

## 36. Courier Visits Creation and Assignment

Endpoint:

``` http
POST https://api.simpliroute.com/v1/routes/visits/couriers/
```

Objetivo oficial:

``` text
create visits and have couriers assigned to them after creation
```

## 37. Request body

Root:

``` text
Array<Visit>
```

Ejemplo:

``` json
[
  {
    "title": "Visit Alpha",
    "address": "123 Baker St, London",
    "latitude": "51.5237",
    "longitude": "-0.1585",
    "planned_date": "2025-07-10"
  },
  {
    "title": "Visit Beta",
    "address": "456 Fleet St, London",
    "latitude": "51.5145",
    "longitude": "-0.1062",
    "planned_date": "2025-07-10"
  }
]
```

## 38. Campos mínimos de Visit

El ejemplo usa:

``` text
title
address
latitude
longitude
planned_date
```

Pero la documentación general de Visits establece como mínimos:

``` text
title
address
planned_date
```

No existe en la sección Couriers una tabla específica de required fields
que contradiga esto.

Por tanto, las reglas del Visit Object general deben aplicarse salvo
validaciones adicionales del endpoint.

## 39. ¿Dónde se indica qué Courier asignar?

Este es un punto crítico.

El payload público de ejemplo **no incluye**:

``` text
courier_id
provider_id
courier
provider
```

Sin embargo el endpoint declara que la asignación a Couriers ocurre
después de crear las Visits.

Por lo tanto:

``` text
assignment selection algorithm/configuration = NOT_DOCUMENTED
```

MUST NOT inventar un `courier_id` dentro del payload.

## 40. Asignación asíncrona

La documentación dice explícitamente:

``` text
Visit assignment to couriers is performed in the background after visit creation.
```

Flujo:

``` text
POST visits/couriers
        |
        v
Visits created
        |
        +--> HTTP response returns created Visits
        |
        v
background assignment service
        |
        v
Courier assignment becomes visible later
```

## 41. Response no contiene assignment

Regla oficial:

``` text
The response only includes the created visits, not the assignment.
```

Por tanto una respuesta `201` NO demuestra que la asignación ya esté
finalizada.

## 42. Response de creación de Visits

Root:

``` text
Array<Visit>
```

Los ejemplos muestran campos estándar de Visit:

``` text
id
order
tracking_id
status
title
address
latitude
longitude
load
load_2
load_3
window_start
window_end
window_start_2
window_end_2
duration
contact_name
contact_phone
contact_email
reference
notes
skills_required
skills_optional
tags
planned_date
programmed_date
route
estimated_time_arrival
estimated_time_departure
...
```

La documentación abrevia el objeto con `...`; no constituye schema
completo nuevo.

Para el Visit Object completo debe usarse la etapa de Visits.

## 43. Cómo verificar assignment

La documentación indica:

``` text
You can check the assignment result later using the standard visits endpoint.
```

Endpoint estándar:

``` http
GET /v1/routes/visits/{visit_id}/
```

El Visit Object general expone:

``` text
driver
vehicle
route
```

y otros datos operacionales.

La propiedad exacta que identifica al Courier asignado no se especifica
en esta sección.

Por tanto:

``` text
exact courier-assignment response field = NOT_DOCUMENTED
```

## 44. Polling

La documentación dice "check later", pero no publica:

-   intervalo recomendado;
-   número de retries;
-   timeout total;
-   webhook específico de courier assignment.

No implementar polling agresivo.

## 45. Status codes de Visits/Couriers

    Código Significado
  -------- ---------------------------------------------
     `201` Visits created
     `400` Validation error
     `401` Unauthorized
     `403` Courier add-on not enabled
     `500` Internal error
     `502` Error communicating with assignment service
     `504` Assignment service timeout

## 46. Importancia de `502`

`502` significa:

``` text
Error communicating with assignment service
```

Esto revela que la asignación depende de un servicio separado.

No asumir automáticamente que ninguna Visit fue creada.

Atomicidad create-vs-assignment:

``` text
NOT_DOCUMENTED
```

Antes de reintentar un `502`, verificar si las Visits fueron creadas
para evitar duplicados.

## 47. Importancia de `504`

`504`:

``` text
Assignment service timeout
```

Tampoco garantiza que la asignación haya fallado definitivamente.

Puede ser resultado desconocido.

### Regla segura

Ante `502`/`504`:

1.  no recrear ciegamente;
2.  reconciliar mediante Visits estándar;
3.  usar `reference` externa si el diseño lo permite para detectar
    duplicados;
4.  reintentar sólo con política controlada.

La estrategia de reconciliación es recomendación, no contrato oficial.

## 48. Idempotencia

No se documenta:

``` text
Idempotency-Key
```

ni deduplicación automática de Visits.

Por tanto:

``` text
POST /v1/routes/visits/couriers/ = NOT_DOCUMENTED as idempotent
```

## 49. Atomicidad batch

No se explica si, ante una Visit inválida dentro del array:

-   falla todo el batch;
-   se crean las válidas;
-   retorna errores por elemento.

Estado:

``` text
NOT_DOCUMENTED
```

## 50. Máximo de Visits por request

`NOT_DOCUMENTED`.

No existe límite público en esta sección.

## 51. Courier assignment y `provider_type`

La documentación no dice explícitamente si el assignment service asigna
sólo recursos con:

``` text
provider_type = courier
```

o también:

``` text
fleet_provider
```

Dado el nombre "Courier Visits", sería razonable pensar en Couriers,
pero:

``` text
assignment provider_type eligibility = NOT_DOCUMENTED
```

No asumir.

## 52. Courier vs TMS Transportation Provider

Son APIs diferentes.

### Couriers / Providers

Base:

``` text
https://api.simpliroute.com
```

Resource:

``` text
/v1/accounts/couriers/
```

ID observado:

``` text
Integer
```

Tipos:

``` text
courier
fleet_provider
```

Requisitos:

``` text
admin
courier add-on
```

Puede crear Visits y disparar assignment a Couriers.

### TMS Transportation Provider

Base declarada:

``` text
https://api-gateway.simpliroute.com/tms/api/v1
```

Resource:

``` text
/transportation-providers/
```

ID usado en asociaciones:

``` text
UUID
```

Requisito:

``` text
TMS service contracted
```

Asociación publicada:

``` text
Transportation Provider <-> Vehicle
```

## 53. No mezclar IDs

MUST NOT asumir:

``` text
Courier.id == TransportationProvider.id
```

Ejemplos:

``` text
Courier.id                 -> 101
TransportationProvider.id  -> UUID
```

Son dominios/API diferentes.

## 54. No mezclar `provider_type`

`provider_type` pertenece al recurso:

``` text
/v1/accounts/couriers/
```

No está documentado en TMS Transportation Provider.

TMS usa un campo:

``` text
status
```

y su propio modelo.

## 55. Comparativa rápida

  ---------------------------------------------------------------------------------
  Característica          Couriers / Providers       TMS Transportation Provider
  ----------------------- -------------------------- ------------------------------
  Base                    `api.simpliroute.com`      `api-gateway.../tms/api/v1`

  Resource                `/v1/accounts/couriers/`   `/transportation-providers/`

  ID observado            Integer                    UUID

  Auth                    Token                      Token

  Add-on/service          Courier add-on             TMS contratado

  Admin requerido         Sí, explícito              No especificado igual

  Tipos                   `courier`,                 No enum equivalente publicado
                          `fleet_provider`           

  Relación                Visits → Courier async     Vehicle ↔ Transportation
                                                     Provider

  Related-Account         Opcional publicado         No publicado igual

  Validación email/phone  Sí                         No detallada igual
  ---------------------------------------------------------------------------------

## 56. Errores generales relevantes

Además de códigos específicos, la API general de SimpliRoute documenta:

``` text
400 Bad Request
401 Unauthorized
404 Not Found
405 Method Not Allowed
406 Not Acceptable
500 Internal Server Error
503 Service Unavailable
```

Los endpoints Couriers publican sus propios status codes específicos.
Priorizar esas tablas al modelar cada operación.

## 57. Ejemplo robusto de creación

``` bash
curl --location \
  'https://api.simpliroute.com/v1/accounts/couriers/' \
  --header 'Authorization: Token <TOKEN>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "trade_name": "Courier Demo",
    "legal_name": "Courier Demo S.A.",
    "contact_person": "Operations",
    "contact_email": "ops@example.com,billing@example.com",
    "phone_number": "+541112345678,+541187654321",
    "address": "Example 123",
    "tax_id_number": "TAX-123",
    "reference": "ERP-COURIER-001",
    "provider_type": "courier"
  }'
```

Valores ficticios.

## 58. Ejemplo con Related-Account

``` bash
curl --location \
  'https://api.simpliroute.com/v1/accounts/couriers/' \
  --header 'Authorization: Token <TOKEN>' \
  --header 'Related-Account: <ACCOUNT_ID>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "trade_name": "Fleet Demo",
    "contact_person": "Operations",
    "provider_type": "fleet_provider"
  }'
```

## 59. Ejemplo list

``` bash
curl \
  'https://api.simpliroute.com/v1/accounts/couriers/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json'
```

## 60. Ejemplo retrieve

``` bash
curl \
  'https://api.simpliroute.com/v1/accounts/couriers/101/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json'
```

## 61. Ejemplo update

``` bash
curl -X PUT \
  'https://api.simpliroute.com/v1/accounts/couriers/101/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "trade_name": "Courier Demo Updated",
    "contact_person": "New Contact"
  }'
```

## 62. Ejemplo delete

``` bash
curl -X DELETE \
  'https://api.simpliroute.com/v1/accounts/couriers/101/' \
  -H 'Authorization: Token <TOKEN>'
```

Expected success:

``` text
204
```

## 63. Ejemplo creación + assignment de Visits

``` bash
curl \
  'https://api.simpliroute.com/v1/routes/visits/couriers/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "title": "Order 1001",
      "address": "Example Street 100",
      "latitude": "-34.6037",
      "longitude": "-58.3816",
      "planned_date": "2026-08-11",
      "reference": "ORDER-1001"
    }
  ]'
```

La respuesta contiene la Visit creada, **no el assignment final**.

## 64. Flujo recomendado de integración

``` text
1. Verify user is admin
2. Verify courier add-on is enabled
3. Create/list Courier or fleet_provider
4. Validate unique trade_name locally where possible
5. Normalize emails
6. Normalize phones to E.164
7. POST Visits to /v1/routes/visits/couriers/
8. Persist returned Visit IDs
9. Treat assignment as asynchronous
10. Query standard Visit endpoint later
11. Reconcile 502/504 before retrying creation
```

## 65. Validaciones locales recomendadas

Antes de crear/actualizar:

``` text
[ ] trade_name present
[ ] contact_person present
[ ] provider_type in {"courier", "fleet_provider"}
[ ] contact_email values separated by comma
[ ] every email syntactically valid
[ ] phone values separated by comma
[ ] every phone in E.164
[ ] no unnecessary spaces/empty comma segments
[ ] Related-Account only if integration requires it
```

## 66. Inconsistencias y ambigüedades oficiales

  ------------------------------------------------------------------------
  Tema                    Observación             Estado
  ----------------------- ----------------------- ------------------------
  Nombre de sección       "Couriers / Providers", `OFFICIAL`
                          resource se llama       
                          `couriers`              

  List                    dice active couriers    `OFFICIAL_EXAMPLE`
                          pero devuelve           
                          `fleet_provider`        
                          también                 

  Retrieve JSON           falta coma antes de     `OFFICIAL_TEXT typo`
                          `provider_type`         

  Update                  dice fields same as     `NEEDS_VERIFICATION`
                          creation pero ejemplo   
                          manda sólo 2            

  PUT                     funciona como update    `OFFICIAL_EXAMPLE`
                          parcial en ejemplo      

  Assignment payload      no contiene courier ID  `NOT_DOCUMENTED`

  Assignment response     no contiene assignment  `OFFICIAL`

  502/504                 atomicidad Visit        `NOT_DOCUMENTED`
                          creation/assignment no  
                          explicada               

  Related-Account         header publicado,       `PARTIALLY_DOCUMENTED`
                          semántica incompleta    

  Deleted courier         wording sugiere estado  `INFERRED`
                          activo/soft-delete      
  ------------------------------------------------------------------------

## 67. Reglas MUST para una IA

Una IA MUST:

1.  usar `https://api.simpliroute.com`;
2.  usar `Authorization: Token ...`;
3.  verificar que el usuario sea admin;
4.  verificar courier add-on;
5.  considerar `Related-Account` opcional y no inventar su scope;
6.  usar `/v1/accounts/couriers/`;
7.  usar `provider_type` sólo con `courier` o `fleet_provider`;
8.  exigir `trade_name`, `contact_person` y `provider_type` al crear;
9.  validar unicidad case-insensitive de `trade_name` por cuenta activa;
10. modelar emails/teléfonos como strings separados por coma;
11. validar teléfonos E.164;
12. usar POST `/v1/routes/visits/couriers/` para creación con
    assignment;
13. tratar assignment como background/asíncrono;
14. entender que response `201` contiene Visits, no assignment;
15. reconciliar `502`/`504` antes de reintentar ciegamente.

## 68. Reglas MUST NOT para una IA

MUST NOT:

1.  confundir Courier con TMS Transportation Provider;
2.  reutilizar IDs entre ambos módulos;
3.  inventar `provider_type` adicionales;
4.  enviar emails/teléfonos como arrays sin evidencia;
5.  asumir `reference` único;
6.  asumir `tax_id_number` con formato universal;
7.  inventar PATCH;
8.  inventar filtros/list pagination;
9.  inventar `courier_id` en el payload de Visits;
10. asumir que assignment ya terminó cuando llega `201`;
11. asumir que `502`/`504` significa cero Visits creadas;
12. asumir que `fleet_provider` es elegible para assignment de Visits;
13. inventar un endpoint de assignment manual;
14. asumir que DELETE es físicamente destructivo;
15. asumir semántica multi-account completa de `Related-Account`.

## 69. Aspectos públicamente NOT_DOCUMENTED

``` text
Courier ID formal type declaration
pagination
filters
sorting
search by trade_name
search by provider_type
maximum page/list size
PATCH
bulk create
bulk delete
restore deleted courier
explicit active/status field
soft-delete implementation
reference uniqueness
legal_name uniqueness
tax_id validation by country
field max lengths
Related-Account authorization rules
Related-Account error behavior
courier assignment algorithm
courier selection criteria
assignment result field
assignment polling interval
assignment SLA
assignment webhook
assignment retry policy
assignment atomicity
502 partial-success semantics
504 eventual-success semantics
maximum Visits per courier batch
batch partial-failure behavior
idempotency key
fleet_provider assignment eligibility
```

## 70. Fuente oficial

Referencia primaria:

``` text
https://documentation.simpliroute.com/
```

Secciones verificadas:

``` text
Couriers / Providers
Objective
Security and Requirements
Create Courier
List Couriers
Retrieve Courier
Update Courier
Delete Courier
Field Validations
Courier Visits Creation and Assignment
```

Contrato público confirmado:

``` text
Authorization Token
Related-Account optional
admin requirement
courier add-on requirement
Courier/Provider CRUD
provider_type courier|fleet_provider
trade_name uniqueness
comma-separated emails
comma-separated E.164 phones
automatic comma/space cleanup
async Courier Visit assignment
201/400/401/403/500/502/504 semantics
```

## 71. Estado final

**ETAPA 12 COMPLETADA**

Cobertura:

``` text
Couriers / Providers
security
admin requirement
courier add-on
Related-Account
CRUD
provider_type
field validations
email normalization
phone E.164
Courier Visit creation
background assignment
assignment error handling
Courier vs TMS Transportation Provider
```

### Próxima etapa sugerida

``` text
13-changelog-and-final-public-api-audit.md
```

Objetivo:

-   revisar el changelog público;
-   detectar endpoints/funcionalidades agregadas que no hayan quedado en
    etapas anteriores;
-   cruzar el índice completo de la documentación oficial contra las
    etapas 1--12;
-   generar una matriz final `endpoint -> etapa -> cobertura`;
-   identificar cualquier endpoint público faltante;
-   cerrar la documentación con una auditoría de cobertura completa.
