# SimpliRoute Public API — Etapa 11: Datamart — Referencia Completa

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base URL:** `https://api-gateway.simpliroute.com/datamart`  
**Autenticación:** `Authorization: Bearer <DATAMART_TOKEN>`

---

# 1. Objetivo

Este documento cubre exhaustivamente la superficie pública oficial encontrada para Datamart de SimpliRoute:

- propósito del Datamart;
- diferencias con la API operacional;
- base URL;
- autenticación Bearer;
- obtención del token;
- paginación;
- límite máximo por página;
- `offset`;
- `limit`;
- header `Content-Range`;
- conteos mayores a 100.000;
- header `Prefer: count=estimated`;
- los 28 servicios/datasets publicados;
- tablas de relación/junction datasets;
- selección de columnas con `select`;
- filtros condicionales;
- operadores `eq`, `gt`, `lt`;
- sorting no documentado;
- ejemplos de extracción completa;
- reglas para agentes de IA.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción técnica útil, no garantía contractual. |
| `NOT_DOCUMENTED` | No especificado públicamente. |
| `NEEDS_VERIFICATION` | Existe contradicción, ambigüedad o falta de precisión. |

---

# 3. Qué es Datamart

**Estado:** `OFFICIAL`

SimpliRoute describe Datamart como:

```text
a REST API for data querying
```

Su finalidad es consultar datos.

No está documentado como API operacional para crear/modificar recursos.

Modelo:

```text
Operational API:
  create/update/delete operational entities

Datamart:
  query/read analytical and relational data
```

---

# 4. Base URL

Base oficial:

```text
https://api-gateway.simpliroute.com/datamart
```

Los datasets agregan:

```text
/v1/{dataset}
```

Ejemplo:

```text
https://api-gateway.simpliroute.com/datamart/v1/visits
```

---

# 5. Autenticación

Datamart espera:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

Ejemplo oficial:

```bash
curl --location \
  'https://api-gateway.simpliroute.com/datamart/v1/visits' \
  -H 'Authorization: Bearer <DATAMART_TOKEN>'
```

---

# 6. Token de Datamart

**Estado:** `OFFICIAL`

El token se obtiene mediante:

```text
Customer Support
```

No se obtiene mediante el mismo flujo público del API Token principal.

---

# 7. Datamart Token ≠ API Token principal

API operacional:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

Datamart:

```http
Authorization: Bearer <DATAMART_TOKEN>
```

Una IA MUST NOT intercambiar estos esquemas.

---

# 8. Bearer token example

La documentación publica un JWT-like token de ejemplo.

Todo token de ejemplo debe tratarse como:

```text
EXAMPLE_ONLY
```

Nunca usarlo como credencial real.

---

# 9. Métodos HTTP

Los ejemplos y descripción de Datamart documentan consultas:

```http
GET
```

No se documentan:

```text
POST
PUT
PATCH
DELETE
```

para datasets.

### Regla IA

Datamart debe modelarse como read/query API.

MUST NOT usarlo para mutaciones.

---

# 10. Paginación — máximo por página

**Estado:** `OFFICIAL`

Datamart entrega como máximo:

```text
500 resultados por página
```

---

# 11. `offset`

Para obtener la siguiente página:

```text
offset
```

Ejemplo segunda página con page size máximo:

```text
/datamart/v1/visits?offset=500
```

---

# 12. `limit`

Permite solicitar menos de 500 resultados.

Ejemplo:

```text
/datamart/v1/visits?limit=10&offset=20
```

Esto pide:

```text
10 resultados
comenzando desde offset 20
```

---

# 13. Default de `limit`

La documentación dice máximo 500, pero no declara formalmente:

```text
default limit = 500
```

Estado:

```text
NEEDS_VERIFICATION
```

Puede inferirse que sin `limit` se entrega hasta 500, pero no debe codificarse como garantía contractual más allá del máximo.

---

# 14. Valores permitidos de `limit`

Máximo:

```text
500
```

Mínimo:

```text
NOT_DOCUMENTED
```

Comportamiento de:

```text
limit=0
limit=-1
limit=501
```

no está documentado.

---

# 15. `offset` inicial

Ejemplos implican:

```text
offset=0
```

para primera página, pero no lo declaran formalmente.

Una IA puede usar `0` como convención estándar.

Estado:

```text
INFERRED
```

---

# 16. Response Header `Content-Range`

**Estado:** `OFFICIAL`

Los response headers siempre incluyen:

```http
Content-Range: ...
```

Este header indica:

- tamaño/rango de la página;
- total de resultados, cuando está disponible.

---

# 17. Sintaxis exacta de `Content-Range`

La documentación no publica un ejemplo literal del valor, por ejemplo:

```text
0-499/1000
```

Por tanto:

```text
exact Content-Range syntax = NOT_DOCUMENTED
```

No crear un parser que dependa de una forma no verificada.

---

# 18. Más de 100.000 resultados

**Estado:** `OFFICIAL`

Cuando hay más de:

```text
100,000
```

resultados, el total:

```text
won't be provided
```

por defecto.

---

# 19. `Prefer: count=estimated`

Para solicitar total estimado en datasets con más de 100.000 resultados:

```http
Prefer: count=estimated
```

Ejemplo:

```bash
curl \
  'https://api-gateway.simpliroute.com/datamart/v1/visits?limit=500&offset=0' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Prefer: count=estimated'
```

---

# 20. Exactitud de `count=estimated`

Por definición de la documentación:

```text
estimated
```

No debe tratarse como conteo exacto.

---

# 21. Total cuando <= 100.000

La documentación dice que `Content-Range` indica total.

Por tanto para conjuntos no mayores al threshold debería encontrarse total.

Forma exacta:

```text
NOT_DOCUMENTED
```

---

# 22. Algoritmo de paginación recomendado

```text
offset = 0
limit = 500

LOOP:
    GET dataset?limit=500&offset=offset

    process rows

    IF returned rows < limit:
        STOP

    offset += limit
```

Si `Content-Range` se parsea de forma verificada, puede usarse para optimizar finalización.

---

# 23. Riesgo de paginación por offset

La documentación no garantiza snapshot consistency.

Si el dataset cambia mientras se recorren páginas:

```text
rows could theoretically move between offsets
```

Estado:

```text
NOT_DOCUMENTED
```

Para cargas críticas, definir estrategia temporal/filtros si el dataset ofrece columnas adecuadas.

---

# 24. Dataset inventory completo

La documentación pública actual enumera **28 datasets**:

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

---

# 25. Dataset `/v1/visits`

URL:

```text
https://api-gateway.simpliroute.com/datamart/v1/visits
```

Propósito:

```text
acceso a Visits
```

Las propiedades conceptuales están relacionadas con el Visit Object documentado en Etapa 2.

### Importante

Datamart puede exponer columnas normalizadas o IDs adicionales no idénticos al JSON operacional.

La documentación no publica schema completo de columnas Datamart.

MUST NOT asumir 1:1 perfecto.

---

# 26. Dataset `/v1/plans`

Propósito:

```text
acceso a Plans
```

Relacionable con Etapa 3.

---

# 27. Dataset `/v1/routes`

Propósito:

```text
acceso a Routes
```

Relacionable con Etapa 3.

---

# 28. Dataset `/v1/extrafielddefinitions`

Propósito:

```text
definiciones de Extra Fields
```

Permite consultar configuración de formulario de checkout.

---

# 29. Dataset `/v1/extrafieldoptions`

Propósito:

```text
opciones predefinidas de Extra Fields
```

Aplicable cuando un Extra Field utiliza opciones predefinidas.

---

# 30. Dataset `/v1/vehicles`

Propósito:

```text
acceso a Vehicles
```

Relacionable con Etapa 4.

---

# 31. Dataset `/v1/vehicles_skills`

**Tipo:** relationship/junction dataset.

Propósito:

```text
Skills asociadas a Vehicles
```

Representa relación:

```text
Vehicle <-> Skill
```

---

# 32. Dataset `/v1/fleets`

Propósito:

```text
Fleet master
```

Una Fleet representa grupo de Vehicles.

---

# 33. Dataset `/v1/vehicles_fleets`

**Tipo:** relationship/junction dataset.

Propósito:

```text
relación Fleet <-> Vehicle
```

---

# 34. Dataset `/v1/fleets_users`

**Tipo:** relationship/junction dataset.

Propósito:

```text
usuarios asociados a Fleet
```

La documentación dice que suelen ser usuarios con rol:

```text
driver
```

pero no exclusivamente.

---

# 35. Dataset `/v1/observations`

Propósito:

```text
Observations que pueden asociarse a Visits durante checkout
```

Relacionable con:

```text
Visit.checkout_observation
```

---

# 36. Dataset `/v1/skills`

Propósito:

```text
catálogo disponible de Skills
```

---

# 37. Dataset `/v1/tags`

Propósito:

```text
catálogo disponible de Tags
```

---

# 38. Dataset `/v1/zones`

Propósito:

```text
Zones definidas para las cuentas accesibles
```

Una Zone representa área geográfica.

---

# 39. Dataset `/v1/vehicles_zones`

**Tipo:** relationship/junction dataset.

Propósito:

```text
Vehicle <-> Zone
```

---

# 40. Dataset `/v1/visits_skills_optional`

**Tipo:** relationship/junction dataset.

Propósito:

```text
optional Skills definidas para Visits
```

---

# 41. Dataset `/v1/visits_skills_required`

**Tipo:** relationship/junction dataset.

Propósito:

```text
required Skills definidas para Visits
```

---

# 42. Dataset `/v1/visits_tags`

**Tipo:** relationship/junction dataset.

Propósito:

```text
Tags asociadas a Visits
```

---

# 43. Dataset `/v1/visits_extrafieldvalues`

Propósito:

```text
valores de Extra Fields asignados a Visits durante Checkout
```

Este dataset es especialmente útil para analytics de formularios personalizados.

---

# 44. Dataset `/v1/visititems`

Propósito:

```text
Visit Items
```

Representan productos/servicios asociados a Visit.

---

# 45. Dataset `/v1/accounts`

Propósito:

```text
Accounts relacionados con el Datamart role
```

Incluye:

- información de la cuenta;
- organización asociada.

### Scope

La documentación usa:

```text
Accounts related to the Datamart role
```

Por tanto el token puede tener visibilidad sobre una o más cuentas según rol/configuración.

---

# 46. Dataset `/v1/users`

Propósito:

```text
Users de la cuenta
```

Incluye usuarios web:

- admins;
- monitors;
- drivers;
- otros roles.

---

# 47. Dataset `/v1/invoices`

Propósito:

```text
Invoices
```

Relacionable con Accounting, Etapa 8.

---

# 48. Dataset `/v1/invoiceitems`

Propósito:

```text
Invoice Items
```

Representan productos o servicios de Invoice.

---

# 49. Dataset `/v1/sellers`

Propósito:

```text
Sellers / commercial agents
```

vinculados a una cuenta específica.

---

# 50. Dataset `/v1/sellers_users`

**Tipo:** relationship/junction dataset.

Propósito:

```text
Seller <-> User
```

Define qué Users están asociados a qué Sellers.

---

# 51. Dataset `/v1/sellers_visits`

**Tipo:** relationship/junction dataset.

Propósito:

```text
Seller <-> Visit
```

Permite mapear Visits a Seller.

---

# 52. Dataset `/v1/visitpicture`

Propósito oficial:

```text
relationship between VisitPicture and RoutesVisit
```

Lista imágenes adjuntas a Visit.

### Naming

Dataset singular:

```text
visitpicture
```

NO:

```text
visitpictures
```

MUST usar nombre exacto publicado.

---

# 53. Master datasets vs relationship datasets

## Master/Entity datasets

```text
visits
plans
routes
extrafielddefinitions
extrafieldoptions
vehicles
fleets
observations
skills
tags
zones
visititems
accounts
users
invoices
invoiceitems
sellers
visitpicture
```

## Relationship/Junction datasets

```text
vehicles_skills
vehicles_fleets
fleets_users
vehicles_zones
visits_skills_optional
visits_skills_required
visits_tags
sellers_users
sellers_visits
```

`visits_extrafieldvalues` es un dataset de valores asociados, conceptualmente relacional pero con payload/value adicional.

---

# 54. Número de datasets

Total público enumerado al 2026-08-10:

```text
28
```

Una IA SHOULD usar este inventario como baseline.

Si aparece un dataset no listado en futuras versiones:

```text
NEW / NEEDS_DOCUMENTATION
```

---

# 55. Selección de columnas con `select`

**Estado:** `OFFICIAL`

Ejemplo:

```text
/v1/visits?select=id,address
```

Response:

```text
sólo contiene propiedades id y address
```

---

# 56. Sintaxis `select`

Formato:

```text
select=column1,column2,column3
```

Separador:

```text
comma
```

No se documentan espacios.

Recomendación:

```text
no spaces
```

---

# 57. `select=*`

`NOT_DOCUMENTED`.

No inventar wildcard.

---

# 58. Columnas inválidas en `select`

Comportamiento:

```text
NOT_DOCUMENTED
```

No asumir:

- HTTP 400;
- columna ignorada;
- null.

---

# 59. Selección de relaciones/nested fields

No se documenta:

```text
select=route.id
select=account(name)
```

ni otros formatos nested.

Datamart parece exponer datasets normalizados y relaciones separadas.

No inventar joins en `select`.

---

# 60. Conditional Filtering

Sintaxis oficial:

```text
{column}={operator}.{value}
```

Ejemplo:

```text
/v1/visits?visit_type_id=eq.5335
```

---

# 61. Operador `eq`

Significa:

```text
equal
```

Ejemplo:

```text
visit_type_id=eq.5335
```

---

# 62. Operador `gt`

Disponible oficialmente.

Significa conceptualmente:

```text
greater than
```

Ejemplo inferido:

```text
id=gt.1000
```

El ejemplo es conceptual; la documentación sólo afirma disponibilidad del operador.

---

# 63. Operador `lt`

Disponible oficialmente.

Significa:

```text
less than
```

---

# 64. Operadores publicados

Lista exhaustiva publicada:

```text
eq
gt
lt
```

La frase dice:

```text
Aside from eq operator, gt or lt are available too.
```

No se publican:

```text
gte
lte
neq
in
like
ilike
is
not
contains
```

No inventarlos.

---

# 65. Conditional filtering sobre strings

La documentación no muestra ejemplo.

Forma probable:

```text
field=eq.value
```

pero escaping/URL encoding:

```text
NOT_DOCUMENTED
```

Una IA SHOULD URL-encode values.

---

# 66. Conditional filtering sobre fechas

No se muestra ejemplo.

Aunque `gt/lt` podrían usarse conceptualmente:

```text
planned_date=gt.2026-01-01
```

eso NO está ejemplificado.

Estado:

```text
INFERRED
```

No afirmar date comparison support sin verificar campo/tipo.

---

# 67. Múltiples filtros simultáneos

`NOT_DOCUMENTED`.

No se describe si:

```text
?a=eq.1&b=eq.2
```

usa AND.

Aunque es una convención frecuente, no debe asumirse como contrato oficial.

---

# 68. Múltiples condiciones sobre la misma columna

No se documenta:

```text
id=gt.10&id=lt.20
```

No inventar.

---

# 69. OR filtering

`NOT_DOCUMENTED`.

---

# 70. IN filtering

`NOT_DOCUMENTED`.

---

# 71. NULL filtering

`NOT_DOCUMENTED`.

No inventar:

```text
field=is.null
```

aunque pueda parecerse a PostgREST.

---

# 72. Fuente técnica subyacente

La sintaxis se parece a PostgREST:

```text
select=
eq.
gt.
lt.
Prefer:
Content-Range
```

pero SimpliRoute NO declara públicamente que su Datamart sea PostgREST.

### Regla crítica

MUST NOT extrapolar operadores PostgREST no publicados.

---

# 73. Sorting

La sección se titula:

```text
What filtering and sorting options does Datamart offer?
```

pero el contenido público sólo documenta:

- basic filtering via `select`;
- conditional filtering via `eq`, `gt`, `lt`.

No publica sintaxis para sorting.

Por tanto:

```text
sorting syntax = NOT_DOCUMENTED
```

---

# 74. No inventar `order=`

Una IA MUST NOT suponer:

```text
?order=id.asc
?sort=id
?ordering=id
```

hasta confirmación oficial.

---

# 75. Datamart response format

La documentación no muestra response body completo para datasets.

Por tratarse de consulta de múltiples filas y paginación, es razonable esperar arrays, pero:

```text
response root per dataset = PARTIALLY_DOCUMENTED
```

No crear un schema universal sin consultar datos reales.

---

# 76. Content-Type response

La introducción global indica JSON para API, pero Datamart está bajo gateway separado.

Los ejemplos no repiten `Accept`.

Sin embargo el contexto Datamart es REST/data query y examples son JSON-oriented.

Estado:

```text
JSON response strongly implied / OFFICIAL context
```

---

# 77. Error status codes de Datamart

La sección Datamart no publica tabla específica.

La tabla Errors inmediatamente anterior aplica a la SimpliRoute API general:

```text
400
401
404
405
406
500
503
```

Pero no se declara explícitamente si Datamart usa exactamente todos.

### Regla

No hardcodear una lista endpoint-specific más allá de comportamiento observado.

---

# 78. 401 Datamart

Una credencial incorrecta puede conceptualmente producir Unauthorized.

Pero la sección Datamart sólo exige Bearer token.

Schema de error:

```text
NOT_DOCUMENTED
```

---

# 79. 403

No está documentado globalmente para Datamart.

Acceso a datasets fuera del scope:

```text
NOT_DOCUMENTED
```

---

# 80. Token scope

La documentación menciona:

```text
Datamart role
```

y accounts related to that role.

No describe:

- scopes;
- organizations;
- account-level permissions;
- dataset-specific permissions.

Estado:

```text
NOT_DOCUMENTED
```

---

# 81. Token expiration

El ejemplo JWT contiene claim `exp`, pero la documentación no explica:

- duración;
- renovación;
- refresh;
- rotación;
- endpoint de emisión.

Por tanto:

```text
token expiration behavior = NOT_DOCUMENTED
```

Aunque un JWT example tenga `exp`, no convertirlo en política.

---

# 82. Customer Support dependency

Si el token expira/no funciona, el flujo público documentado es:

```text
contact Customer Support
```

No se publica self-service endpoint.

---

# 83. Datos multi-account

`/v1/accounts` expone cuentas relacionadas con rol Datamart.

Esto sugiere posibilidad de token con varias cuentas.

Cómo filtrar account:

```text
NOT_DOCUMENTED específicamente
```

Podría existir columna `account_id` en datasets y usarse conditional filter, pero eso debe verificarse sobre schema real.

---

# 84. Schemas de datasets

La documentación Datamart remite a los objetos operacionales para “más información”, pero no publica tablas de columnas concretas de cada dataset Datamart.

Por tanto:

```text
exact column schema per Datamart dataset = PARTIALLY_DOCUMENTED
```

---

# 85. Regla para columnas

Una IA puede usar nombres demostrados públicamente como:

```text
visits.id
visits.address
visits.visit_type_id
```

porque aparecen en ejemplos Datamart.

Para otras columnas:

```text
NEEDS_VERIFICATION
```

aunque existan en los objetos operacionales.

---

# 86. `visit_type_id`

El ejemplo Datamart usa:

```text
visit_type_id
```

mientras el Visit Object operacional documenta:

```text
visit_type
```

Esto demuestra que el schema Datamart puede diferir del object JSON operacional.

### Regla crítica

MUST NOT asumir:

```text
Datamart Visit columns == Operational Visit JSON field names
```

---

# 87. Normalización relacional

La existencia de datasets:

```text
visits_tags
visits_skills_required
vehicles_fleets
...
```

demuestra que relaciones que aparecen como arrays/objects en API operacional pueden estar normalizadas en tablas separadas en Datamart.

---

# 88. Ejemplo: Tags

Operational Visit:

```json
{
  "tags": [3705, 3706]
}
```

Datamart:

```text
/v1/visits
/v1/tags
/v1/visits_tags
```

Para análisis relacional:

```text
visits_tags
```

es la tabla de unión.

---

# 89. Ejemplo: Skills

Operational Vehicle:

```json
{
  "skills": [295]
}
```

Datamart:

```text
/v1/vehicles
/v1/skills
/v1/vehicles_skills
```

---

# 90. Ejemplo: Fleet

Operational Fleet:

```json
{
  "vehicles": [...],
  "users": [...]
}
```

Datamart:

```text
/v1/fleets
/v1/vehicles_fleets
/v1/fleets_users
```

---

# 91. Ejemplo: Visit Extra Fields

Operational Visit puede contener:

```text
extra_field_values
```

Datamart separa:

```text
/v1/extrafielddefinitions
/v1/extrafieldoptions
/v1/visits_extrafieldvalues
```

Esto permite analytics normalizado.

---

# 92. Ejemplo: Sellers

Operational Visit:

```text
seller
```

Datamart:

```text
/v1/sellers
/v1/sellers_users
/v1/sellers_visits
```

---

# 93. Ejemplo: Invoice

Operational:

```text
Invoice.items[]
```

Datamart:

```text
/v1/invoices
/v1/invoiceitems
```

---

# 94. Imágenes de Visit

Operational Visit:

```text
pictures[]
```

Datamart:

```text
/v1/visitpicture
```

El schema de URL/path de la imagen no está documentado en sección Datamart.

---

# 95. Cargas incrementales

Datamart no publica una estrategia oficial para CDC/incremental extraction.

No se documenta:

```text
updated_since
modified_since
cursor
watermark
```

Una integración puede intentar usar columnas `modified` con `gt`, si existen en el dataset real.

Pero esto debe clasificarse:

```text
INFERRED / NEEDS_SCHEMA_VERIFICATION
```

---

# 96. Ejemplo incremental conceptual

Sólo si el dataset confirma columna `modified` y comparaciones de timestamp:

```text
/v1/visits?modified=gt.2026-08-10T00:00:00Z
```

No es un ejemplo oficial.

MUST NOT presentarse como endpoint garantizado.

---

# 97. Full extraction

Flujo recomendado:

```text
1. obtain Datamart Bearer token
2. choose dataset
3. GET limit=500 offset=0
4. process rows
5. read Content-Range
6. increment offset by returned/page size
7. repeat until exhausted
```

---

# 98. Ejemplo extracción de Visits

```bash
curl \
  'https://api-gateway.simpliroute.com/datamart/v1/visits?limit=500&offset=0' \
  -H 'Authorization: Bearer <DATAMART_TOKEN>'
```

---

# 99. Ejemplo selección de columnas

```bash
curl \
  'https://api-gateway.simpliroute.com/datamart/v1/visits?select=id,address' \
  -H 'Authorization: Bearer <DATAMART_TOKEN>'
```

---

# 100. Ejemplo conditional filter oficial

```bash
curl \
  'https://api-gateway.simpliroute.com/datamart/v1/visits?visit_type_id=eq.5335' \
  -H 'Authorization: Bearer <DATAMART_TOKEN>'
```

---

# 101. Combinación `select + filter`

La documentación no muestra explícitamente ambos juntos.

Probable:

```text
?select=id,address&visit_type_id=eq.5335
```

Estado:

```text
INFERRED
```

No considerar garantizado hasta probar.

---

# 102. Combinación filter + pagination

No se ejemplifica, pero ambos son query params documentados.

Es razonable combinarlos.

Estado:

```text
INFERRED / HIGH CONFIDENCE
```

---

# 103. URL encoding

Valores con:

- espacios;
- `+`;
- `&`;
- commas especiales;

deben URL-encodearse según HTTP estándar.

No hay reglas especiales documentadas por SimpliRoute.

---

# 104. Response total >100k

Para grandes datasets:

```http
Prefer: count=estimated
```

El total puede ser estimado.

No usar ese número para controles financieros exactos o reconciliación sin validar filas.

---

# 105. Conteo exacto

No se documenta una opción:

```text
Prefer: count=exact
```

MUST NOT extrapolarla de tecnologías similares.

---

# 106. Head requests

No se documenta:

```http
HEAD
```

para obtener count sin rows.

No inventarlo.

---

# 107. CSV export

No se documenta response CSV.

`406` global dice formato distinto de JSON no aceptable, pero Datamart gateway podría tener comportamiento propio.

No asumir:

```text
Accept: text/csv
```

---

# 108. GraphQL

No existe endpoint GraphQL documentado.

---

# 109. Joins server-side

No se documentan query params de join/embedding.

Para joins:

```text
consultar datasets separados
join localmente usando IDs
```

cuando se conozcan columnas.

---

# 110. Column introspection

No existe endpoint público documentado de:

```text
schema
columns
metadata
OpenAPI
```

para Datamart.

Por tanto los schemas reales pueden requerir una muestra de datos o soporte.

---

# 111. Max URL length

`NOT_DOCUMENTED`.

Evitar `select` gigantesco o filtros enormes.

---

# 112. Request body

GET Datamart no utiliza body en ejemplos.

MUST enviar filtros vía query string.

---

# 113. Rate limits

`NOT_DOCUMENTED`.

No existe:

```text
429
X-RateLimit-*
```

documentado para Datamart.

---

# 114. Timeouts

`NOT_DOCUMENTED`.

---

# 115. Caching

No se documentan headers ni freshness guarantees.

No asumir datos instantáneamente sincronizados con API operacional.

---

# 116. Latencia de actualización

`NOT_DOCUMENTED`.

No se publica SLA de cuánto demora un cambio operacional en aparecer en Datamart.

### Regla

Para flujos transaccionales en tiempo real, usar API/Webhooks cuando corresponda.

Datamart debe tratarse como superficie de consulta/analytics.

---

# 117. Consistencia

No se documenta si es:

- strongly consistent;
- eventually consistent;
- snapshot-based.

No asumir.

---

# 118. Orden default

`NOT_DOCUMENTED`.

No confiar en orden natural.

Si sorting no está documentado, el consumidor debe ordenar localmente cuando sea necesario.

---

# 119. Primary keys

No se publica schema de PK por dataset.

Aunque muchas entidades tienen `id`, relationship tables pueden usar columnas compuestas.

No asumir una columna `id` universal.

---

# 120. Relationship tables

Una IA SHOULD tratarlas como junction tables.

Pero columnas exactas como:

```text
vehicle_id
skill_id
```

no están listadas en la sección Datamart.

Deben verificarse del response real.

---

# 121. Tipos de columnas

No se publica type schema de Datamart.

No asumir que IDs son:

- integer;
- UUID;
- string;

sólo por API operacional.

Datamart puede normalizar.

---

# 122. Nullability

No se publica matriz de nullability por dataset.

---

# 123. Enums

Los enums conceptuales pueden venir de las entidades operacionales, pero Datamart no publica catálogo independiente.

Usar documentación de dominio como contexto, no como schema de DB garantizado.

---

# 124. Dataset catalog table

| # | Dataset | Categoría |
|---:|---|---|
| 1 | `/v1/visits` | Entity |
| 2 | `/v1/plans` | Entity |
| 3 | `/v1/routes` | Entity |
| 4 | `/v1/extrafielddefinitions` | Entity/config |
| 5 | `/v1/extrafieldoptions` | Entity/config |
| 6 | `/v1/vehicles` | Entity |
| 7 | `/v1/vehicles_skills` | Relation |
| 8 | `/v1/fleets` | Entity |
| 9 | `/v1/vehicles_fleets` | Relation |
| 10 | `/v1/fleets_users` | Relation |
| 11 | `/v1/observations` | Entity/config |
| 12 | `/v1/skills` | Entity/config |
| 13 | `/v1/tags` | Entity/config |
| 14 | `/v1/zones` | Entity/config |
| 15 | `/v1/vehicles_zones` | Relation |
| 16 | `/v1/visits_skills_optional` | Relation |
| 17 | `/v1/visits_skills_required` | Relation |
| 18 | `/v1/visits_tags` | Relation |
| 19 | `/v1/visits_extrafieldvalues` | Relation/value |
| 20 | `/v1/visititems` | Entity/detail |
| 21 | `/v1/accounts` | Entity |
| 22 | `/v1/users` | Entity |
| 23 | `/v1/invoices` | Entity |
| 24 | `/v1/invoiceitems` | Entity/detail |
| 25 | `/v1/sellers` | Entity |
| 26 | `/v1/sellers_users` | Relation |
| 27 | `/v1/sellers_visits` | Relation |
| 28 | `/v1/visitpicture` | Relation/detail |

---

# 125. Ejemplo de extractor genérico

Pseudocódigo:

```python
def extract_dataset(dataset, token):
    offset = 0
    limit = 500

    while True:
        response = GET(
            "https://api-gateway.simpliroute.com/datamart"
            + dataset
            + f"?limit={limit}&offset={offset}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        rows = response.json()

        for row in rows:
            yield row

        if len(rows) < limit:
            break

        offset += limit
```

No es SDK oficial.

---

# 126. Extractor con estimated count

```http
Authorization: Bearer <TOKEN>
Prefer: count=estimated
```

Puede servir para progreso aproximado.

No usar como criterio único de integridad.

---

# 127. Pipeline analítico recomendado

```text
Datamart
  |
  +-- entity datasets
  |
  +-- junction datasets
  |
  v
Raw/Staging layer
  |
  v
Normalize types
  |
  v
Join locally
  |
  v
Analytics / BI / Warehouse
```

---

# 128. Relación con webhook/API operacional

Patrón recomendado:

```text
Operational API:
  commands / writes

Webhooks:
  event-driven changes

Datamart:
  bulk queries / analytics / reconciliation
```

No usar Datamart como sustituto de todos los eventos en tiempo real.

---

# 129. Reconciliación

Datamart puede servir para:

- recuperar Visits;
- validar estado histórico;
- relacionar rutas/vehículos;
- reconstruir skills/tags;
- analizar invoices;
- extraer fotografías asociadas;
- cruzar Seller/User/Visit.

Freshness exacta:

```text
NOT_DOCUMENTED
```

---

# 130. Seguridad del Bearer token

Tratar como secreto:

- variables de entorno/secret manager;
- no exponer frontend;
- no loguear;
- no versionar.

La documentación exige Bearer token; las prácticas de storage son recomendaciones de seguridad.

---

# 131. Ejemplo configuración separada

```yaml
simpliroute:
  main_api:
    base_url: https://api.simpliroute.com
    auth_scheme: Token

  datamart:
    base_url: https://api-gateway.simpliroute.com/datamart
    auth_scheme: Bearer
```

---

# 132. Inconsistencias / limitaciones detectadas

| Tema | Problema | Estado |
|---|---|---|
| Datamart typo | texto dice `Datarmat` | `OFFICIAL_TEXT typo` |
| Max 500 | default exacto no declarado | `PARTIALLY_DOCUMENTED` |
| Content-Range | contenido declarado, sintaxis no mostrada | `PARTIALLY_DOCUMENTED` |
| >100k count | total no disponible salvo estimated count | `OFFICIAL` |
| Sorting | heading menciona sorting, ninguna sintaxis publicada | `NOT_DOCUMENTED` |
| Datamart Visit schema | ejemplo usa `visit_type_id`; operational usa `visit_type` | `NEEDS_VERIFICATION` |
| Dataset schemas | no se publican columnas completas | `PARTIALLY_DOCUMENTED` |
| Relationship columns | nombres exactos no listados | `PARTIALLY_DOCUMENTED` |
| Multi-filter semantics | no descritas | `NOT_DOCUMENTED` |
| Token lifecycle | no descrito | `NOT_DOCUMENTED` |

---

# 133. Reglas MUST para IA

Una IA MUST:

1. usar base `https://api-gateway.simpliroute.com/datamart`;
2. usar `Authorization: Bearer`;
3. obtener token vía Customer Support;
4. tratar Datamart como read/query API;
5. respetar máximo de 500 rows/page;
6. usar `offset` para avanzar;
7. usar `limit` para reducir page size;
8. procesar `Content-Range` sólo con parser verificado;
9. usar `Prefer: count=estimated` si necesita total estimado >100k;
10. usar `select=a,b` para selección de columnas;
11. limitar conditional operators a `eq`, `gt`, `lt`;
12. usar nombres exactos de los 28 datasets;
13. utilizar junction datasets para relaciones;
14. reconocer que schema Datamart puede diferir del operacional;
15. ordenar localmente si necesita orden determinista.

---

# 134. Reglas MUST NOT para IA

MUST NOT:

1. usar `Authorization: Token` en Datamart;
2. reutilizar automáticamente API Token principal;
3. inventar mutaciones POST/PUT/PATCH/DELETE;
4. pedir más de 500 esperando soporte garantizado;
5. asumir count >100k exacto;
6. extrapolar `count=exact`;
7. extrapolar operadores PostgREST;
8. inventar `gte`, `lte`, `in`, `like`, `is`;
9. inventar `order=` o sorting syntax;
10. asumir múltiples filtros usan AND;
11. asumir relaciones embedded;
12. asumir schema operacional idéntico;
13. asumir PK `id` en todas las tablas;
14. inventar datasets con pluralización distinta;
15. usar `/v1/visitpictures` en lugar de `/v1/visitpicture`.

---

# 135. Aspectos NOT_DOCUMENTED

```text
Datamart token lifetime
Datamart token refresh
self-service token issuance
dataset-specific permission model
exact dataset schemas
column types
column nullability
primary keys
foreign key names
junction table column names
response root schema
Content-Range exact syntax
default limit
invalid limit behavior
negative offset behavior
sorting syntax
default ordering
multiple filter semantics
OR filters
IN filters
NULL filters
gte/lte/neq operators
string escaping rules beyond standard URL encoding
joins/embedding
schema introspection endpoint
CDC/incremental API
snapshot consistency
freshness latency
SLA
rate limits
timeouts
429 behavior
cache headers
CSV
HEAD/count endpoint
GraphQL
maximum concurrent requests
```

---

# 136. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Sección verificada:

```text
Datamart
How does pagination work?
What data is available in Datamart?
What filtering and sorting options does Datamart offer?
```

Hechos confirmados oficialmente:

```text
Datamart is REST API for querying
Bearer token from Customer Support
base https://api-gateway.simpliroute.com/datamart
max 500 rows per page
offset
limit
Content-Range always returned
>100k total omitted by default
Prefer: count=estimated
28 public datasets
select=id,address
conditional syntax field=eq.value
operators eq, gt, lt
```

Fecha de verificación:

```text
2026-08-10
```

---

# 137. Estado final

**ETAPA 11 COMPLETADA**

Cobertura:

```text
Datamart authentication
pagination
Content-Range
estimated counts
28 datasets
entity datasets
relationship datasets
column selection
conditional filters
eq / gt / lt
limitations and undocumented sorting
```

La siguiente etapa recomendada es:

```text
12-couriers-providers.md
```

Deberá cubrir:

- objetivo de Couriers / Providers;
- security requirements;
- admin requirement;
- courier add-on;
- Related-Account;
- create/list/retrieve/update/delete;
- provider_type;
- validaciones;
- unique trade_name;
- email/phone normalization;
- E.164;
- Courier Visits creation and assignment;
- status codes;
- payloads;
- responses;
- diferencias Courier vs TMS Transportation Provider.
