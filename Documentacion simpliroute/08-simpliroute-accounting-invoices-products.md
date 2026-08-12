# SimpliRoute Public API — Etapa 8: Accounting, Invoices, InvoiceItem, DeliveryIssue, Products y ProductCategory

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API canónica:** `https://api.simpliroute.com`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento cubre exhaustivamente la superficie pública oficial encontrada para el módulo Accounting de SimpliRoute:

- requisito de Accounting AddOn;
- Invoice;
- creación mínima y completa;
- consulta individual;
- consulta por `route_id`;
- consulta por `planned_date`;
- actualización parcial;
- eliminación;
- validación automática de currency;
- payment_method;
- payments;
- payment_method_details;
- status;
- InvoiceItem;
- creación/actualización de InvoiceItems;
- eliminación de InvoiceItems;
- DeliveryIssue;
- creación/actualización/eliminación;
- Product;
- ProductCategory;
- asociación InvoiceItem → Product;
- CRUD publicado de Product/ProductCategory;
- errores e inconsistencias oficiales;
- reglas para agentes de IA.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Presente en un ejemplo oficial. |
| `INFERRED` | Deducción técnica útil, no garantía contractual. |
| `NOT_DOCUMENTED` | No especificado públicamente. |
| `NEEDS_VERIFICATION` | Existe inconsistencia, ambigüedad o error en la documentación. |

---

# 3. Requisito del Accounting AddOn

**Estado:** `OFFICIAL`

Para usar esta API la cuenta debe tener activado:

```text
Accounting AddOn
```

La documentación indica contactar al especialista de onboarding para activarlo.

Por tanto:

```text
API públicamente documentada != disponible automáticamente para toda cuenta
```

---

# 4. Advertencia de evolución

**Estado:** `OFFICIAL`

SimpliRoute advierte expresamente que esta API:

```text
is constantly adding fields or making small adjustments
```

y que la información puede cambiar.

### Consecuencia para IA

Un consumidor SHOULD:

- tolerar fields adicionales;
- no rechazar response por campos desconocidos;
- evitar schemas excesivamente rígidos;
- conservar fecha de verificación.

---

# 5. Base URL y ejemplos históricos

La documentación global declara:

```text
https://api.simpliroute.com
```

Sin embargo, la sección Accounting contiene ejemplos con:

```text
http://api.simpliroute.com
```

y otros con typo:

```text
http://api.simrpliroute.com
```

Además Products modernos usan:

```text
https://api.simpliroute.com
```

### Estado

```text
NEEDS_VERIFICATION / historical documentation inconsistency
```

### Regla

Para integraciones nuevas:

```text
BASE_URL = https://api.simpliroute.com
```

MUST NOT usar:

```text
api.simrpliroute.com
```

El typo no representa un host válido contractual.

---

# 6. Modelo conceptual Accounting

```text
Visit
└── Invoice
    ├── InvoiceItem
    │   ├── optional Product
    │   └── optional DeliveryIssue
    └── optional DeliveryIssue

Product
└── optional ProductCategory

ProductCategory
└── optional parent ProductCategory
```

La Invoice está desacoplada de Visit como entidad, aunque se relaciona con ella.

---

# 7. Invoice

**Estado:** `OFFICIAL`

SimpliRoute define Invoice como un documento comercial con timestamp que registra una transacción entre comprador y vendedor.

Puede representar conceptos como:

- invoice;
- receipt;
- delivery note;
- otros documentos financieros.

Endpoint base:

```text
/v1/accounting/invoices/
```

---

# 8. Crear Invoice

## Endpoint

```http
POST /v1/accounting/invoices/
```

URL canónica:

```text
https://api.simpliroute.com/v1/accounting/invoices/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

---

# 9. Invoice — payload mínimo oficial

```json
{
  "reference": "external identifier",
  "currency": "CLP",
  "type": "bill",
  "visit": 15081986
}
```

---

# 10. Campos mínimos/obligatorios de Invoice

La tabla oficial declara como mínimos y mandatory:

| Campo | Tipo | Descripción |
|---|---|---|
| `reference` | string | Identificador externo de Invoice. |
| `currency` | string | Moneda de los precios. |
| `visit` | int | Visit ID relacionado. |
| `type` | string | Tipo de Invoice. |

---

# 11. `reference`

Tipo:

```text
string
```

Propósito:

```text
external identifier for the invoice
```

### Unicidad

`NOT_DOCUMENTED`.

No asumir que funciona como idempotency key o unique constraint.

---

# 12. `visit`

Tipo:

```text
int
```

Es el Visit ID al cual se relaciona la Invoice.

Por tanto:

```text
Invoice.visit -> Visit.id
```

Una Visit puede aparecer con:

```text
invoices[]
```

en Checkout Detailed / Visit Detail.

---

# 13. Invoice types

Enum oficial:

```text
bill
credit_note
delivery_note
debit_note
```

Una IA MUST NOT inventar valores como:

```text
invoice
receipt
refund
purchase_order
```

aunque puedan parecer semánticamente razonables.

---

# 14. `currency`

La documentación indica:

```text
ALPHA-3
```

pero la referencia menciona:

```text
ISO 3166
```

para monedas.

### Inconsistencia estándar

**Estado:** `NEEDS_VERIFICATION`

Los códigos de moneda de tres letras como:

```text
CLP
USD
ARS
```

corresponden normalmente a ISO 4217, no ISO 3166.

La documentación oficial escribe ISO 3166.

### Regla IA

Usar códigos de moneda de 3 caracteres como los ejemplos oficiales.

No “corregir” silenciosamente el estándar en afirmaciones sobre SimpliRoute.

---

# 15. Validación automática de Currency

**Estado:** `OFFICIAL`

La API valida y corrige `currency` automáticamente.

Esto aplica a:

```text
POST
PATCH
```

---

# 16. Currency válida

Si se envía una currency válida:

```text
se mantiene exactamente la enviada
```

Ejemplo:

```json
{
  "currency": "USD"
}
```

---

# 17. Currency inválida, vacía o null

Si `currency` es:

```text
invalid
empty
null
```

la API intenta asignar automáticamente:

```text
account country currency
```

---

# 18. Cuenta sin country

Si la cuenta no posee country y se envía moneda inválida/vacía/null:

```text
HTTP 400
```

Error publicado:

```text
Account must have a country defined to automatically assign currency. Please provide a valid currency code or set the account country.
```

---

# 19. Country inválido/no reconocido

Si la cuenta tiene country pero el código no permite encontrar moneda:

```text
HTTP 400
```

Error publicado:

```text
No currency found for country `country_code`. Please provide a valid currency code.
```

---

# 20. Algoritmo conceptual Currency

```text
IF currency is valid:
    keep currency
ELSE:
    IF account.country exists and maps to currency:
        use account country currency
    ELSE:
        return HTTP 400
```

---

# 21. Invoice payload completo oficial

```json
{
  "reference": "external_id 1234",
  "currency": "USD",
  "visit": 185202350,
  "payment_method": "transfer",
  "type": "bill",
  "status": "payed",
  "label": "custom_title",
  "items": [
    {
      "title": "inline item",
      "type": "paquete"
    }
  ]
}
```

---

# 22. Campos opcionales de Invoice

| Campo | Tipo | Default oficial | Descripción |
|---|---|---|---|
| `payment_method` | string | `cash` | Método de pago. |
| `payments` | list of Payments | `[]` | Pagos declarados. |
| `payment_method_details` | string | none | Información extra del método. |
| `status` | string | `pending` | Estado de la Invoice. |
| `items` | list of InvoiceItem | `[]` | Items. |
| `delivery_issue` | DeliveryIssue | `null` | Issue de entrega de la Invoice. |
| `label` | string | `null` | Nombre/título custom. |

---

# 23. `payment_method` enum

Valores oficiales:

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

Default:

```text
cash
```

---

# 24. `multiple`

**Estado:** `OFFICIAL`

`payment_method = multiple` permite seleccionar el método de pago en la aplicación móvil.

No se documenta con precisión cómo se combina con:

```text
payments[]
```

Estado:

```text
PARTIALLY_DOCUMENTED
```

---

# 25. `payments`

Ejemplo:

```json
[
  {
    "invoice": 1,
    "method": "cash",
    "amount": 5000,
    "note": "Details of payment"
  }
]
```

---

# 26. Payment fields observados

| Campo | Tipo observado | Descripción |
|---|---|---|
| `invoice` | int | Invoice ID. |
| `method` | string | Método de pago. |
| `amount` | number | Monto. |
| `note` | string | Nota. |

La documentación no entrega tabla formal de Payment.

Estado:

```text
OFFICIAL_EXAMPLE
```

---

# 27. Payment `method` enum

Valores oficiales:

```text
cash
check
credit_card
debit_card
transfer
dated_check
credit
```

### Diferencia

`multiple` aparece como valor de:

```text
Invoice.payment_method
```

pero NO aparece dentro del enum de:

```text
Payment.method
```

Una IA MUST preservar esa diferencia.

---

# 28. `amount`

Unidad:

```text
moneda de la Invoice
```

es una inferencia natural, pero la tabla no lo declara explícitamente.

Estado:

```text
INFERRED
```

No asumir unidades menores (centavos) vs mayores.

---

# 29. `payment_method_details`

String libre para información adicional.

Default:

```text
none
```

La documentación no aclara si esto significa:

```text
null
empty string
absent
```

Estado:

```text
NEEDS_VERIFICATION
```

---

# 30. Invoice status enum

Valores oficiales:

```text
pending
payed
overdue
canceled
partial
completed
```

Default:

```text
pending
```

---

# 31. `payed` spelling

El valor oficial está escrito:

```text
payed
```

NO:

```text
paid
```

Una IA MUST usar el valor exacto publicado.

No “corregir” el inglés en el payload.

---

# 32. `label`

String custom para almacenar nombre/título de Invoice.

Default:

```text
null
```

---

# 33. `delivery_issue`

Puede referirse a uno de los DeliveryIssues disponibles para la cuenta.

Default:

```text
null
```

Tipo exacto esperado:

```text
NOT_DOCUMENTED
```

La tabla dice “one of available DeliveryIssue”, pero no aclara si se envía:

- ID;
- UUID;
- objeto;
- reference.

Los ejemplos de creación de Invoice no lo muestran.

Estado:

```text
NEEDS_VERIFICATION
```

---

# 34. Inline InvoiceItems

Invoice puede crearse con:

```json
{
  "items": [
    {
      "title": "inline item",
      "type": "paquete"
    }
  ]
}
```

### Contradicción con InvoiceItem mandatory fields

La tabla de InvoiceItem declara:

```text
title     mandatory yes
reference mandatory yes
```

pero el ejemplo inline de Invoice omite `reference`.

Además el ejemplo de POST `/items/` también contiene un item sólo con `title`.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla IA

Para máxima compatibilidad, SHOULD enviar `reference` cuando disponga de él.

MUST NOT considerar el ejemplo sin `reference` como prueba definitiva de que nunca es required.

---

# 35. Consultar Invoice individual

La documentación publica conceptualmente:

```http
GET /v1/accounting/invoices/{invoice_id}/
```

### Typo oficial

En texto aparece:

```text
api.simrpliroute.com
```

Usar host canónico:

```text
api.simpliroute.com
```

---

# 36. Actualizar Invoice

## Endpoint

```http
PATCH /v1/accounting/invoices/{invoice_id}/
```

Ejemplo:

```json
{
  "reference": "external_id",
  "currency": "CLP",
  "visit": 15081986
}
```

---

# 37. PATCH semantics

El método es PATCH.

Semántica natural:

```text
partial update
```

pero la sección no dice explícitamente:

```text
omitted fields remain unchanged
```

como sí hace Visits.

Estado:

```text
INFERRED from HTTP method
```

No enviar campos innecesarios.

---

# 38. Currency en PATCH

La validación automática de currency aplica explícitamente también a PATCH.

Por tanto:

```text
PATCH currency invalid/null/empty
```

puede reemplazarse por moneda del country de la cuenta.

Esto es importante: `null` NO necesariamente borra currency.

---

# 39. Delete Invoice

## Endpoint

```http
DELETE /v1/accounting/invoices/{invoice_id}/
```

Response/status:

```text
NOT_DOCUMENTED
```

Cascade hacia items:

```text
NOT_DOCUMENTED
```

---

# 40. Consulta de Invoices por Route

## Endpoint

```http
GET /v1/accounting/invoices/?route_id={ROUTE_ID}
```

Propósito:

```text
Invoices asociadas a Visits de una Route
```

---

# 41. `route_id`

Tipo exacto:

`NOT_DOCUMENTED`.

Dado que Route IDs en API principal son UUIDs, típicamente se usará un UUID de Route.

Ejemplo oficial usa un string ficticio:

```text
abs-qq2-asas
```

---

# 42. Consulta por Planned Date

## Endpoint

```http
GET /v1/accounting/invoices/?planned_date={YYYY-MM-DD}
```

Ejemplo:

```text
planned_date=2024-02-26
```

Propósito:

```text
Invoices relacionadas con Visits de esa planned date
```

---

# 43. Combinación de query params

No se documenta si pueden combinarse:

```text
route_id + planned_date
```

Estado:

```text
NOT_DOCUMENTED
```

No asumir AND/OR semantics.

---

# 44. Listado sin filtro

La documentación habla de “retrieval service” y muestra collection queries, pero no declara explícitamente comportamiento de:

```http
GET /v1/accounting/invoices/
```

sin query params.

Estado:

```text
PARTIALLY_DOCUMENTED
```

No documentar paginación o volumen sin evidencia.

---

# 45. Invoice response schema

La sección no publica un JSON completo específico de Invoice retrieval.

Sin embargo Checkout Detailed muestra Invoices con fields como:

```text
id
reference
type
items
label
payment_method
payment_method_details
status
pictures
```

Estado:

```text
OFFICIAL_EXAMPLE across webhook
```

No usar ese payload como contrato exhaustivo de GET Invoice.

---

# 46. Invoice pictures

Checkout Detailed muestra:

```text
pictures
```

dentro de Invoice.

La sección Accounting no documenta endpoint para cargar imágenes de Invoice.

Estado:

```text
PARTIALLY_DOCUMENTED
```

No inventar upload endpoint.

---

# 47. InvoiceItem

InvoiceItem representa un item dentro de una Invoice.

No existe independientemente:

```text
InvoiceItem only exists within an Invoice
```

---

# 48. Crear o actualizar InvoiceItems

## Endpoint

```http
POST /v1/accounting/invoices/{invoice_id}/items/
```

Ejemplo:

```json
[
  {
    "title": "a good item"
  },
  {
    "reference": "new reference",
    "title": "a not so good item"
  }
]
```

Root:

```text
Array
```

---

# 49. “creation or update” mediante POST

El heading oficial dice:

```text
InvoiceItem creation or update
```

y usa POST.

Sin embargo la documentación NO explica:

- cómo distinguir create vs update;
- si incluir `id` actualiza;
- si `reference` funciona como upsert key;
- si toda llamada reemplaza items.

Estado:

```text
NEEDS_VERIFICATION
```

Una IA MUST NOT inventar semántica de upsert.

---

# 50. InvoiceItem fields

| Campo | Tipo | Mandatory oficial | Descripción |
|---|---|:---:|---|
| `title` | string | Sí | Nombre/título. |
| `reference` | string | Sí | Identificador externo. |
| `sku` | string | No | SKU. |
| `unit_price` | float | No | Precio unitario. |
| `planned_units` | float | No | Cantidad esperada. |
| `delivered_units` | float | No | Cantidad entregada. |
| `delivery_issue` | DeliveryIssue | No | Issue específico del item. |
| `type` | string | No | Tipo de item. |
| `product` | string | No | Product identifier opcional. |

---

# 51. Inconsistencia `reference mandatory`

La tabla dice:

```text
reference = yes
```

pero ejemplos oficiales omiten `reference`.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla segura

SHOULD incluir:

```text
title
reference
```

para nuevos items.

---

# 52. `sku`

String libre.

La documentación no exige que coincida con Product.sku.

No asumir relación automática.

---

# 53. `unit_price`

Float.

Currency:

```text
INFERRED as Invoice.currency
```

No especificado explícitamente.

---

# 54. `planned_units`

Float.

Permite cantidades no enteras.

---

# 55. `delivered_units`

Float.

Permite cantidades no enteras.

No se documenta validación:

```text
delivered_units <= planned_units
```

No inventarla como contrato.

---

# 56. `type`

String libre.

No enum publicado.

Ejemplo:

```text
paquete
```

---

# 57. `product`

Tipo oficial:

```text
string
```

y representa un Product identifier opcional.

### Inconsistencia

Product IDs de ejemplos CRUD son UUID strings, por lo que esto es coherente.

ProductCategory en cambio usa IDs enteros según ejemplos.

---

# 58. Eliminar InvoiceItem

Heading:

```http
DELETE /v1/accounting/invoices/{invoice_id}/items/
```

pero cURL muestra:

```http
DELETE /v1/accounting/invoices/{invoice_id}/items/1
```

sin slash final.

### Estado

```text
NEEDS_VERIFICATION
```

Parece requerir:

```text
item_id
```

en path, aunque el heading no lo muestra.

Modelo razonable:

```http
DELETE /v1/accounting/invoices/{invoice_id}/items/{item_id}
```

pero debe mantenerse como:

```text
INFERRED FROM OFFICIAL EXAMPLE
```

No afirmar que `/items/` sin item ID elimina todos.

---

# 59. InvoiceItem retrieve

No se documenta endpoint GET específico de item.

Puede obtenerse dentro de Invoice/webhook, pero:

```text
GET item endpoint = NOT_DOCUMENTED
```

---

# 60. DeliveryIssue

Representa:

```text
reason for non-delivery
or
issue at time of delivery
```

Los valores disponibles son definidos por cada cuenta.

---

# 61. Crear DeliveryIssue

## Endpoint

```http
POST /v1/accounting/invoices/delivery-issues/
```

Body:

```json
{
  "title": "issue title",
  "description": "dog does not allow entrance"
}
```

---

# 62. DeliveryIssue fields

| Campo | Tipo | Mandatory |
|---|---|:---:|
| `title` | string | Sí |
| `description` | string | No |
| `type` | string | No |
| `reference` | string | No |

---

# 63. DeliveryIssue `type`

Enum oficial:

```text
item
invoice
```

Descripción:

```text
whether issue is available for items or invoices
```

No existe valor publicado:

```text
both
```

---

# 64. DeliveryIssue `reference`

Identificador externo.

Unicidad:

```text
NOT_DOCUMENTED
```

---

# 65. Actualizar DeliveryIssue

## Endpoint

```http
PATCH /v1/accounting/invoices/delivery-issues/{delivery_issue_id}/
```

Ejemplo:

```json
{
  "title": "delivery issue - new title"
}
```

Esto demuestra actualización parcial.

---

# 66. Eliminar DeliveryIssue

## Endpoint

```http
DELETE /v1/accounting/invoices/delivery-issues/{delivery_issue_id}/
```

Status/response:

```text
NOT_DOCUMENTED
```

Impacto en Invoice/InvoiceItems existentes:

```text
NOT_DOCUMENTED
```

---

# 67. Listar DeliveryIssues

La sección describe “available DeliveryIssue for the account” pero NO publica explícitamente:

```http
GET /v1/accounting/invoices/delivery-issues/
```

aunque por convención podría existir.

MUST NOT inventarlo como contrato oficial.

---

# 68. DeliveryIssue ID type

No hay tabla de ID.

El endpoint usa:

```text
{delivery_issue_id}
```

Tipo:

```text
NOT_DOCUMENTED
```

No asumir int vs UUID.

---

# 69. Product

Product modela una “clase/template/pre-existing definition” para describir InvoiceItems.

Un InvoiceItem puede asociarse opcionalmente a Product.

---

# 70. Product endpoint base

```text
/v1/accounting/products/
```

La documentación declara servicios:

```text
POST
GET
PATCH
DELETE
```

---

# 71. Crear Product

## Endpoint

```http
POST /v1/accounting/products/
```

Ejemplo:

```json
[
  {
    "title": "title",
    "sku": "13231323",
    "category": 1
  }
]
```

Root:

```text
Array
```

---

# 72. Product fields

Tabla oficial:

| Campo | Tipo | Mandatory | Descripción |
|---|---|:---:|---|
| `title` | string | Sí | Nombre/título. |
| `sku` | string | Sí | Stock Keeping Unit. |
| `price` | float | No | Precio por una unidad. |
| `categories` | list | Sí según tabla | IDs de ProductCategory. |

---

# 73. Inconsistencia `category` vs `categories`

**Estado:** `NEEDS_VERIFICATION`

Ejemplo POST:

```json
{
  "category": 1
}
```

Tabla Product:

```text
categories | list | mandatory yes
```

Texto inmediatamente posterior:

```text
A Product may or may not define a category, category is optional
```

Tenemos tres afirmaciones incompatibles:

```text
example -> category singular
table   -> categories list, mandatory
text    -> category optional
```

### Regla IA

No congelar un schema sin verificación runtime.

Modelar:

```text
Product.category/categories = NEEDS_VERIFICATION
```

---

# 74. Product ID

PATCH example:

```text
ae5e625c-a1ec-413b-9a3f-abe3c2825e4d
```

DELETE example:

```text
afd4ee7a-e24f-423b-81ab-f17d2e69a585
```

Tipo observado:

```text
UUID string
```

---

# 75. Actualizar Product

## Endpoint

```http
PATCH /v1/accounting/products/{product_id}/
```

Body:

```json
{
  "title": "new title"
}
```

Demuestra actualización parcial.

---

# 76. Eliminar Product

## Endpoint

```http
DELETE /v1/accounting/products/{product_id}/
```

Status/response:

```text
NOT_DOCUMENTED
```

Impacto en InvoiceItems existentes:

```text
NOT_DOCUMENTED
```

---

# 77. Obtener/listar Products

La documentación afirma que existe servicio:

```text
GET
```

para Product en:

```text
/v1/accounting/products/
```

Pero no muestra:

- ejemplo de GET collection;
- ejemplo GET individual;
- query params;
- response schema.

### Contrato mínimo

Se puede afirmar:

```text
GET service exists for Product
```

pero no su path individual exacto.

Probable:

```text
GET /v1/accounting/products/
GET /v1/accounting/products/{product_id}/
```

El segundo es `INFERRED` y NO debe presentarse como endpoint confirmado.

---

# 78. `price`

Float.

Currency:

```text
NOT_DOCUMENTED
```

No asumir Product.price usa Invoice.currency; Product existe fuera de una Invoice concreta.

---

# 79. `sku`

Mandatory según tabla.

Unicidad:

```text
NOT_DOCUMENTED
```

---

# 80. ProductCategory

Permite agrupar Products.

Además puede crear jerarquía mediante:

```text
parent
```

---

# 81. ProductCategory endpoint base

```text
/v1/accounting/product-categories/
```

La documentación declara:

```text
POST
GET
PATCH
DELETE
```

---

# 82. ProductCategory fields

| Campo | Tipo | Mandatory | Descripción |
|---|---|:---:|---|
| `name` | string | Sí | Nombre de categoría. |
| `parent` | int | No | ProductCategory padre. |

---

# 83. ProductCategory ID type

La tabla dice:

```text
parent = int
```

y Product example usa:

```text
category = 1
```

Por tanto ProductCategory IDs parecen:

```text
Integer
```

Estado:

```text
OFFICIAL_EXAMPLE + table
```

---

# 84. ProductCategory hierarchy

Ejemplo conceptual:

```text
Food
└── Drinks
    └── Soft Drinks
```

donde:

```text
child.parent = parent_category_id
```

---

# 85. Crear ProductCategory

La documentación dice que POST existe en:

```http
POST /v1/accounting/product-categories/
```

pero no muestra payload example.

Payload mínimo inferido de tabla:

```json
{
  "name": "Beverages",
  "parent": null
}
```

### Estado

```text
INFERRED
```

No usar como ejemplo oficial literal.

---

# 86. GET/PATCH/DELETE ProductCategory

CRUD declarado conceptualmente:

```text
POST
GET
PATCH
DELETE
```

en base:

```text
/v1/accounting/product-categories/
```

Pero no se muestran paths individuales.

Una IA MUST NOT inventar forma exacta:

```text
/{id}/
```

como oficial sin verificar.

---

# 87. Product Category cardinality

Texto:

```text
A ProductCategory allows relating several Products
```

Product puede tener o no una category según texto.

Pero tabla Product dice:

```text
categories list mandatory yes
```

Estado:

```text
NEEDS_VERIFICATION
```

---

# 88. Product vs InvoiceItem

Product es template/pre-existing definition.

InvoiceItem es la instancia concreta dentro de una Invoice.

Relación:

```text
InvoiceItem.product -> Product identifier
```

Pero InvoiceItem puede existir sin Product.

---

# 89. SKU duplicado

La documentación no declara constraint:

```text
Product.sku unique
```

No usar SKU automáticamente como Product ID.

---

# 90. DeliveryIssue scope

`type` restringe conceptualmente uso a:

```text
item
or
invoice
```

Una IA SHOULD seleccionar DeliveryIssues compatibles con el recurso.

Pero no se documenta response de error si se usa uno del tipo incorrecto.

---

# 91. Invoice delivery issue vs Item delivery issue

Invoice:

```text
delivery_issue
```

InvoiceItem:

```text
delivery_issue
```

Mismo concepto, distinto nivel.

No asumir que asignar issue a Invoice lo propaga automáticamente a items.

---

# 92. Invoice status vs Visit status

Son enums distintos.

Invoice:

```text
pending
payed
overdue
canceled
partial
completed
```

Visit:

```text
pending
partial
completed
failed
canceled
```

No mapear 1:1 automáticamente.

Por ejemplo:

```text
Invoice.overdue
```

no existe como Visit status.

---

# 93. Invoice type vs DeliveryIssue type

No confundir:

Invoice.type:

```text
bill
credit_note
delivery_note
debit_note
```

DeliveryIssue.type:

```text
item
invoice
```

---

# 94. Payment method vs Invoice type

Tampoco confundir:

```text
payment_method
type
status
```

son dimensiones independientes.

Ejemplo válido conceptual:

```json
{
  "type": "bill",
  "payment_method": "transfer",
  "status": "payed"
}
```

---

# 95. Accounting y Checkout Detailed

Webhook Checkout Detailed puede incluir:

```text
invoices[]
```

Esto permite sincronización post-entrega.

### Diseño recomendado

```text
Create/maintain Invoice via Accounting API
   |
   v
Driver checkout
   |
   v
visit_checkout_detailed webhook
   |
   v
ERP reconciles status/items/payment/evidence
```

---

# 96. Ejemplo completo Invoice recomendado

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounting/invoices/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "reference": "ERP-INV-10001",
    "currency": "ARS",
    "visit": 123456789,
    "type": "bill",
    "payment_method": "transfer",
    "status": "pending",
    "label": "Factura 10001",
    "items": [
      {
        "title": "Producto A",
        "reference": "ERP-LINE-1",
        "sku": "SKU-A",
        "unit_price": 100.5,
        "planned_units": 2,
        "type": "product"
      }
    ]
  }'
```

Valores ficticios.

---

# 97. Ejemplo PATCH Invoice

```bash
curl -X PATCH \
  'https://api.simpliroute.com/v1/accounting/invoices/<INVOICE_ID>/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "payed",
    "payment_method": "transfer"
  }'
```

`payed` mantiene spelling oficial.

---

# 98. Ejemplo query por Route

```bash
curl \
  'https://api.simpliroute.com/v1/accounting/invoices/?route_id=<ROUTE_UUID>' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 99. Ejemplo query por Planned Date

```bash
curl \
  'https://api.simpliroute.com/v1/accounting/invoices/?planned_date=2026-08-10' \
  -H 'Authorization: Token <TOKEN>'
```

---

# 100. Ejemplo agregar InvoiceItems

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounting/invoices/<INVOICE_ID>/items/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "title": "Producto A",
      "reference": "LINE-001",
      "sku": "SKU-A",
      "unit_price": 1200.50,
      "planned_units": 2,
      "delivered_units": 0,
      "type": "product"
    }
  ]'
```

---

# 101. Ejemplo crear DeliveryIssue

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounting/invoices/delivery-issues/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Producto dañado",
    "description": "El producto llegó con daño visible",
    "type": "item",
    "reference": "DAMAGED_PRODUCT"
  }'
```

---

# 102. Ejemplo crear Product

Debido a inconsistencia `category/categories`, el ejemplo más fiel al cURL oficial es:

```bash
curl -X POST \
  'https://api.simpliroute.com/v1/accounting/products/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '[
    {
      "title": "Producto A",
      "sku": "SKU-A",
      "category": 1
    }
  ]'
```

### Advertencia

```text
category field schema = NEEDS_VERIFICATION
```

La tabla formal contradice este ejemplo.

---

# 103. Status codes específicamente documentados

La sección Accounting publica explícitamente:

## Currency validation

```text
400
```

para errores de country/currency.

Para creación/update/delete general de Invoice, InvoiceItem, DeliveryIssue y Product:

```text
success status exacto = NOT_DOCUMENTED
```

No hardcodear `201/204` como contrato oficial.

---

# 104. Error response shape Accounting

Los dos errores de currency se documentan como mensajes textuales, pero no se muestra el JSON envelope completo.

Por tanto:

```text
Accounting 400 body schema = NOT_DOCUMENTED
```

No asumir:

```json
{"message":"..."}
```

si no fue validado.

---

# 105. Pagination

No se documenta paginación para:

```text
Invoices
Products
ProductCategory
DeliveryIssues
```

No extrapolar Datamart.

---

# 106. Sorting

`NOT_DOCUMENTED`.

---

# 107. Product filtering

`NOT_DOCUMENTED`.

No inventar:

```text
?sku=
?category=
?title=
```

---

# 108. Invoice filtering

Únicos query params publicados:

```text
route_id
planned_date
```

No inventar:

```text
status
reference
visit
type
currency
```

aunque puedan parecer útiles.

---

# 109. InvoiceItem bulk size

POST Items utiliza array.

Máximo:

```text
NOT_DOCUMENTED
```

---

# 110. Invoice items initialization

Una Invoice puede inicializarse con `items` inline.

Después también pueden agregarse/actualizarse vía:

```http
POST /v1/accounting/invoices/{invoice_id}/items/
```

No se documenta diferencia funcional exacta entre ambos caminos.

---

# 111. `payments` vs `payment_method`

Ambos pueden coexistir en schema.

La documentación no define reglas como:

```text
sum(payments.amount) == invoice total
```

ni cómo se calcula total.

No inventar.

---

# 112. Invoice total

No aparece field oficial:

```text
total
subtotal
tax
discount
```

en la tabla Invoice revisada.

No inventarlos.

---

# 113. Taxes

`NOT_DOCUMENTED`.

---

# 114. Invoice timestamp

La definición conceptual menciona time-stamped document, pero tabla de campos no publica:

```text
created
modified
issued_at
due_date
```

No inventar esos campos como writeable.

---

# 115. Overdue logic

Existe status:

```text
overdue
```

pero la documentación no explica cálculo automático ni due date.

No asumir que SimpliRoute cambia automáticamente a overdue.

---

# 116. Invoice status transitions

No existe state machine publicada.

No inventar restricciones como:

```text
pending -> completed only
```

---

# 117. Credit/Debit note relationship

No se publica relación con otra Invoice original.

No inventar fields como:

```text
original_invoice_id
```

---

# 118. Currency casing

Ejemplos usan uppercase:

```text
CLP
USD
```

Case-insensitive:

```text
NOT_DOCUMENTED
```

SHOULD enviar uppercase.

---

# 119. ProductCategory delete with children

Comportamiento si tiene:

- child categories;
- products;

es:

```text
NOT_DOCUMENTED
```

No asumir cascade.

---

# 120. Product delete with InvoiceItems

Comportamiento:

```text
NOT_DOCUMENTED
```

No asumir que borra invoice items históricos.

---

# 121. DeliveryIssue delete when in use

Comportamiento:

```text
NOT_DOCUMENTED
```

---

# 122. Endpoint inventory confirmado

| Método | Endpoint | Función |
|---|---|---|
| POST | `/v1/accounting/invoices/` | Crear Invoice |
| GET | `/v1/accounting/invoices/{invoice_id}/` | Retrieve Invoice |
| PATCH | `/v1/accounting/invoices/{invoice_id}/` | Actualizar Invoice |
| DELETE | `/v1/accounting/invoices/{invoice_id}/` | Eliminar Invoice |
| GET | `/v1/accounting/invoices/?route_id={route_id}` | Invoices por Route |
| GET | `/v1/accounting/invoices/?planned_date={date}` | Invoices por planned date |
| POST | `/v1/accounting/invoices/{invoice_id}/items/` | Crear/actualizar InvoiceItems |
| DELETE | `/v1/accounting/invoices/{invoice_id}/items/{item_id}` | Eliminar InvoiceItem — path inferido del cURL oficial |
| POST | `/v1/accounting/invoices/delivery-issues/` | Crear DeliveryIssue |
| PATCH | `/v1/accounting/invoices/delivery-issues/{delivery_issue_id}/` | Actualizar DeliveryIssue |
| DELETE | `/v1/accounting/invoices/delivery-issues/{delivery_issue_id}/` | Eliminar DeliveryIssue |
| POST | `/v1/accounting/products/` | Crear Product |
| PATCH | `/v1/accounting/products/{product_id}/` | Actualizar Product |
| DELETE | `/v1/accounting/products/{product_id}/` | Eliminar Product |
| GET | `/v1/accounting/products/` | GET Product service declarado; forma exacta individual no detallada |
| POST | `/v1/accounting/product-categories/` | CRUD declarado sobre base; payload exacto no ejemplificado |
| GET | `/v1/accounting/product-categories/` | CRUD declarado sobre base |
| PATCH | `/v1/accounting/product-categories/` | CRUD declarado; path individual no especificado |
| DELETE | `/v1/accounting/product-categories/` | CRUD declarado; path individual no especificado |

---

# 123. Endpoints NO confirmados

No documentar como oficiales sin verificación:

```text
PUT /v1/accounting/invoices/{id}/
GET /v1/accounting/invoices/{id}/items/
PATCH /v1/accounting/invoices/{id}/items/{item_id}/
GET /v1/accounting/invoices/delivery-issues/
GET /v1/accounting/invoices/delivery-issues/{id}/
GET /v1/accounting/products/{product_id}/
POST /v1/accounting/products/{product_id}/...
GET /v1/accounting/product-categories/{id}/
PATCH /v1/accounting/product-categories/{id}/
DELETE /v1/accounting/product-categories/{id}/
```

Algunos son probables por CRUD, pero el path exacto no está mostrado.

---

# 124. Inconsistencias detectadas

| Tema | Problema | Estado |
|---|---|---|
| Accounting examples | HTTP vs HTTPS | `NEEDS_VERIFICATION` |
| Invoice retrieve docs | typo `simrpliroute.com` | `OFFICIAL_TEXT typo` |
| Currency standard | dice ISO 3166 para currency alpha-3 | `NEEDS_VERIFICATION` |
| `payment_method_details` default | dice `none`, shape no claro | `NEEDS_VERIFICATION` |
| `payed` | spelling no estándar, pero enum oficial | `OFFICIAL` |
| Inline item | omite `reference` aunque tabla lo exige | `NEEDS_VERIFICATION` |
| Items POST example | item sin `reference` | `NEEDS_VERIFICATION` |
| Items POST | llamado creation or update sin regla de upsert | `PARTIALLY_DOCUMENTED` |
| Item DELETE | heading sin item ID, cURL con `/items/1` | `NEEDS_VERIFICATION` |
| Product | `category` singular en ejemplo | `NEEDS_VERIFICATION` |
| Product table | `categories` list mandatory | `NEEDS_VERIFICATION` |
| Product text | dice category opcional | `NEEDS_VERIFICATION` |
| ProductCategory paths | CRUD declarado, paths individuales no mostrados | `PARTIALLY_DOCUMENTED` |
| Invoice delivery_issue | tipo de referencia no especificado | `PARTIALLY_DOCUMENTED` |
| Payment amount unit | no declarada | `NOT_DOCUMENTED` |

---

# 125. Reglas MUST para IA

Una IA MUST:

1. verificar Accounting AddOn;
2. usar `Token` auth;
3. usar HTTPS base canónica;
4. enviar `reference`, `currency`, `visit`, `type` en Invoice mínima;
5. limitar Invoice.type al enum oficial;
6. limitar `payment_method` al enum oficial;
7. escribir status `payed` exactamente si corresponde;
8. manejar auto-corrección de currency;
9. tratar HTTP 400 de currency como error de configuración/payload;
10. distinguir Invoice de Visit;
11. distinguir InvoiceItem de Product;
12. mantener InvoiceItem dentro de una Invoice;
13. usar DeliveryIssue.type `item|invoice`;
14. preservar IDs de Product como strings/UUID según ejemplos;
15. marcar `category/categories` como no resuelto;
16. tolerar fields nuevos por evolución del módulo.

---

# 126. Reglas MUST NOT para IA

MUST NOT:

1. usar host `api.simrpliroute.com`;
2. asumir HTTP sin TLS como preferido;
3. cambiar `payed` a `paid`;
4. inventar tipos de Invoice;
5. inventar payment methods;
6. usar `multiple` como Payment.method;
7. asumir currency null borra currency;
8. asumir `reference` unique;
9. asumir Invoice.status sigue Visit.status;
10. asumir Inline Item puede omitir reference con seguridad;
11. inventar upsert key de InvoiceItem;
12. asumir DELETE `/items/` sin item ID borra todos;
13. inventar DeliveryIssue GET endpoints;
14. confiar en `categories` vs `category` sin verificación;
15. inventar tax/total fields;
16. asumir cascade deletes.

---

# 127. Aspectos NOT_DOCUMENTED

```text
Invoice create success code
Invoice retrieve response complete schema
Invoice delete success code
Invoice pagination
Invoice ordering
Invoice list-all behavior
Invoice status state machine
Invoice totals
taxes
discounts
due_date
issued_at
currency case sensitivity
reference uniqueness
Payment object full schema
Payment amount units/minor units
payment reconciliation rules
InvoiceItem update/upsert mechanism
InvoiceItem ID type
InvoiceItem delete canonical endpoint shape
InvoiceItem retrieve endpoint
DeliveryIssue ID type
DeliveryIssue list/retrieve endpoint
DeliveryIssue delete dependency behavior
Product GET exact routes
Product response schema
Product SKU uniqueness
Product price currency
Product category/categories canonical field
ProductCategory exact CRUD item paths
ProductCategory deletion semantics
pagination Product/ProductCategory
rate limits
idempotency
retry
```

---

# 128. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones verificadas:

```text
Invoices
Invoice
Automatic Currency Validation
InvoiceItem
DeliveryIssue
Products and ProductCategory
Webhook Checkout Detailed (para forma observable de invoices/items)
```

Hechos clave confirmados:

```text
Accounting AddOn required
POST /v1/accounting/invoices/
Invoice mandatory fields
Invoice type enum
payment method enum
payment list
Invoice status enum
PATCH/DELETE Invoice
route_id and planned_date filters
currency auto-validation
HTTP 400 currency errors
InvoiceItem POST
InvoiceItem field table
DeliveryIssue POST/PATCH/DELETE
DeliveryIssue type enum
Product POST/PATCH/DELETE
Product/ProductCategory CRUD statement
ProductCategory hierarchy via parent
```

Fecha:

```text
2026-08-10
```

---

# 129. Estado final

**ETAPA 8 COMPLETADA**

Cobertura:

```text
Accounting AddOn
Invoices
Currency validation
Payments
InvoiceItems
DeliveryIssues
Products
ProductCategories
Accounting ↔ Visit relationship
Accounting ↔ Checkout Detailed relationship
```

Siguiente etapa recomendada:

```text
09-tms-providers-documents-vehicles.md
```

Deberá cubrir:

- Transportation Provider;
- create/list/retrieve/update/delete;
- assign provider to Vehicle;
- TMS Documents;
- multipart upload;
- upsert;
- expiration date;
- block/unblock Vehicle;
- status codes;
- base URL inconsistencies;
- payloads;
- validaciones;
- permisos y errores.
