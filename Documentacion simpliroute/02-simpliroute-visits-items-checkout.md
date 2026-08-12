# SimpliRoute Public API — Etapa 2: Visits, Items y Checkout

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Base API principal:** `https://api.simpliroute.com`  
**Autenticación:** `Authorization: Token <SIMPLIROUTE_API_TOKEN>`

---

# 1. Objetivo

Este documento describe exhaustivamente, con la información pública oficial disponible, el dominio central de **Visits** de SimpliRoute y el flujo operativo de **Checkout**.

Incluye:

- Visit Object;
- Property Object;
- Extra fields;
- Observations;
- Tags;
- Items;
- creación de visitas;
- creación con items;
- recuperación individual;
- recuperación por fecha;
- sellers;
- agregar items;
- eliminación individual;
- eliminación masiva;
- actualización parcial;
- actualización completa;
- detalle extendido de visita;
- checkout de visita;
- validaciones de ventanas horarias;
- inicio de ruta;
- almacenamiento de extrafield values;
- carga de imágenes;
- notificaciones de checkout;
- reglas y ambigüedades para agentes de IA.

El objetivo es que una IA pueda implementar estas funciones sin tener que redescubrir el contrato básico en la documentación externa.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Aparece en un ejemplo oficial. |
| `INFERRED` | Deducción útil, no garantía contractual. |
| `NOT_DOCUMENTED` | No está definido públicamente en la referencia revisada. |
| `NEEDS_VERIFICATION` | Hay contradicción, ambigüedad o inconsistencia en la documentación. |

Una IA MUST NOT convertir `OFFICIAL_EXAMPLE`, `INFERRED` o `NEEDS_VERIFICATION` en reglas oficiales sin advertencia.

---

# 3. Concepto de Visit

**Estado:** `OFFICIAL`

SimpliRoute define una visita como cualquier tarea que un conductor deba realizar en la calle, por ejemplo:

- una orden de servicio;
- una entrega;
- un retiro/pickup.

Si una orden debe optimizarse y rastrearse dentro de SimpliRoute, se modela como un **Visit Object**.

---

# 4. Campos mínimos requeridos para crear una visita

**Estado:** `OFFICIAL`

SimpliRoute declara exactamente tres campos como obligatorios para la creación básica de una visita:

```text
title
address
planned_date
```

Ejemplo mínimo conceptual:

```json
{
  "title": "Pedido 123",
  "address": "Av. Ejemplo 100, Buenos Aires",
  "planned_date": "2026-08-10"
}
```

En la documentación de creación por lote, el root suele mostrarse como array:

```json
[
  {
    "title": "Pedido 123",
    "address": "Av. Ejemplo 100, Buenos Aires",
    "planned_date": "2026-08-10"
  }
]
```

### Regla IA

Los demás campos del Visit Object son opcionales **en la creación básica**, salvo que una funcionalidad específica, configuración de cuenta o proceso posterior imponga requisitos adicionales.

---

# 5. Endpoint principal de Visits

Familia:

```text
/v1/routes/visits/
```

Operaciones oficialmente documentadas:

```http
POST   /v1/routes/visits/
GET    /v1/routes/visits/{visit_id}/
GET    /v1/routes/visits/?planned_date={YYYY-MM-DD}
PATCH  /v1/routes/visits/{visit_id}/
PUT    /v1/routes/visits/{visit_id}/
DELETE /v1/routes/visits/{visit_id}/
```

Operaciones complementarias:

```http
POST /v1/routes/visits/{visit_id}/items
POST /v1/bulk/delete/visits/
GET  /v1/plans/visits/{visit_id}/detail/
POST /v1/mobile/visit/{visit_id}/checkout/
```

---

# 6. Visit Object — schema publicado

La referencia oficial presenta el siguiente conjunto de atributos.

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `id` | uuid según tabla oficial | Identificador único del objeto. |
| `order` | Integer | Orden de la visita cuando pertenece a una ruta. |
| `tracking_id` | String | Código de tracking autogenerado. |
| `status` | String | Estado: `pending`, `partial`, `completed`, `failed`, `canceled`. |
| `title` | String | Identificación de la entrega; normalmente empresa o persona. |
| `address` | String | Dirección textual. SimpliRoute recomienda formato compatible con Google Maps. |
| `planned_date` | Date | Fecha prevista de entrega. |
| `latitude` | Float | Latitud. |
| `longitude` | Float | Longitud. |
| `load` | Double | Capacidad/carga usada en el vehículo. |
| `load_2` | Double | Segunda unidad de carga. |
| `load_3` | Double | Tercera unidad de carga. |
| `window_start` | Time | Inicio de primera ventana. |
| `window_end` | Time | Fin de primera ventana. |
| `window_start_2` | Time | Inicio de segunda ventana. |
| `window_end_2` | Time | Fin de segunda ventana. |
| `duration` | Timestamp según tabla oficial | Tiempo de servicio, documentado en formato `HH:mm:ss`. |
| `contact_name` | String | Nombre del receptor/contacto. |
| `contact_phone` | String | Teléfono del receptor. |
| `contact_email` | String | Email del receptor. |
| `reference` | String | Referencia interna; por ejemplo factura u orden. |
| `notes` | String | Información de ayuda para el conductor. |
| `skills_required` | Integer array | IDs de skills obligatorias. |
| `skills_optional` | Integer array | IDs de skills opcionales. |
| `tags` | Integer array | IDs de tags asociados. |
| `route` | UUID | ID único de la ruta. |
| `route_estimated_time_start` | Time | Hora estimada de inicio de ruta, `HH:mm:ss`. |
| `estimated_time_arrival` | Time | ETA estimada por SimpliRoute. |
| `estimated_time_departure` | Time | Hora estimada de salida de la visita. |
| `checkin_time` | Timestamp | Momento en que el conductor inició la atención. |
| `checkout_time` | Timestamp | Momento en que el conductor completó la visita. |
| `checkout_latitude` | Float | Latitud del conductor al completar. |
| `checkout_longitude` | Float | Longitud del conductor al completar. |
| `checkout_comment` | String | Información ingresada al completar. |
| `checkout_observation` | UUID | ID de observación asociada al checkout. |
| `signature` | String | URL de la imagen de firma en el Visit Object de respuesta. |
| `pictures` | URL array | URLs de fotografías asociadas. |
| `created` | Timestamp | Creación del objeto. |
| `modified` | Timestamp | Última modificación. |
| `driver` | Integer | ID del conductor. |
| `vehicle` | Integer | ID del vehículo. |
| `has_alert` | Boolean | Indicador de alerta. |
| `priority_level` | Integer | Nivel de prioridad de 1 a 5. |
| `extra_field_values` | String según tabla oficial | Objeto JSON con atributos/valores preconfigurados. |
| `geocode_alert` | String | Alerta de geocodificación. |
| `visit_type` | String | Tipo de visita. |
| `fleet` | Integer | ID de flota. |
| `items` | Array Object | Items a entregar. |
| `on_its_way` | Timestamp | Momento en que el conductor indica que va hacia la próxima entrega. |
| `seller` | UUID | ID del seller. |
| `properties` | Object | Propiedades extra de la visita. |

---

# 7. Inconsistencia del tipo de `id`

**Estado:** `NEEDS_VERIFICATION`

La tabla del Visit Object etiqueta `id` como:

```text
uuid
```

pero los ejemplos oficiales muestran IDs numéricos como:

```json
"id": 200189436
```

y los endpoints usan números en varios ejemplos.

### Regla IA

Para integración real:

```text
visit_id_type = NEEDS_VERIFICATION
```

Una implementación SHOULD tratar el identificador como valor opaco al construir URLs, evitando depender de operaciones numéricas.

No convertir esta inconsistencia en una suposición rígida.

---

# 8. Estados de una visita

El Visit Object enumera:

```text
pending
partial
completed
failed
canceled
```

El endpoint de checkout enumera específicamente:

```text
pending
completed
failed
```

### Regla

No asumir que todos los estados globales del Visit Object son aceptados como input del checkout.

Para:

```http
POST /v1/mobile/visit/{visit_id}/checkout/
```

usar solamente los estados documentados para ese endpoint hasta que exista confirmación adicional.

---

# 9. Priority Level

**Estado:** `OFFICIAL`

Valores documentados:

| Valor | Significado |
|---:|---|
| `1` | First of the day |
| `2` | Last of the day |
| `3` | High priority |
| `4` | Medium priority |
| `5` | Low priority |

### Nota

Existe también el campo histórico:

```text
priority
```

en ejemplos de response como boolean.

En otros sectores de la documentación `priority` aparece marcado como deprecated.

Para implementaciones nuevas, preferir `priority_level` cuando el caso de uso corresponda.

---

# 10. Visit Object — ejemplo oficial representativo

Ejemplo reducido preservando la estructura publicada:

```json
{
  "id": 200189436,
  "order": null,
  "tracking_id": "SR98278668985242",
  "status": "pending",
  "title": "SimpliRoute3",
  "address": "vespucio norte 22, las condes",
  "latitude": "-33.413433",
  "longitude": "-70.585503",
  "load": 39.0,
  "load_2": 100.0,
  "load_3": 0.0,
  "window_start": null,
  "window_end": null,
  "window_start_2": null,
  "window_end_2": null,
  "duration": "00:00:10",
  "contact_name": "",
  "contact_phone": "",
  "contact_email": null,
  "reference": "",
  "notes": "",
  "skills_required": [],
  "skills_optional": [],
  "tags": [],
  "planned_date": "2016-06-30",
  "programmed_date": null,
  "route": null,
  "estimated_time_arrival": null,
  "estimated_time_departure": null,
  "checkin_time": null,
  "checkout_time": null,
  "checkout_latitude": null,
  "checkout_longitude": null,
  "checkout_comment": "",
  "checkout_observation": null,
  "signature": null,
  "pictures": [],
  "priority": false,
  "has_alert": false,
  "priority_level": null,
  "extra_field_values": null,
  "geocode_alert": null,
  "visit_type": null,
  "current_eta": null,
  "fleet": null,
  "seller": "3615682f-d6c6-4eff-b4c9-26acddfedb76",
  "properties": {
    "city": "Santiago"
  },
  "items": [],
  "on_its_way": null
}
```

---

# 11. Property Object

**Estado:** `OFFICIAL`

Campos documentados:

| Campo | Tipo | Descripción |
|---|---|---|
| `city` | String | Ciudad de la dirección. |
| `delivery_type` | String | Tipo de entrega: `DELIVERY` o `PICK`. |
| `source` | String | Fuente de datos; ejemplo documentado: `CLIENT`. |
| `source_ident` | String | Identificador de la fuente; por ejemplo ID de cliente. |
| `merchant` | String | Merchant asociado. |

Ejemplo:

```json
{
  "properties": {
    "city": "Santiago",
    "delivery_type": "DELIVERY",
    "source": "CLIENT",
    "source_ident": "customer-123",
    "merchant": "merchant-name"
  }
}
```

### Required / nullable

`NOT_DOCUMENTED` globalmente para cada propiedad.

No asumir que todos son válidos o requeridos en todas las cuentas.

---

# 12. Extra Fields

## Endpoint

```http
GET /v1/accounts/extra-fields/
```

URL:

```text
https://api.simpliroute.com/v1/accounts/extra-fields/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

## Uso

Los Extra Fields permiten personalizar el formulario de checkout de la app móvil y pueden aparecer en los detalles de una visita.

SimpliRoute indica que si no están habilitados en la cuenta, debe contactarse a Customer Success.

## Response object

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Integer | ID único del extrafield. |
| `label` | String | Etiqueta visible en la app móvil. |
| `key` | String | Clave usada para registrar/identificar el extrafield. |
| `order` | Integer | Posición dentro del formulario de checkout. |
| `enable` | Boolean | Habilitado/deshabilitado. |
| `type` | String | Tipo. Ejemplo: `STX` = short text. |
| `checkout_type` | String | En qué checkout aplica. Ejemplo: `S&F`. |
| `options` | Array | Opciones si es dropdown. |
| `is_alert` | Boolean | Si dispara alerta en tracking. |
| `is_read` | Boolean | Legible y sólo poblable vía integración, según descripción oficial. |
| `is_write` | Boolean | Escribible por usuario de la app móvil. |
| `is_mandatory` | Boolean | Obligatorio en el formulario. |
| `visit_types` | Array | Tipos de visita asociados. |

Ejemplo:

```json
[
  {
    "id": 23531,
    "label": "order number",
    "key": "order_number",
    "order": 1,
    "enable": true,
    "type": "STX",
    "checkout_type": "S&F",
    "options": [],
    "is_alert": false,
    "is_read": true,
    "is_write": false,
    "is_mandatory": false,
    "visit_types": []
  }
]
```

---

# 13. Observations

## Endpoint

```http
GET /v1/routes/observations/
```

## Propósito

Permite obtener razones configurables de resultado de una visita.

La documentación indica que pueden representar motivos específicos tanto para visitas:

```text
failed
completed
```

y son personalizables según el negocio.

## Schema

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | ID único. |
| `type` | string | `failed` o `completed`. |
| `label` | string | Motivo/nota personalizable. |
| `created` | string | Timestamp de creación. |
| `modified` | string | Timestamp de modificación. |

Ejemplo:

```json
[
  {
    "id": "0b776cb0-zed7-4376-8c6e-fa3db58fde6a",
    "type": "failed",
    "label": "Cliente ausente",
    "created": "2023-10-04T17:02:37.040148Z",
    "modified": "2023-10-04T17:02:37.040148Z"
  },
  {
    "id": "0b776cb0-aed7-7376-8c6e-fa3db58fde6a",
    "type": "completed",
    "label": "Recibido conforme",
    "created": "2023-10-04T17:02:37.040148Z",
    "modified": "2023-10-04T17:02:37.040148Z"
  }
]
```

---

# 14. Tags

## Endpoint

```http
GET /v1/routes/tags/
```

## Propósito

Una visita puede etiquetarse con labels predefinidos específicos del cliente.

SimpliRoute indica que la configuración de tags puede requerir Customer Success.

## Schema

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | ID único del tag. |
| `label` | string | Nombre/descripción. |
| `color` | string | Color hexadecimal. |

Ejemplo:

```json
[
  {
    "id": 4185,
    "label": "pickup",
    "color": "#472929"
  }
]
```

Para asociarlos a la visita se usa:

```json
{
  "tags": [4185]
}
```

---

# 15. Items Object

Los items permiten administrar cantidades de productos/elementos de una visita y entregas parciales.

La documentación permite hasta tres dimensiones/unidades de carga por item.

## Schema

| Campo | Tipo oficial | Descripción |
|---|---|---|
| `id` | uuid según tabla | ID del item. |
| `title` | String | Título del item. |
| `status` | String | `pending`, `failed`, `completed`. |
| `load` | Double | Carga principal. |
| `load_2` | Double | Segunda unidad de carga. |
| `load_3` | Double | Tercera unidad de carga. |
| `reference` | Date según tabla oficial | Identificador interno del item. |
| `notes` | String | Notas. |
| `quantity_planned` | Float | Cantidad planificada. |
| `quantity_delivered` | Float | Cantidad entregada. |

### Inconsistencia importante

La tabla oficial etiqueta:

```text
reference -> Date
```

pero la descripción indica "Internal element identifier" y los ejemplos usan strings:

```json
"reference": "test_reference_1"
```

Por tanto:

```text
item.reference_type = NEEDS_VERIFICATION
```

En la práctica documental disponible, los ejemplos lo tratan como string.

También el `id` se documenta como uuid, pero ejemplos muestran:

```json
"id": 64
```

Tratarlo como identificador opaco.

---

# 16. Ejemplo de Item

```json
{
  "id": 64,
  "title": "prueba2",
  "status": "pending",
  "load": null,
  "load_2": null,
  "load_3": 5.0,
  "reference": "",
  "notes": "",
  "quantity_planned": 4.0,
  "quantity_delivered": 1.0
}
```

---

# 17. Crear una visita

## Endpoint

```http
POST /v1/routes/visits/
```

URL:

```text
https://api.simpliroute.com/v1/routes/visits/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

## Campos obligatorios

```text
title
address
planned_date
```

## Batch

SimpliRoute indica explícitamente que se pueden crear visitas una a una o como array.

La documentación muestra el input de batch como:

```json
[
  {
    "title": "Pedido 1",
    "address": "Dirección 1",
    "planned_date": "2026-08-10"
  },
  {
    "title": "Pedido 2",
    "address": "Dirección 2",
    "planned_date": "2026-08-10"
  }
]
```

### Ambigüedad del root para creación individual

**Estado:** `NEEDS_VERIFICATION`

La documentación dice "one by one or as an array", pero los ejemplos actuales muestran arrays incluso con una sola visita.

Regla segura:

- aceptar conceptualmente batch;
- al implementar contra producción, preferir la forma exacta mostrada por el ejemplo oficial vigente para el caso usado;
- no construir una abstracción que dé por garantizado objeto simple si no fue verificado.

---

# 18. Crear una visita con Items

## Endpoint

```http
POST /v1/routes/visits/
```

Ejemplo:

```json
[
  {
    "title": "SimpliRoute3",
    "address": "vespucio norte 22, las condes",
    "load": 39,
    "load_2": 100,
    "window_start": null,
    "window_end": null,
    "duration": "00:10:00",
    "contact_name": "",
    "contact_phone": "",
    "reference": "",
    "notes": "",
    "planned_date": "2016-06-30",
    "items": [
      {
        "title": "Items Test 1",
        "load": 10,
        "load_2": 0.01,
        "load_3": null,
        "reference": "test_reference_1",
        "notes": "items note",
        "quantity_planned": 1
      },
      {
        "title": "Items Test 2",
        "load": 12,
        "load_2": 0.01,
        "load_3": null,
        "reference": "test_reference_2",
        "notes": "items note",
        "quantity_planned": 1
      }
    ]
  }
]
```

## Return

La documentación indica:

> Returns the visit object if the creation succeeded.

También indica que se devuelve error si algunos parámetros son inválidos.

### Status HTTP específico

`NOT_DOCUMENTED` en esa sección.

No hardcodear `201` como única respuesta exitosa sin verificar en ejecución o documentación adicional.

---

# 19. Recuperar una visita

## Endpoint

```http
GET /v1/routes/visits/{visit_id}/
```

Ejemplo:

```bash
curl --location \
  'https://api.simpliroute.com/v1/routes/visits/<visit_id>/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Token <SIMPLIROUTE_API_TOKEN>'
```

## Propósito

Retorna información de una visita existente a partir de su ID.

### Forma del response

**Estado:** `OFFICIAL_EXAMPLE` + `NEEDS_VERIFICATION`

Aunque conceptualmente se recupera una visita, el ejemplo oficial muestra:

```json
[
  {
    "...": "..."
  }
]
```

es decir, un array con un objeto.

Una IA MUST NOT asumir que el root es object únicamente por semántica REST.

---

# 20. Listar Sellers

## Disponibilidad

SimpliRoute indica que esta funcionalidad debe activarse mediante Customer Success.

## Endpoint

```http
GET /v1/sellers/
```

## Response example

```json
[
  {
    "id": "c25f7a0b-0f54-45da-822e-fba4fd91340c",
    "name": "Seller Name",
    "alias": "mr. seller",
    "language": "es",
    "account": 123,
    "is_deleted": false
  }
]
```

### Nota sobre ejemplo oficial

El ejemplo publicado muestra un número con cero inicial para `account`, que no es JSON numérico válido en JSON estricto.

La documentación aquí debe interpretarse conceptualmente:

```text
account -> identificador de cuenta
```

y no copiar literalmente números JSON inválidos.

---

# 21. Agregar Items a una visita existente

## Endpoint

```http
POST /v1/routes/visits/{visit_id}/items
```

La URL incluye el ID de la visita.

Body root:

```json
[
  {
    "title": "Item A",
    "status": "pending",
    "load": 1000,
    "load_2": null,
    "load_3": 5.0,
    "reference": "",
    "notes": "",
    "quantity_planned": 4.0
  },
  {
    "title": "Item B",
    "status": "pending",
    "load": 1000,
    "load_2": null,
    "load_3": 5.0,
    "reference": "",
    "notes": "",
    "quantity_planned": 33.0
  }
]
```

### Response y status

`NOT_DOCUMENTED` explícitamente en la sección revisada.

---

# 22. Eliminar una visita

## Endpoint

```http
DELETE /v1/routes/visits/{visit_id}/
```

## Efecto lateral crítico

**Estado:** `OFFICIAL`

Eliminar una visita de una ruta que ya fue construida:

```text
NO recalcula automáticamente los tiempos de llegada de los puntos posteriores.
```

Según la documentación, el recálculo debe hacerse:

- desde la interfaz web de SimpliRoute; o
- actualizando manualmente las ETAs con un cálculo externo.

### Regla IA

Una implementación que elimina visitas de rutas activas MUST NOT asumir:

```text
delete -> automatic downstream ETA recomputation
```

---

# 23. Eliminar múltiples visitas

## Endpoint

```http
POST /v1/bulk/delete/visits/
```

Body:

```json
{
  "visits": [
    525687653,
    52561111
  ]
}
```

`visits` debe contener los IDs de las visitas a eliminar.

### Response

`NOT_DOCUMENTED` en la sección revisada.

### Idempotencia

`NOT_DOCUMENTED`.

No reintentar ciegamente sin considerar estado parcial/resultado de la primera llamada.

---

# 24. Recuperar visitas por fecha

## Endpoint

```http
GET /v1/routes/visits/?planned_date={planned_date}
```

Ejemplo:

```text
/v1/routes/visits/?planned_date=2020-01-01
```

Formato de fecha esperado:

```text
YYYY-MM-DD
```

La documentación explica que este endpoint devuelve la lista de visitas del día y su actividad, incluyendo checkout e información proporcionada por conductores.

Por tanto es especialmente útil para:

- tracking operativo;
- conciliación de entregas;
- seguimiento en tiempo real;
- integración de resultados con ERP/WMS.

---

# 25. PATCH — actualización parcial

## Endpoint

```http
PATCH /v1/routes/visits/{visit_id}/
```

Ejemplo:

```json
{
  "title": "Updated visit",
  "address": "new address",
  "load": 39,
  "duration": "00:00:10",
  "contact_name": "New visit contact",
  "contact_phone": "+12341345",
  "notes": "New information",
  "planned_date": "2020-06-30"
}
```

## Semántica

**Estado:** `OFFICIAL`

SimpliRoute declara explícitamente:

```text
Any parameters not provided will be left unchanged.
```

Por tanto:

```text
PATCH field omitted -> unchanged
```

### Null

Esto NO implica que:

```text
field: null -> unchanged
```

El comportamiento de `null` debe verificarse por campo.

---

# 26. PUT — actualización de visita

## Endpoint

```http
PUT /v1/routes/visits/{visit_id}/
```

Ejemplo oficial:

```json
{
  "title": "Updated visit",
  "address": "new address",
  "load": 39,
  "duration": "00:00:10",
  "contact_name": "New visit contact",
  "contact_phone": "+12341345",
  "notes": "New information",
  "planned_date": "2020-06-30"
}
```

### Semántica de campos omitidos

`NOT_DOCUMENTED` explícitamente en esta sección.

Aunque REST suele asociar PUT con reemplazo completo, una IA MUST NOT inventar el comportamiento exacto de campos omitidos.

Para cambios parciales, preferir PATCH porque su semántica sí está documentada.

---

# 27. Visit Detail — detalle extendido

## Endpoint

```http
GET /v1/plans/visits/{visit_id}/detail/
```

## Propósito

Entrega información más detallada, incluyendo:

- Checkout Comment;
- imágenes;
- datos de checkout;
- conductor/vehículo;
- tiempo de servicio;
- items;
- pickup_items;
- invoices;
- checkout user;
- co-drivers.

## Ejemplo representativo

```json
{
  "id": 214596347,
  "title": "cambio_orderq",
  "planned_date": "2024-12-11",
  "address": "AV.LAS FLORES 934,PUDAHUEL",
  "driver_name": null,
  "vehicle_name": "None",
  "latitude": "-33.452090",
  "longitude": "-70.849290",
  "reference": "",
  "status": "completed",
  "estimated_time_arrival": null,
  "order": null,
  "pictures": [],
  "checkout_observation": null,
  "checkin_time": null,
  "checkout_time": "2024-12-11T14:40:45.871000Z",
  "time_service": null,
  "checkout_comment": "Prueba múltiple todo 4 visitas",
  "window_start": "08:00:00",
  "window_end": "12:00:00",
  "window_start_2": "23:59:00",
  "window_end_2": "23:59:00",
  "duration": "00:02:00",
  "extra_field_values": {},
  "notes": "",
  "checkout_latitude": "-33.449918",
  "checkout_longitude": "-70.654024",
  "load": "500.0",
  "load_2": null,
  "load_3": null,
  "signature": "",
  "calculated_service_time": "00:00:00",
  "codrivers": [],
  "checkout_user": {
    "id": 118553,
    "name": "rapidoqa1"
  },
  "items": [],
  "pickup_items": [],
  "contact_name": "None",
  "contact_email": "None",
  "contact_phone": "None",
  "current_eta": null,
  "invoices": []
}
```

---

# 28. Diferencia entre Retrieve Visit y Visit Detail

Existen dos endpoints distintos:

```http
GET /v1/routes/visits/{visit_id}/
```

y:

```http
GET /v1/plans/visits/{visit_id}/detail/
```

El segundo está documentado como una vista de **mayor detalle operativo** y muestra campos como:

```text
driver_name
vehicle_name
time_service
calculated_service_time
codrivers
checkout_user
pickup_items
invoices
```

### Regla IA

No considerarlos aliases.

Elegir según información requerida.

---

# 29. Checkout mínimo de una visita

## Endpoint

```http
POST /v1/mobile/visit/{visit_id}/checkout/
```

Headers:

```http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
Content-Type: application/json
```

## Payload mínimo documentado

```json
{
  "status": "completed",
  "checkout_time": "2025-01-22T17:39:14.120Z",
  "checkout_latitude": -12.105513,
  "checkout_longitude": -76.965618,
  "checkout_comment": "everything was OK"
}
```

---

# 30. Campos de Checkout

La sección del checkout process denomina "Mandatory fields" al grupo, aunque luego describe `checkout_comment` como optional.

| Campo | Tipo | Regla publicada |
|---|---|---|
| `status` | string | Uno de `pending`, `completed`, `failed`. |
| `checkout_time` | string | Fecha/hora ISO 8601. |
| `checkout_latitude` | float | Latitud de entrega. |
| `checkout_longitude` | float | Longitud de entrega. |
| `checkout_comment` | string | Comentario opcional. |

## Otros parámetros

| Campo | Tipo | Descripción |
|---|---|---|
| `checkout_user_id` | int | Usuario que ejecutó checkout; si no se envía, se usa el asociado al token. |
| `signature` | string | Firma como imagen representada en base64. |

### Nota crítica sobre `signature`

En el **Visit Object de lectura**, `signature` se describe como URL de imagen.

En el **request de checkout**, `signature` se describe como base64.

No confundir direcciones del contrato:

```text
Checkout request.signature -> base64
Visit response.signature   -> URL/string de imagen
```

---

# 31. Inconsistencia de formato de `checkout_time`

**Estado:** `NEEDS_VERIFICATION`

Un ejemplo de la sección corta de checkout usa:

```text
2024-04-24 13:24:53
```

mientras la tabla declara ISO 8601 y el checkout process más nuevo muestra:

```text
2025-01-22T17:39:14.120Z
```

### Regla segura

Preferir ISO 8601 completo:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

cuando se pueda producir.

No usar el formato con espacio como garantía contractual preferida.

---

# 32. Checkout completo: no es una sola llamada

**Estado:** `OFFICIAL`

SimpliRoute define el checkout completo similar al de su app móvil como una composición de:

```text
1. Start the route
2. Checkout a visit
3. Store extra-field-values
4. Store pictures
5. Trigger notifications
```

No todos los pasos son necesariamente necesarios para una integración mínima, pero son los servicios documentados para reproducir el flujo completo.

---

# 33. Paso 1 — Start the Route

## Endpoint

```http
POST /v1/events/register/
```

## Propósito

Registrar el inicio permite que el sistema reconozca el horario real de comienzo y actualice las ETA de las visitas.

## Payload

```json
{
  "date_time": "2024-04-24T14:20:45.446Z",
  "latitude": "-0.346644",
  "longitude": "-78.455834",
  "route_id": "24b87d96-813e-4176-a85b-d72171160000",
  "type": "ROUTE_STARTED"
}
```

## Campos

| Campo | Tipo | Required | Descripción |
|---|---|:---:|---|
| `date_time` | string | Sí | Fecha/hora ISO 8601 del inicio. |
| `latitude` | string | No marcado required | Latitud del punto de inicio. |
| `longitude` | string | No marcado required | Longitud del punto de inicio. |
| `route_id` | string | Sí | ID de ruta. |
| `type` | string | Sí | Debe ser `ROUTE_STARTED`. |

---

# 34. Paso 2 — Checkout a Visit

```http
POST /v1/mobile/visit/{visit_id}/checkout/
```

Body recomendado según ejemplo oficial moderno:

```json
{
  "status": "completed",
  "checkout_time": "2025-01-22T17:39:14.120Z",
  "checkout_latitude": -12.105513,
  "checkout_longitude": -76.965618,
  "checkout_comment": "everything was OK"
}
```

---

# 35. Paso 3 — Store Extra Field Values

## Endpoint

```http
POST /v1/routes/visits/multiple/extra-field-values
```

## Body publicado

La API espera un objeto con:

```text
json
visits
```

Ejemplo conceptual válido:

```json
{
  "json": "{\"georeferencia_incorrecta\":false}",
  "visits": [1407818]
}
```

### Importante

El campo:

```text
json
```

contiene un **JSON serializado como string**, según los ejemplos oficiales.

Por tanto conceptualmente:

```text
outer body -> JSON object
outer.json -> string que contiene JSON
outer.visits -> array de visit IDs
```

## Tipos de valores permitidos para extrafields

La documentación indica:

```text
bool
int
string
```

dependiendo de la definición del extra field.

## Nombre del extrafield

La key debe corresponder a un extrafield disponible para la cuenta.

---

# 36. Inconsistencia sintáctica del ejemplo de Extra Field Values

**Estado:** `NEEDS_VERIFICATION`

Uno de los snippets oficiales mezcla comillas de manera que el ejemplo no es JSON estrictamente válido.

Por eso, para implementación debe conservarse la **semántica**:

```json
{
  "json": "{\"operation_nice\":true,\"other_extrafield\":\"a value\"}",
  "visits": [123, 456, 789]
}
```

y no copiar literalmente las comillas defectuosas del snippet.

---

# 37. Paso 4 — Store Pictures

## Endpoint

```http
POST /v1/routes/visits/multiple/pictures/
```

## Content type

El ejemplo usa form upload.

Parámetros:

| Campo | Descripción |
|---|---|
| `image` | Archivo enviado como form/file. |
| `visits` | Array de IDs de visitas a asociar. |

Ejemplo:

```bash
curl --location --request POST \
  'https://api.simpliroute.com/v1/routes/visits/multiple/pictures/' \
  -H 'Authorization: Token <SIMPLIROUTE_API_TOKEN>' \
  --form 'visits="[12, 34, 56]"' \
  --form 'image=@"/path/to/image/picture.png"'
```

### Regla IA

MUST NOT enviar la imagen como JSON base64 en este endpoint salvo que documentación futura lo indique.

`signature` y `pictures` usan mecanismos distintos:

```text
signature in checkout -> base64 string
pictures endpoint      -> file/form upload
```

---

# 38. Paso 5 — Trigger Notifications

## Endpoint

```http
POST /v1/mobile/visit/multiple/checkout/notify
```

## Propósito

La documentación indica que esta llamada final dispara notificaciones de:

- SMS;
- WhatsApp;
- email;
- live tracking.

## Payload

```json
{
  "checkout_time": "2024-04-24T16:39:53.076Z",
  "visits": [407726472]
}
```

## Campos

| Campo | Descripción |
|---|---|
| `checkout_time` | Fecha/hora de checkout en ISO 8601. |
| `visits` | IDs de visitas para las cuales disparar notificación. |

---

# 39. Secuencia completa de Checkout

Pseudoflujo:

```text
route_id = route.id
visit_id = visit.id

POST /v1/events/register/
    type = ROUTE_STARTED

POST /v1/mobile/visit/{visit_id}/checkout/
    status
    checkout_time
    latitude
    longitude
    comment
    optional signature
    optional checkout_user_id

IF visit/account uses extrafields:
    POST /v1/routes/visits/multiple/extra-field-values

IF pictures exist:
    POST /v1/routes/visits/multiple/pictures/

IF notifications must be triggered:
    POST /v1/mobile/visit/multiple/checkout/notify
```

---

# 40. Observations vs Checkout Observation

Las observaciones disponibles se consultan mediante:

```http
GET /v1/routes/observations/
```

El Visit Object puede contener:

```text
checkout_observation
```

que la tabla oficial describe como UUID.

### Integración

Conceptualmente:

```text
Observation.id -> checkout_observation
```

pero el payload mínimo de checkout publicado no muestra ese campo.

Su inclusión directa en el checkout mínimo NO debe inventarse hasta tener confirmación oficial explícita del request completo.

---

# 41. Time Windows

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
  "window_end": "12:00:00",
  "window_start_2": "14:00:00",
  "window_end_2": "18:00:00"
}
```

---

# 42. Validación de ventanas horarias — contradicción temporal en docs

La documentación contiene una sección titulada:

```text
Current situation
```

que afirma que la API no valida correctamente:

- que start < end;
- superposición entre ventanas.

Luego presenta una:

```text
Expected situation
```

con las validaciones que deberían replicarse.

### Estado

`NEEDS_VERIFICATION`

No puede afirmarse sólo por este texto si la implementación de producción actual ya aplica completamente el comportamiento "Expected".

### Regla de cliente recomendada

El integrador SHOULD validar localmente las reglas documentadas antes de enviar el payload, independientemente de si el servidor ya las valida.

---

# 43. Reglas de validación de ventanas

## Primera regla

```text
start <= end
```

La hora inicial no puede ser posterior a la final.

Inválido:

```text
19:00 -> 16:00
```

## Segunda regla

No existe ventana "nocturna" que cruce al día siguiente.

Inválido:

```text
23:00 -> 04:00
```

## Tercera regla

Si hay dos ventanas:

```text
window 1
```

debe ir antes de:

```text
window 2
```

Inválido:

```text
window 1 = 12:00-14:00
window 2 = 08:00-10:00
```

## Cuarta regla

No deben intersectarse.

Inválido:

```text
window 1 = 12:00-14:00
window 2 = 13:00-18:00
```

Mensaje publicado:

```text
Time error: the time window order is inverted.
```

---

# 44. Validador conceptual recomendado

```python
def validate_windows(w1_start, w1_end, w2_start=None, w2_end=None):
    if w1_start > w1_end:
        raise ValueError("window 1 start must not be after end")

    if w2_start is not None and w2_end is not None:
        if w2_start > w2_end:
            raise ValueError("window 2 start must not be after end")

        if w1_start > w2_start:
            raise ValueError("window 1 must be before window 2")

        if w2_start < w1_end:
            raise ValueError("windows must not overlap")
```

Este código es conceptual y NO SDK oficial.

---

# 45. Fechas

`planned_date`:

```text
YYYY-MM-DD
```

Ejemplo:

```text
2020-10-22
```

`checkout_time` y route event `date_time`:

```text
ISO 8601
```

preferido según documentación moderna:

```text
2025-01-22T17:39:14.120Z
```

---

# 46. Coordenadas

Los ejemplos oficiales muestran distintos tipos según endpoint.

Visit Object:

```json
"latitude": "-33.413433",
"longitude": "-70.585503"
```

Checkout:

```json
"checkout_latitude": -12.105513,
"checkout_longitude": -76.965618
```

Start Route:

```json
"latitude": "-0.346644",
"longitude": "-78.455834"
```

### Estado

`NEEDS_VERIFICATION` para normalización global.

La tabla del Visit Object define Float, pero ejemplos de response usan strings.

### Regla IA

Parsear de forma tolerante en lectura.

En escritura, respetar el tipo mostrado/documentado para el endpoint específico.

---

# 47. Load / Load 2 / Load 3

Las visitas y los items admiten hasta tres unidades independientes de capacidad/carga:

```text
load
load_2
load_3
```

No se documenta globalmente la unidad física.

Puede representar unidades configuradas por el negocio.

Una IA MUST NOT asumir:

```text
load = kilograms
```

salvo configuración o documentación de cuenta específica.

---

# 48. `reference`

Visit:

```text
reference -> identificador interno de negocio
```

Ejemplos de uso sugeridos:

- invoice number;
- order number.

Esto puede ser útil para correlacionar SimpliRoute con:

- ERP;
- WMS;
- OMS;
- e-commerce.

### Unicidad

`NOT_DOCUMENTED`.

No asumir que `reference` es unique constraint o clave idempotente.

---

# 49. Tracking ID

`tracking_id` es un código autogenerado de seguimiento.

### Escritura

La documentación lo presenta dentro del Visit Object, pero no lo lista como campo mínimo ni afirma que deba enviarse.

Regla segura:

```text
tracking_id = server-managed unless endpoint docs explicitly say otherwise
```

---

# 50. Campos claramente operativos/server-managed

Según ejemplos y descripción, una integración debería tratar normalmente como resultados/estado:

```text
id
tracking_id
route
estimated_time_arrival
estimated_time_departure
checkin_time
checkout_time
created
modified
pictures
signature URL
on_its_way
```

salvo endpoints específicos que permitan modificar una parte de estos datos.

No enviar el Visit Object completo de respuesta de vuelta a POST/PUT sin verificar writability.

---

# 51. Campos `eta_predicted`, `eta_current`, `current_eta`

Los ejemplos oficiales contienen:

```text
eta_predicted
eta_current
current_eta
```

pero la tabla principal del Visit Object no describe exhaustivamente todos esos campos.

Estado:

```text
OFFICIAL_EXAMPLE
```

No asumir semántica exacta o equivalencia sin una sección específica.

---

# 52. `programmed_date`

Aparece en ejemplos de Visit response:

```json
"programmed_date": null
```

pero no está definido en la tabla principal del Visit Object revisada.

Estado:

```text
OFFICIAL_EXAMPLE
```

No construir reglas de negocio basadas en él sin documentación adicional.

---

# 53. `seller`

El Visit Object publica:

```text
seller -> UUID
```

y existe:

```http
GET /v1/sellers/
```

pero la feature requiere activación vía Customer Success.

### Regla

Un payload que dependa de `seller` debe considerar habilitación de cuenta.

---

# 54. `tags`

El Visit Object usa:

```text
tags -> Integer array
```

y los tags se descubren por:

```http
GET /v1/routes/tags/
```

No enviar IDs arbitrarios.

---

# 55. `skills_required` y `skills_optional`

Son arrays de IDs de skills.

La definición completa de Skills será documentada en la etapa de Vehicles/Users/Skills/Zones/Fleets.

En este documento la regla es:

```text
visit.skills_required -> IDs de skills obligatorias
visit.skills_optional -> IDs de skills opcionales
```

---

# 56. `extra_field_values`

La documentación principal lo presenta dentro de Visit.

El checkout completo usa el endpoint:

```http
POST /v1/routes/visits/multiple/extra-field-values
```

No asumir que modificar directamente `extra_field_values` vía PATCH de Visit es equivalente al servicio especializado.

Usar el endpoint especializado para valores de checkout cuando el flujo documentado así lo indique.

---

# 57. Status de items y entrega parcial

Items permiten controlar:

```text
quantity_planned
quantity_delivered
status
```

La documentación menciona gestión de entrega parcial.

Un sistema puede comparar:

```text
quantity_delivered < quantity_planned
```

pero la lógica exacta que convierte eso en estado `partial` o en otros estados no está completamente especificada en esta sección.

Estado:

```text
NOT_DOCUMENTED
```

No reconstruir reglas internas de SimpliRoute sin evidencia.

---

# 58. Pickup Items

`pickup_items` aparece en Visit Detail y webhooks detallados.

La sección principal de Items se concentra en items de entrega.

El contrato completo de creación/gestión de `pickup_items` no está descrito en el bloque público de Visits revisado.

Estado:

```text
PARTIALLY_DOCUMENTED
```

Una IA MUST NOT inventar un endpoint de pickup items.

---

# 59. Status codes específicos del dominio Visits

La referencia pública de Visits revisada no publica una tabla exhaustiva status-by-status para cada operación.

Por tanto:

| Endpoint | Success status exacto | Estado documental |
|---|---|---|
| `POST /v1/routes/visits/` | no especificado en bloque | `NOT_DOCUMENTED` |
| `GET /v1/routes/visits/{id}/` | no especificado | `NOT_DOCUMENTED` |
| `POST /v1/routes/visits/{id}/items` | no especificado | `NOT_DOCUMENTED` |
| `DELETE /v1/routes/visits/{id}/` | no especificado | `NOT_DOCUMENTED` |
| `POST /v1/bulk/delete/visits/` | no especificado | `NOT_DOCUMENTED` |
| `PATCH /v1/routes/visits/{id}/` | no especificado | `NOT_DOCUMENTED` |
| `PUT /v1/routes/visits/{id}/` | no especificado | `NOT_DOCUMENTED` |
| `GET /v1/plans/visits/{id}/detail/` | no especificado | `NOT_DOCUMENTED` |
| `POST /v1/mobile/visit/{id}/checkout/` | no especificado | `NOT_DOCUMENTED` |

Usar la tabla global de errores de Etapa 1 como base, pero no inventar códigos específicos de éxito.

---

# 60. Paginación de Visits

Para:

```http
GET /v1/routes/visits/?planned_date=...
```

la sección pública revisada no documenta:

- `limit`;
- `offset`;
- cursor;
- page size;
- next/previous.

Estado:

```text
NOT_DOCUMENTED
```

No extrapolar paginación de Datamart.

---

# 61. Filtros adicionales de Visits

Además de:

```text
planned_date
```

no se documentan en esta sección otros query params como contrato global.

MUST NOT inventar:

```text
status=
reference=
driver=
vehicle=
```

aunque puedan existir internamente o en otras superficies.

---

# 62. Ordenamiento de listado

`NOT_DOCUMENTED`.

No asumir:

```text
?ordering=
?sort=
```

para Visits.

---

# 63. Bulk create size

`NOT_DOCUMENTED`.

SimpliRoute permite crear array de visitas, pero la sección revisada no declara número máximo de visitas por request.

No inventar un límite.

---

# 64. Bulk delete size

`NOT_DOCUMENTED`.

No se publica máximo de IDs en:

```json
{
  "visits": [...]
}
```

---

# 65. Picture limits

La sección pública no especifica:

- tamaño máximo de archivo;
- cantidad máxima de imágenes;
- MIME types;
- extensiones aceptadas;
- dimensiones máximas.

Estado:

```text
NOT_DOCUMENTED
```

No validar con límites inventados.

---

# 66. Signature limits

No se especifican:

- formato de imagen;
- MIME;
- tamaño máximo;
- encoding exacto más allá de "base64 representation".

Estado:

```text
PARTIALLY_DOCUMENTED
```

---

# 67. Checkout idempotency

`NOT_DOCUMENTED`.

No asumir que repetir:

```http
POST /v1/mobile/visit/{id}/checkout/
```

es inocuo.

Un retry luego de timeout debe manejarse con cuidado.

---

# 68. Notification idempotency

`NOT_DOCUMENTED`.

Repetir:

```http
POST /v1/mobile/visit/multiple/checkout/notify
```

podría conceptualmente reenviar notificaciones; la documentación no define deduplicación.

No implementar retry ciego sin evaluar riesgo.

---

# 69. Extra field assignment semantics

Una misma llamada puede aplicar los mismos valores a múltiples visitas:

```json
{
  "json": "{\"foo\":\"bar\"}",
  "visits": [1, 2, 3]
}
```

Esto significa:

```text
same extrafield value set -> multiple visits
```

No usar este endpoint para intentar enviar un objeto de valores diferente por cada visita en la misma llamada, porque ese shape no está documentado.

---

# 70. Flujo recomendado ERP/WMS → SimpliRoute

```text
ERP/WMS
   |
   | map order -> Visit
   v
POST /v1/routes/visits/
   |
   | receive visit id + tracking information
   v
SimpliRoute optimization / planning
   |
   v
Driver execution
   |
   +--> checkout
   +--> extrafields
   +--> pictures
   +--> notifications
   |
   v
GET /v1/routes/visits/?planned_date=...
or
GET /v1/plans/visits/{id}/detail/
   |
   v
ERP/WMS updates final status
```

---

# 71. Modelo de Visit recomendado en integración interna

Ejemplo de DTO propio:

```json
{
  "title": "Order 100245",
  "address": "Av. Siempre Viva 742",
  "planned_date": "2026-08-10",
  "latitude": -34.6000,
  "longitude": -58.4000,
  "load": 10,
  "window_start": "09:00:00",
  "window_end": "13:00:00",
  "duration": "00:10:00",
  "contact_name": "Cliente",
  "contact_phone": "+5491112345678",
  "contact_email": "cliente@example.com",
  "reference": "ERP-100245",
  "notes": "Entregar en recepción",
  "skills_required": [],
  "skills_optional": [],
  "tags": [],
  "priority_level": 4,
  "items": [
    {
      "title": "Producto A",
      "reference": "SKU-A",
      "quantity_planned": 2
    }
  ]
}
```

Este ejemplo combina campos oficiales, pero no implica que todos sean requeridos.

---

# 72. Validaciones de cliente recomendadas antes de crear Visit

```text
MUST:
- title presente
- address presente
- planned_date presente y YYYY-MM-DD

SHOULD:
- validar window_start <= window_end
- validar segunda ventana
- validar no overlap
- validar rango de priority_level 1..5
- asegurar que IDs de skills/tags sean existentes
- no enviar tags/seller si feature no está habilitada
- no inventar unidad de load
- preservar reference como correlación externa si el negocio la usa
```

---

# 73. Parser de response recomendado

Debido a inconsistencias de tipos en ejemplos:

```text
latitude: Float en tabla, string en response
load: Double en tabla, string en algunos detalles
id: uuid en tabla, integer en ejemplos
```

un parser robusto debería:

```text
1. no asumir tipos más estrictos que el contrato real observado;
2. normalizar internamente luego de validar;
3. preservar el valor original para diagnóstico;
4. no usar IDs como números para aritmética.
```

---

# 74. Contradicciones/ambigüedades detectadas

| Tema | Evidencia | Estado |
|---|---|---|
| Visit `id` | tabla dice uuid; ejemplos enteros | `NEEDS_VERIFICATION` |
| Item `id` | tabla dice uuid; ejemplos enteros | `NEEDS_VERIFICATION` |
| Item `reference` | tabla dice Date; ejemplos strings | `NEEDS_VERIFICATION` |
| Retrieve response | semántica singular; ejemplo array | `NEEDS_VERIFICATION` |
| Create one-by-one | texto admite uno por uno; ejemplos usan array | `NEEDS_VERIFICATION` |
| checkout_time | un ejemplo usa espacio; tabla pide ISO 8601 | `NEEDS_VERIFICATION` |
| coordenadas | tabla Float; varios responses strings | `NEEDS_VERIFICATION` |
| time-window validation | Current vs Expected situation | `NEEDS_VERIFICATION` |
| Extra field body | snippet con comillas inválidas | `OFFICIAL_EXAMPLE` defectuoso |
| Seller `account` example | número con cero inicial | `OFFICIAL_EXAMPLE` defectuoso |

---

# 75. Reglas MUST para IA

Una IA que implemente Visits MUST:

1. usar `Authorization: Token ...`;
2. usar `title`, `address`, `planned_date` como mínimo de creación;
3. usar `YYYY-MM-DD` para `planned_date`;
4. usar PATCH para actualización parcial;
5. preservar campos omitidos en PATCH;
6. tratar IDs como opacos frente a inconsistencias documentales;
7. consultar tags/observations/extrafields antes de usar IDs dinámicos;
8. validar ventanas localmente;
9. usar ISO 8601 para checkout moderno;
10. enviar pictures por form/file;
11. enviar signature de checkout como base64 si se usa;
12. separar Visit Retrieve de Visit Detail;
13. considerar checkout completo como workflow multi-servicio;
14. registrar la ausencia de status codes específicos cuando no estén documentados.

---

# 76. Reglas MUST NOT para IA

MUST NOT:

1. inventar un campo `reference_id`; el campo publicado del Visit Object es `reference`;
2. asumir que `reference` es único;
3. asumir que delete recalcula ETAs;
4. asumir que POST es idempotente;
5. asumir que todos los status del Visit Object se aceptan en checkout;
6. enviar `canceled` al checkout sólo porque existe como status global;
7. inventar paginación de `/v1/routes/visits/`;
8. extrapolar Datamart pagination;
9. asumir que `load` significa kg;
10. asumir que coordenadas siempre vienen como JSON number;
11. copiar literalmente snippets oficiales que son JSON inválido;
12. asumir que todos los extra fields están habilitados;
13. asumir que Sellers están habilitados;
14. reintentar notificaciones ciegamente;
15. usar Visit response completo como PUT body sin verificar writability.

---

# 77. Endpoint Inventory de esta etapa

| Método | Endpoint | Propósito |
|---|---|---|
| GET | `/v1/accounts/extra-fields/` | Listar extra fields configurados |
| GET | `/v1/routes/observations/` | Listar observations |
| GET | `/v1/routes/tags/` | Listar tags |
| POST | `/v1/routes/visits/` | Crear una o múltiples visitas |
| GET | `/v1/routes/visits/{visit_id}/` | Recuperar visita |
| GET | `/v1/sellers/` | Listar sellers |
| POST | `/v1/routes/visits/{visit_id}/items` | Agregar items |
| DELETE | `/v1/routes/visits/{visit_id}/` | Eliminar visita |
| POST | `/v1/bulk/delete/visits/` | Eliminar múltiples visitas |
| GET | `/v1/routes/visits/?planned_date={date}` | Listar visitas por fecha |
| PATCH | `/v1/routes/visits/{visit_id}/` | Actualización parcial |
| PUT | `/v1/routes/visits/{visit_id}/` | Actualización de visita |
| GET | `/v1/plans/visits/{visit_id}/detail/` | Detalle extendido |
| POST | `/v1/mobile/visit/{visit_id}/checkout/` | Checkout |
| POST | `/v1/events/register/` | Registrar inicio de ruta |
| POST | `/v1/routes/visits/multiple/extra-field-values` | Guardar valores de extra fields |
| POST | `/v1/routes/visits/multiple/pictures/` | Adjuntar imágenes |
| POST | `/v1/mobile/visit/multiple/checkout/notify` | Disparar notificaciones |

---

# 78. Ejemplo end-to-end compacto

## Crear

```bash
curl --location \
  'https://api.simpliroute.com/v1/routes/visits/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  --data '[
    {
      "title": "Pedido 1001",
      "address": "Av. Ejemplo 100",
      "planned_date": "2026-08-10",
      "reference": "ERP-1001",
      "duration": "00:10:00"
    }
  ]'
```

## Consultar por fecha

```bash
curl --location \
  'https://api.simpliroute.com/v1/routes/visits/?planned_date=2026-08-10' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json'
```

## Actualizar parcialmente

```bash
curl -X PATCH \
  'https://api.simpliroute.com/v1/routes/visits/<VISIT_ID>/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "notes": "Entregar por acceso lateral"
  }'
```

## Checkout

```bash
curl --location --request POST \
  'https://api.simpliroute.com/v1/mobile/visit/<VISIT_ID>/checkout/' \
  -H 'Authorization: Token <TOKEN>' \
  -H 'Content-Type: application/json' \
  --data '{
    "status": "completed",
    "checkout_time": "2026-08-10T18:30:00.000Z",
    "checkout_latitude": -34.60,
    "checkout_longitude": -58.40,
    "checkout_comment": "Entrega conforme"
  }'
```

---

# 79. Aspectos NO documentados en esta etapa

No se encontró contrato público exhaustivo para:

```text
max visits per bulk create
max visits per bulk delete
pagination de main Visits endpoint
sort/order query params
otros filtros generales de Visits
HTTP success code exacto por cada endpoint de Visits
schema universal de error de Visits
idempotency
retry policy de checkout
retry/dedup de notifications
picture max file size
picture accepted MIME types
picture max count
signature max size
reference uniqueness
full pickup_items mutation API
exact null semantics per field
exact writable/read-only matrix for every Visit field
```

Una IA debe tratar estos puntos como desconocidos.

---

# 80. Fuentes oficiales verificadas

Fuente principal:

```text
https://documentation.simpliroute.com/
```

Secciones utilizadas:

```text
Visits
The Visit Object
The Property Object
The Extra field Object
Observations
Tags
The Items Object
Create a visit with items
Retrieve a visit
List sellers
Adding items to a visit
Delete a visit
Delete visit massive
Retrieve visits by date
Update a visit Partial
Update a visit
Visit detail
Checkout a visit
API validation of time windows - visits
The Checkout Process
Start the route
Store extra-field-values
Store pictures
Trigger notifications
```

Fecha de verificación:

```text
2026-08-10
```

---

# 81. Estado final

**ETAPA 2 COMPLETADA**

Este documento cubre la superficie pública encontrada de:

```text
Visits
Items
Properties
Extra Fields
Observations
Tags
Sellers relacionados
Visit Detail
Checkout
Checkout workflow
Time Window validation
```

La siguiente etapa recomendada es:

```text
03-plans-routes-route-properties.md
```

y deberá cubrir:

- Plans;
- creación de planes;
- relación Plan → Routes → Visits;
- Routes CRUD publicado;
- vehículos con rutas por fecha;
- visitas por ruta;
- update de route reference;
- Route Properties;
- bulk-search de route properties;
- tipos;
- payloads;
- responses;
- restricciones;
- IDs;
- errores;
- inconsistencias oficiales.
