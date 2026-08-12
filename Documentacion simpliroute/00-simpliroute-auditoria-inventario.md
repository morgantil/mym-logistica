# SimpliRoute Public API --- Etapa 0: Auditoría, alcance e inventario maestro

**Estado:** COMPLETADO --- discovery inicial de la documentación pública
oficial\
**Fecha de verificación:** 2026-08-10\
**Fuente primaria:** https://documentation.simpliroute.com/\
**API base oficial:** `https://api.simpliroute.com`

------------------------------------------------------------------------

## 1. Objetivo de esta documentación

Este repositorio documental tiene como objetivo convertirse en una
**fuente técnica autocontenida para humanos y agentes de IA** que deban
implementar integraciones con la API pública de SimpliRoute.

La regla de finalización del proyecto es:

> Una IA debe poder implementar el consumo de cualquier funcionalidad
> públicamente documentada por SimpliRoute consultando únicamente estos
> archivos Markdown, sin tener que investigar nuevamente el sitio
> oficial para descubrir endpoints, payloads, tipos, respuestas o reglas
> de integración.

Esta etapa NO intenta todavía reemplazar la referencia detallada
endpoint por endpoint. Su propósito es congelar el alcance, identificar
todas las áreas públicas encontradas y definir qué deberá documentarse
en las etapas siguientes.

------------------------------------------------------------------------

## 2. Reglas de confiabilidad

Toda afirmación técnica de las etapas posteriores debe clasificarse con
una de estas etiquetas:

-   `OFFICIAL`: indicado explícitamente por la documentación pública
    oficial.
-   `OFFICIAL_EXAMPLE`: comportamiento/campo presente en un ejemplo
    oficial, pero no necesariamente descrito como contrato normativo.
-   `INFERRED`: deducción útil derivada de material oficial. Nunca debe
    presentarse como garantía contractual.
-   `NOT_DOCUMENTED`: SimpliRoute no especifica públicamente el
    comportamiento.
-   `NEEDS_VERIFICATION`: existe información parcial, ambigua,
    contradictoria o potencialmente desactualizada.

### Regla anti-alucinación para IA

Una IA que consuma estos documentos:

1.  NO debe inventar endpoints.
2.  NO debe inventar campos de payload.
3.  NO debe asumir obligatoriedad si la fuente no la declara.
4.  NO debe asumir códigos HTTP, límites, paginación, idempotencia o
    reintentos si no están documentados.
5.  Debe preferir la especificación `OFFICIAL` sobre ejemplos.
6.  Si un ejemplo oficial contradice texto normativo, debe marcarse la
    discrepancia.
7.  Los tokens que aparecen en ejemplos son ficticios o deben tratarse
    como secretos; nunca deben copiarse como credenciales reales.

------------------------------------------------------------------------

## 3. Fundamentos confirmados

La documentación oficial presenta SimpliRoute como una API REST con URLs
orientadas a recursos.

### Base URL

``` text
https://api.simpliroute.com
```

### Formato de respuesta

La documentación indica que las respuestas de API, incluidos errores,
utilizan JSON.

### Autenticación

La API utiliza un token enviado mediante el header HTTP:

``` http
Authorization: Token <SIMPLIROUTE_API_TOKEN>
```

El endpoint oficial utilizado como ejemplo de autenticación/cuenta es:

``` http
GET /v1/accounts/me/
```

Ejemplo mínimo:

``` bash
curl -X GET \
  'https://api.simpliroute.com/v1/accounts/me/' \
  -H 'Authorization: Token <SIMPLIROUTE_API_TOKEN>' \
  -H 'Content-Type: application/json'
```

### Seguridad

La documentación oficial advierte que la API key/token secreto **no debe
exponerse en código cliente público**.

Por lo tanto, para una integración propia:

-   almacenar el token como secreto;
-   no versionarlo en Git;
-   no incluirlo en aplicaciones frontend públicas;
-   no registrarlo en logs;
-   utilizar HTTPS;
-   redactarlo en trazas y mensajes de error.

Las recomendaciones anteriores que excedan el texto explícito de
SimpliRoute deben entenderse como prácticas de seguridad de
implementación, no como nuevos requisitos del protocolo.

------------------------------------------------------------------------

# 4. Mapa completo de áreas públicas encontradas

La auditoría de la tabla de contenidos de la documentación pública
oficial encontró las siguientes áreas.

## 4.1 Authentication

Incluye autenticación por API token y consulta de la cuenta actual.

Endpoint confirmado durante discovery:

``` http
GET /v1/accounts/me/
```

------------------------------------------------------------------------

## 4.2 Visits

Área central para integraciones logísticas.

La documentación pública incluye:

-   Visit Object
-   Property Object
-   Extra field Object
-   Observations
-   Tags
-   Items Object
-   creación de visitas con items
-   recuperación de una visita
-   sellers
-   agregar items
-   eliminación individual
-   eliminación masiva
-   recuperación por fecha
-   actualización parcial
-   actualización completa
-   detalle de visita
-   checkout de visita
-   reglas/validación de ventanas horarias

Endpoints ya confirmados durante discovery:

``` http
POST   /v1/routes/visits/
GET    /v1/routes/visits/{visit_id}/
PATCH  /v1/routes/visits/{visit_id}/
PUT    /v1/routes/visits/{visit_id}/
DELETE /v1/routes/visits/{visit_id}/

GET    /v1/routes/visits/?planned_date={YYYY-MM-DD}
POST   /v1/routes/visits/{visit_id}/items
POST   /v1/bulk/delete/visits/

GET    /v1/plans/visits/{visit_id}/detail/
POST   /v1/mobile/visit/{visit_id}/checkout/

GET    /v1/sellers/
```

Observación importante encontrada oficialmente: eliminar una visita de
una ruta ya construida no implica automáticamente recalcular las horas
de llegada de las visitas siguientes.

------------------------------------------------------------------------

## 4.3 Plans management

La documentación posee una sección específica de administración/creación
de planes.

Debe documentarse completamente:

-   endpoint(s);
-   request;
-   response;
-   relación plan → rutas → visitas;
-   IDs;
-   fechas;
-   restricciones;
-   efectos secundarios.

------------------------------------------------------------------------

## 4.4 Routes

La documentación pública incluye:

-   creación de rutas;
-   vehículos con rutas para una fecha;
-   visitas pertenecientes a una ruta;
-   actualización de referencia de ruta.

Endpoints confirmados durante discovery:

``` http
POST  /v1/routes/routes/
GET   /v1/plans/routes/{plan_or_route_identifier}/visits/
PATCH /v1/routes/routes/{route_id}/
```

**NEEDS_VERIFICATION:** la nomenclatura `PLAN_ID` usada en algunos
ejemplos de URLs de visitas por ruta debe verificarse cuidadosamente
contra el significado real del identificador antes de convertirla en una
regla para implementación.

------------------------------------------------------------------------

## 4.5 Route Properties

Área pública encontrada:

-   obtener propiedades;
-   crear propiedades;
-   actualización completa;
-   actualización parcial;
-   eliminación;
-   búsqueda masiva.

Endpoints confirmados:

``` http
PUT    /v1/routes/routes-properties/{route_id}
PATCH  /v1/routes/routes-properties/{route_id}
DELETE /v1/routes/routes-properties/{route_id}

POST   /v1/routes/routes-properties/bulk-search/
```

Los endpoints GET/creación exactos se congelarán en la referencia
detallada después de verificar su sintaxis textual completa.

------------------------------------------------------------------------

## 4.6 Vehicles

La referencia oficial incluye CRUD de vehículos:

-   crear;
-   listar;
-   obtener uno;
-   PATCH;
-   PUT;
-   DELETE.

Familia de recursos confirmada:

``` text
/v1/routes/vehicles/
```

La documentación también describe comportamiento especial de
`extra_properties` durante PATCH, incluyendo merge/upsert y eliminación
de una propiedad mediante valor `null`.

------------------------------------------------------------------------

## 4.7 Clients

Área pública encontrada:

-   crear clientes;
-   obtener/listar clientes;
-   eliminar un cliente;
-   eliminación de clientes;
-   actualizar clientes;
-   propiedades personalizadas;
-   crear custom property;
-   usar custom properties;
-   ForceField.

Esta área será documentada aunque no sea necesaria para todas las
integraciones logísticas, porque forma parte de la API pública ofrecida.

------------------------------------------------------------------------

## 4.8 Users / Drivers

La documentación incluye:

-   listar usuarios;
-   crear usuario;
-   obtener usuario;
-   actualizar usuario;
-   eliminar usuario.

Familia de endpoint confirmada:

``` text
/v1/accounts/drivers/
```

Ejemplos confirmados:

``` http
POST /v1/accounts/drivers/
GET  /v1/accounts/drivers/{user_id}/
```

La referencia detallada deberá aclarar la relación conceptual entre
`Users`, `Drivers`, `default_driver`, `driver` de una ruta y co-drivers.

------------------------------------------------------------------------

## 4.9 Skills

Existe una sección pública específica de Skills.

Debe relevarse:

-   modelo;
-   IDs;
-   endpoints;
-   asociación con vehículos/visitas;
-   skills requeridas vs opcionales;
-   efecto sobre optimización.

------------------------------------------------------------------------

## 4.10 Zones

Existe una sección pública específica de Zones.

Debe documentarse completa, incluso si su uso es opcional.

------------------------------------------------------------------------

## 4.11 Fleets

Existe una sección pública de Fleets que incluye al menos listado de
flotas.

Debe verificarse el endpoint exacto y el schema completo.

------------------------------------------------------------------------

# 5. Webhooks

La documentación pública contiene una sección extensa de Webhooks.

## 5.1 Tipos de webhook publicados

Durante el discovery se encontraron las siguientes claves:

``` text
plan_created
plan_edited
route_created
route_edited
route_started
route_finished
on_its_way
visit_checkout
visit_checkout_detailed
```

## 5.2 Configuración por API

Endpoints confirmados:

``` http
POST   /v1/addons/webhooks
GET    /v1/addons/webhooks
PUT    /v1/addons/webhooks
DELETE /v1/addons/webhooks
```

La configuración relaciona cada webhook con:

-   una URL destino;
-   headers configurables.

Modelo de configuración observado:

``` json
{
  "webhook": "plan_created",
  "url": "https://example.com/webhooks/simpliroute",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Token <CUSTOM_DESTINATION_TOKEN>"
  }
}
```

## 5.3 Entrega y reintentos

Para eventos documentados, SimpliRoute indica que el receptor debe
responder HTTP `200`. En los webhooks donde la documentación explicita
esta política, un fallo provoca un reintento luego de 30 segundos, con
hasta 3 intentos totales.

**Importante:** en la etapa detallada se verificará evento por evento
antes de generalizar esta política a todos los webhooks.

------------------------------------------------------------------------

# 6. Optimization

La documentación oficial posee un bloque completo de optimización.

Subáreas encontradas:

-   Optimization Instance
-   Optimization Vehicles
-   Deliveries
-   Optimization options
-   Multiple depots
-   Backhaul Optimization
-   Stop Routing
-   Pick-up and Delivery
-   Rest Time
-   Incremental Routing
-   Long Routes
-   Radial Routing
-   Estimated Time Calculation
-   Validate Incompatibilities

La referencia detallada deberá documentar íntegramente:

-   endpoint(s) de optimización;
-   modelo de entrada;
-   `vehicles`;
-   `nodes`/deliveries;
-   tours;
-   depósitos;
-   ventanas horarias;
-   capacidades;
-   service time;
-   restricciones;
-   opciones;
-   incompatibilidades;
-   resultados;
-   nodos filtrados;
-   nodos no atendidos;
-   métricas;
-   cálculo/re-cálculo de ETA.

La documentación oficial indica, entre otras reglas, que si un vehículo
no especifica ventana horaria, el algoritmo asume un rango diario por
defecto, y que `duration` de un nodo representa tiempo de servicio en
minutos. Estas reglas se capturarán con sus tipos y excepciones en la
etapa de referencia de optimización.

------------------------------------------------------------------------

# 7. Off-Route Reasons

Existe una sección pública específica:

-   ejemplo;
-   lista de códigos.

Debe documentarse para que un consumidor pueda interpretar correctamente
motivos de desvío/fuera de ruta.

------------------------------------------------------------------------

# 8. Optimization Metadata

Existe una sección específica de metadata de optimización, incluyendo
Distance.

Debe relevarse su contrato completo.

------------------------------------------------------------------------

# 9. Accounting / Invoices

La API pública no se limita a rutas y visitas. También existe una
superficie de accounting.

Áreas encontradas:

-   Invoice
-   InvoiceItem
-   DeliveryIssue
-   Products
-   ProductCategory

Familias/endpoints confirmados durante discovery:

``` text
/v1/accounting/invoices/
/v1/accounting/invoices/{invoice_id}/
/v1/accounting/invoices/delivery-issues/{delivery_issue_id}/
/v1/accounting/products/
/v1/accounting/products/{product_id}/
```

Se documentarán CRUD, campos, enums, relaciones con visitas, estados y
ejemplos.

------------------------------------------------------------------------

# 10. Checkout Process

La documentación pública describe el checkout como un proceso compuesto
por varios servicios.

Flujo encontrado:

1.  iniciar la ruta;
2.  checkout de una visita;
3.  almacenar valores de extra fields;
4.  almacenar imágenes;
5.  disparar notificaciones.

Endpoints confirmados:

``` http
POST /v1/events/register/
POST /v1/mobile/visit/{visit_id}/checkout/
POST /v1/routes/visits/multiple/extra-field-values
POST /v1/routes/visits/multiple/pictures/
POST /v1/mobile/visit/multiple/checkout/notify
```

Evento observado para inicio de ruta:

``` json
{
  "date_time": "2024-04-24T14:20:45.446Z",
  "latitude": "-0.346644",
  "longitude": "-78.455834",
  "route_id": "<route_uuid>",
  "type": "ROUTE_STARTED"
}
```

La etapa detallada documentará también `ROUTE_FINISHED` y cualquier otro
evento aceptado públicamente.

------------------------------------------------------------------------

# 11. TMS --- Transportation Provider

Área pública encontrada:

-   creación;
-   listado;
-   retrieve;
-   actualización;
-   eliminación;
-   asignación de Transportation Provider a Vehicle.

Debe incluirse en la documentación final aunque el proyecto inicial use
solamente logística de última milla.

------------------------------------------------------------------------

# 12. TMS --- Documents

Área pública encontrada:

-   creación/actualización mediante upsert;
-   actualización de fecha de expiración por `document_id`.

Se relevarán schemas, IDs, fechas y asociación con recursos TMS.

------------------------------------------------------------------------

# 13. TMS --- Vehicle Block / Unblock

Área pública encontrada:

-   bloquear vehículo;
-   desbloquear vehículo.

Debe documentarse el impacto operativo que la documentación oficial
indique.

------------------------------------------------------------------------

# 14. GPS Integration

Existe documentación pública específica para integrar GPS y datos
variables.

Áreas encontradas:

-   frecuencia de envío;
-   pérdida de señal;
-   reenvío de datos almacenados;
-   payload GPS;
-   temperatura;
-   alert object;
-   alerts;
-   lista de alertas disponibles.

La documentación recomienda frecuencias máximas diferentes según tamaño
de flota y contempla colas locales cuando se pierde conectividad.

Ejemplo conceptual de payload encontrado:

``` json
[
  {
    "latitude": -33.4311548,
    "longitude": -70.5701852,
    "timestamp": "2017-10-19 09:12:02-00",
    "vehicleId": "<vehicle_id>",
    "temperature": {
      "value": 2.4,
      "alert_type": null,
      "alert_message": null
    },
    "alert": {
      "name": "door",
      "type": "open",
      "value": true,
      "message": "open door alert"
    },
    "providerName": "<provider>"
  }
]
```

La URL exacta de ingestión y todos los campos se congelarán en la etapa
correspondiente.

------------------------------------------------------------------------

# 15. Errors

Existe una sección pública específica de errores.

La referencia final debe extraer y documentar:

-   status HTTP;
-   schema de error;
-   significado;
-   causas;
-   estrategia segura de manejo;
-   cuáles errores son retryable si SimpliRoute lo declara;
-   diferencias entre errores de autenticación, validación, recursos y
    optimización.

No se inventarán códigos que la fuente pública no confirme.

------------------------------------------------------------------------

# 16. Datamart

Área pública encontrada:

-   funcionamiento de paginación;
-   datasets disponibles;
-   filtros;
-   ordenamiento.

Datamart será tratado como superficie de API independiente porque una IA
puede necesitar consultar datos analíticos/operativos y no debe
descubrir esta funcionalidad por fuera del repositorio.

------------------------------------------------------------------------

# 17. Couriers / Providers

Área pública encontrada:

-   objetivo;
-   seguridad y requisitos;
-   crear courier;
-   listar couriers;
-   retrieve;
-   actualizar;
-   eliminar;
-   validaciones de campos;
-   creación y asignación de visitas a courier.

Debe documentarse completa.

------------------------------------------------------------------------

# 18. Changelog

La documentación pública posee changelog.

En las etapas posteriores se utilizará para:

-   detectar endpoints nuevos;
-   identificar cambios de contrato;
-   detectar deprecaciones;
-   marcar comportamientos históricos;
-   evitar mezclar versiones antiguas con actuales.

------------------------------------------------------------------------

# 19. Inventario de dominios

    \# Dominio                        Público   Incluir  Estado
  ---- ----------------------------- --------- --------- -------------
     1 Authentication                   Sí        Sí     Descubierto
     2 Visits                           Sí        Sí     Descubierto
     3 Plans                            Sí        Sí     Descubierto
     4 Routes                           Sí        Sí     Descubierto
     5 Route Properties                 Sí        Sí     Descubierto
     6 Vehicles                         Sí        Sí     Descubierto
     7 Clients                          Sí        Sí     Descubierto
     8 Users / Drivers                  Sí        Sí     Descubierto
     9 Skills                           Sí        Sí     Descubierto
    10 Zones                            Sí        Sí     Descubierto
    11 Fleets                           Sí        Sí     Descubierto
    12 Webhooks                         Sí        Sí     Descubierto
    13 Optimization                     Sí        Sí     Descubierto
    14 Off-Route Reasons                Sí        Sí     Descubierto
    15 Optimization Metadata            Sí        Sí     Descubierto
    16 Invoices / Accounting            Sí        Sí     Descubierto
    17 Checkout Process                 Sí        Sí     Descubierto
    18 TMS Transportation Provider      Sí        Sí     Descubierto
    19 TMS Documents                    Sí        Sí     Descubierto
    20 TMS Vehicle Block/Unblock        Sí        Sí     Descubierto
    21 GPS Integration                  Sí        Sí     Descubierto
    22 Errors                           Sí        Sí     Descubierto
    23 Datamart                         Sí        Sí     Descubierto
    24 Couriers / Providers             Sí        Sí     Descubierto
    25 Changelog                        Sí        Sí     Descubierto

**Conclusión de discovery:** el alcance público es considerablemente
mayor que visitas + rutas + vehículos. La documentación final debe
cubrir las 25 áreas anteriores.

------------------------------------------------------------------------

# 20. Estrategia definitiva de archivos

En lugar de forzar todo en un único archivo gigantesco, la documentación
final se dividirá por contratos coherentes.

Propuesta posterior a esta auditoría:

``` text
simpliroute-api/
├── 00-auditoria-inventario.md
├── 01-fundamentos-auth-seguridad.md
├── 02-visits-items-checkout.md
├── 03-plans-routes-route-properties.md
├── 04-vehicles-users-skills-zones-fleets.md
├── 05-clients-custom-properties.md
├── 06-optimization-complete-reference.md
├── 07-webhooks-events.md
├── 08-accounting-invoices-products.md
├── 09-tms-providers-documents-vehicles.md
├── 10-gps-integration.md
├── 11-datamart.md
├── 12-couriers-providers.md
├── 13-errors-http-behavior.md
├── 14-endpoint-master-reference.md
└── 15-ai-integration-cookbook.md
```

La cantidad puede crecer si un módulo necesita separarse para conservar
precisión y facilidad de recuperación por IA.

------------------------------------------------------------------------

# 21. Contrato mínimo obligatorio por endpoint

Cada endpoint de la referencia final debe contener, cuando la fuente lo
permita:

``` text
Nombre
Estado de verificación
Fuente oficial
Fecha de verificación
Método HTTP
URL completa
Path
Versión
Propósito
Autenticación
Headers
Path params
Query params
Request body
Content-Type
Campos del request
Tipo de cada campo
Required / Optional
Nullable
Enums
Formato
Restricciones
Relaciones con otras entidades
Ejemplo cURL
Ejemplo JSON
Response de éxito
Campos del response
Tipos
Códigos HTTP documentados
Errores documentados
Efectos secundarios
Idempotencia (si está documentada)
Paginación (si aplica)
Filtros (si aplica)
Ordenamiento (si aplica)
Rate limits (si están documentados)
Reintentos (si están documentados)
Notas de seguridad
Edge cases
Ambigüedades oficiales
Reglas para IA
```

------------------------------------------------------------------------

# 22. Checklist global de completitud

El proyecto no debe considerarse finalizado hasta verificar:

-   [ ] todas las secciones de la documentación pública;
-   [ ] todos los métodos HTTP publicados;
-   [ ] todas las URLs publicadas;
-   [ ] todos los query/path params;
-   [ ] todos los payloads;
-   [ ] todos los campos de request;
-   [ ] todos los campos de response;
-   [ ] tipos;
-   [ ] obligatoriedad;
-   [ ] nullability cuando sea conocida;
-   [ ] enums;
-   [ ] IDs y relaciones;
-   [ ] autenticación;
-   [ ] seguridad;
-   [ ] errores;
-   [ ] paginación;
-   [ ] filtros;
-   [ ] ordenamiento;
-   [ ] webhooks;
-   [ ] retries;
-   [ ] optimización;
-   [ ] GPS;
-   [ ] TMS;
-   [ ] Datamart;
-   [ ] Couriers;
-   [ ] Accounting;
-   [ ] checkout;
-   [ ] ejemplos oficiales relevantes;
-   [ ] changelog;
-   [ ] contradicciones o documentación ambigua;
-   [ ] endpoint master index;
-   [ ] cookbook para IA.

------------------------------------------------------------------------

# 23. Fuente oficial de esta etapa

Fuente primaria consultada:

-   SimpliRoute API Reference: https://documentation.simpliroute.com/

La documentación oficial declara la API base:

``` text
https://api.simpliroute.com
```

Esta Etapa 0 se basa en el índice y contenido público de la referencia
oficial disponible al **2026-08-10**.

------------------------------------------------------------------------

# 24. Resultado de la Etapa 0

**Etapa 0 aprobada para continuar.**

Se confirmó que el proyecto debe cubrir una superficie bastante más
amplia que una integración básica de entregas.

La siguiente etapa debe comenzar por:

**`01-fundamentos-auth-seguridad.md`**

y documentar de forma exhaustiva el contrato transversal antes de entrar
a los recursos individuales.
