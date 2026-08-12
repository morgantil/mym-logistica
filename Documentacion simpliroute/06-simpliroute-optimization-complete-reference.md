# SimpliRoute Public API — Etapa 6: Optimization — Referencia Completa

**Estado:** COMPLETADO  
**Fecha de verificación:** 2026-08-10  
**Fuente primaria oficial:** https://documentation.simpliroute.com/  
**Alcance:** Route Optimization API, variantes y cálculo de ETA

---

# 1. Objetivo

Este documento consolida la documentación pública oficial de SimpliRoute relativa a optimización de rutas:

- endpoint VRP principal;
- Optimization Instance;
- vehículos de optimización;
- deliveries/nodes;
- opciones globales;
- respuesta de optimización;
- múltiples depósitos;
- Backhaul;
- Stop Routing / Visit Joiner;
- Pick-up and Delivery;
- Rest Time;
- Incremental Routing;
- Long Routes;
- Radial Routing;
- Estimated Time Calculation (ETC);
- validación de incompatibilidades;
- códigos de incompatibilidad;
- ambigüedades e inconsistencias de la documentación.

El objetivo es que una IA pueda construir payloads de optimización usando este archivo sin tener que descubrir nuevamente el contrato.

---

# 2. Convenciones de confiabilidad

| Etiqueta | Significado |
|---|---|
| `OFFICIAL` | Declarado explícitamente por SimpliRoute. |
| `OFFICIAL_EXAMPLE` | Aparece en un ejemplo oficial. |
| `INFERRED` | Deducción técnica útil; no garantía contractual. |
| `NOT_DOCUMENTED` | No definido públicamente. |
| `NEEDS_VERIFICATION` | Inconsistencia o ambigüedad oficial. |

---

# 3. API de Optimization ≠ API REST principal

La documentación de optimización publica hosts específicos del optimizador.

## VRP principal

```http
POST http://optimizer.simpliroute.com/vrp/optimize/sync
```

**Estado:** `OFFICIAL` tal como está escrito en la documentación.

## Pick-up and Delivery

```http
POST https://optimizer.simpliroute.com/pd/optimize/sync/
```

## Estimated Time Calculation

```http
POST https://optimizator.simpliroute.com/etc/sync
```

### Importante

La documentación pública usa tres variantes:

```text
http://optimizer.simpliroute.com/vrp/optimize/sync
https://optimizer.simpliroute.com/pd/optimize/sync/
https://optimizator.simpliroute.com/etc/sync
```

El host `optimizator` del endpoint ETC difiere de `optimizer`.

Estado:

```text
NEEDS_VERIFICATION
```

---

# 4. Seguridad / HTTPS del VRP principal

El endpoint VRP está publicado como:

```text
http://optimizer.simpliroute.com/vrp/optimize/sync
```

mientras otras superficies modernas utilizan HTTPS.

Esto es una inconsistencia de seguridad/documentación.

### Regla IA

Una IA MUST NOT modificar silenciosamente el endpoint oficial.

Debe registrar:

```text
VRP documented URL = http://optimizer.simpliroute.com/vrp/optimize/sync
HTTPS support       = NEEDS_VERIFICATION
```

Antes de una integración productiva se debe validar si:

```text
https://optimizer.simpliroute.com/vrp/optimize/sync
```

es aceptado actualmente.

---

# 5. Autenticación del optimizer

**Estado:** `NOT_DOCUMENTED` en las secciones públicas de Optimization revisadas.

La documentación de Optimization no muestra en este bloque:

```http
Authorization: Token ...
```

ni otro header de autenticación para los endpoints del optimizer.

### Regla crítica

MUST NOT extrapolar automáticamente el header de la API principal.

Configurar autenticación del optimizer como:

```text
UNKNOWN / NEEDS_RUNTIME_VERIFICATION
```

hasta disponer de confirmación oficial específica o credenciales entregadas por SimpliRoute.

---

# 6. Qué restricciones considera el optimizador

SimpliRoute declara que considera, entre otras:

- capacidades de vehículos;
- distintos puntos de inicio y fin;
- turnos de conductores/vehículos;
- ventanas horarias de clientes;
- otras restricciones descritas en este documento.

---

# 7. Estructura general de un problema VRP

La documentación divide el input en:

```text
vehicles
nodes
optimization options
```

Modelo conceptual:

```json
{
  "vehicles": [],
  "nodes": [],
  "country": "...",
  "...options": "..."
}
```

---

# 8. Inconsistencia root Object vs Array

El ejemplo inicial `Optimization Instance` muestra:

```json
[
  {
    "vehicles": [],
    "nodes": []
  }
]
```

pero la documentación declara:

```text
Our API receives JSON object as input
```

y el ejemplo básico posterior usa:

```json
{
  "vehicles": [],
  "nodes": []
}
```

Estado:

```text
NEEDS_VERIFICATION
```

### Regla recomendada

Preferir el root **Object** en implementaciones nuevas porque:

1. el texto lo declara explícitamente;
2. los ejemplos de casos de uso posteriores usan object;
3. Pick-up and Delivery también usa object.

No obstante, registrar que el primer ejemplo histórico muestra array.

---

# 9. Vehicle Object — Optimization

Ejemplo:

```json
{
  "ident": "Vehicle 1",
  "location_start": {
    "ident": "warehouse B",
    "lat": -33.4233926,
    "lon": -70.6104996
  },
  "location_end": {
    "ident": "warehouse C",
    "lat": -33.345523,
    "lon": -70.456992
  },
  "capacity": 3500,
  "capacity_2": 3500,
  "capacity_3": 3500,
  "shift_start": "09:00",
  "shift_end": "18:00",
  "refill": 30,
  "skills": ["47076", "47054"],
  "zones": [14730],
  "max_tour_duration": 40,
  "cost": 100,
  "min_load": 0,
  "min_load_2": 0,
  "min_load_3": 0,
  "max_visit": 35,
  "max_number_of_routes": 2
}
```

---

# 10. Vehicle fields — tabla oficial

| Campo | Required | Tipo | Descripción |
|---|:---:|---|---|
| `ident` | Sí | String | Identificador único. |
| `location_start` | Sí | Object | Ubicación del vehículo al iniciar optimización. |
| `location_end` | No | Object | Ubicación donde debe terminar. |
| `capacity` | No | Float | Capacidad principal. |
| `capacity_2` | No | Float | Segunda capacidad. |
| `capacity_3` | No | Float | Tercera capacidad. |
| `shift_start` | No | String | Inicio de turno `"HH:mm"`. |
| `shift_end` | No | String | Fin de turno `"HH:mm"`. |
| `skills` | No | String array | Skills soportadas por el vehículo. |
| `refill` | No | Integer | Minutos para recargar al volver a depósito antes de nueva ruta. |
| `zones` | No | Integer array | IDs de zonas del vehículo. |
| `max_tour_duration` | No | Integer | Máximo de minutos permitido para todas sus rutas. |
| `min_load` | No | Integer | Porcentaje mínimo de capacidad principal para salir. |
| `min_load_2` | No | Integer | Porcentaje mínimo sobre `capacity_2`. |
| `min_load_3` | No | Integer | Porcentaje mínimo sobre `capacity_3`. |
| `max_visit` | No | Integer | Máximo de visitas de las rutas realizadas por el vehículo. |
| `max_number_of_routes` | No | Integer | Máximo de rutas; `0` o `null` = infinito. |
| `open_start` | No | Boolean | Permite comenzar fuera del depósito. Default `false`. |
| `open_end` | No | Boolean | Permite terminar fuera del depósito. Default `false`; `open_ended` lo sobreescribe. |

---

# 11. `cost` en Vehicle

El ejemplo oficial incluye:

```json
{
  "cost": 100
}
```

pero la tabla formal de atributos no describe `cost`.

Estado:

```text
OFFICIAL_EXAMPLE
```

No asumir:

- unidad;
- moneda;
- efecto exacto;
- required;
- rango.

---

# 12. Location Object

Shape observado:

```json
{
  "ident": "warehouse A",
  "lat": -33.4233926,
  "lon": -70.6104996
}
```

`location_start` es obligatorio.

`location_end` es opcional.

---

# 13. Comportamiento si falta `location_end`

**Estado:** `OFFICIAL`

Si no se define `location_end`, el algoritmo asume:

```text
location_end = location_start
```

es decir, el vehículo termina donde comenzó.

---

# 14. Default de horario del Vehicle

Si no se especifican:

```text
shift_start
shift_end
```

el algoritmo asume:

```text
00:00 -> 23:59
```

del mismo día.

---

# 15. Skills de Vehicle

Vehicle:

```json
{
  "skills": ["47076", "47054"]
}
```

Delivery:

```json
{
  "skills_required": [47076],
  "skills_optional": [47054]
}
```

### Inconsistencia de tipos

Vehicle table:

```text
String array
```

Delivery:

```text
Integer array
```

Estado:

```text
NEEDS_VERIFICATION
```

Una IA debe tratar skill IDs como identificadores opacos.

---

# 16. Required skills

**Estado:** `OFFICIAL`

Para atender una Delivery con:

```text
skills_required
```

el Vehicle debe poseer **todas** las skills requeridas.

---

# 17. Optional skills

**Estado:** `OFFICIAL`

Para una Delivery con:

```text
skills_optional
```

el Vehicle debe poseer **al menos una** de ellas.

---

# 18. Zones

Vehicle:

```json
{
  "zones": [14730]
}
```

Delivery:

```json
{
  "zones": [14730]
}
```

Una Delivery con zona sólo será atendida por un Vehicle que posea esa zona.

---

# 19. Capacity dimensions

Relación:

```text
Vehicle.capacity   <-> Node.load
Vehicle.capacity_2 <-> Node.load_2
Vehicle.capacity_3 <-> Node.load_3
```

Las unidades deben coincidir.

No existe unidad física global.

---

# 20. `min_load*`

Son porcentajes mínimos de carga necesarios para que el Vehicle salga.

Ejemplo conceptual:

```text
capacity = 1000
min_load = 50
```

implica una restricción mínima del 50% de esa capacidad según descripción oficial.

No confundir `min_load=50` con 50 unidades de carga.

---

# 21. `max_number_of_routes`

Regla oficial:

```text
0 or null -> infinity
```

No interpretar `0` como “no puede tener rutas”.

---

# 22. `open_start`

Default:

```text
false
```

Cuando `true`, permite comenzar rutas en lugares distintos al depósito.

---

# 23. `open_end`

Default:

```text
false
```

Cuando `true`, permite terminar fuera del depósito.

Si la opción global:

```text
open_ended = true
```

entonces ésta sobreescribe `open_end`.

---

# 24. Delivery / Node Object

Una Delivery representa una tarea:

- entrega;
- oportunidad de venta;
- servicio en terreno;
- etc.

Input:

```text
nodes[]
```

---

# 25. Node fields — tabla oficial

| Campo | Required | Tipo | Descripción |
|---|:---:|---|---|
| `ident` | Sí | String | Identificador único. |
| `lat` | Sí | Float | Latitud. |
| `lon` | Sí | Float | Longitud. |
| `address` | No | String | Dirección. Si hay lat/lon, éstos tienen prioridad. |
| `group_id` | No | String | Vinculación usada por `join_v2`. |
| `load` | No | Float | Carga principal. |
| `load_2` | No | Float | Segunda carga. |
| `load_3` | No | Float | Tercera carga. |
| `window_start` | No | String | `"HH:mm"`. |
| `window_end` | No | String | `"HH:mm"`. |
| `window_start_2` | No | String | Segunda ventana, inicio. |
| `window_end_2` | No | String | Segunda ventana, fin. |
| `duration` | No | Integer | Minutos de servicio. |
| `skills_required` | No | Integer array | Todas deben coincidir. |
| `skills_optional` | No | Integer array | Al menos una debe coincidir. |
| `priority_level` | No | Integer | Prioridad 1..5. |
| `zones` | No | Integer array | Zona(s) requerida(s). |

---

# 26. Address vs coordinates

Regla oficial:

```text
if lat and lon exist -> coordinates are privileged over address
```

Como `lat` y `lon` figuran mandatory en la tabla, el `address` no sustituye formalmente a las coordenadas en ese contrato.

---

# 27. Service time

Si `duration` no se especifica:

```text
duration = 0 minutes
```

`duration` debe ser Integer en minutos.

Ejemplo:

```json
{
  "duration": 5
}
```

NO:

```text
"00:05:00"
```

para el Optimization Node estándar.

---

# 28. Priority Level

Valores oficiales:

| Valor | Semántica |
|---:|---|
| `1` | First of the day |
| `2` | Last of its route |
| `3` | High Priority |
| `4` | Medium Priority |
| `5` | Low Priority |

Algunos ejemplos de Pick-up/Delivery usan:

```text
priority_level = 0
```

aunque la tabla sólo documenta 1..5.

Estado:

```text
NEEDS_VERIFICATION
```

No usar `0` como valor contractual general sin validar el modo específico.

---

# 29. Error del ejemplo Delivery

El ejemplo oficial incluye dos veces:

```json
"load_2": ...
```

donde por estructura probablemente uno corresponde a `load_3`.

Estado:

```text
OFFICIAL_EXAMPLE malformed
```

Una IA MUST usar los nombres de la tabla:

```text
load
load_2
load_3
```

y no reproducir duplicate JSON keys.

---

# 30. Optimization Options

La documentación publica las siguientes opciones.

| Campo | Required | Tipo | Default | Descripción |
|---|:---:|---|---|---|
| `country` | Sí | String | — | Código ISO de país. |
| `balance` | No | Boolean | `false` | Fuerza balance entre vehículos por tiempo y número de ubicaciones. |
| `fmv` | No | Float | `2.0` | Factor de tráfico. |
| `all_vehicles` | No | Boolean | `false` | Si `true`, usa todos; si `false`, minimiza cantidad. |
| `open_ended` | No | Boolean | `false` | No exige retorno a depósito al final. |
| `single_tour` | No | Boolean | `false` | Un solo tour/ruta por vehículo. |
| `join_v2` | No | Boolean | `false` | Une visitas según agrupación y capacidad. |
| `beauty` | No | Boolean | `false` | Agrupa visitas en clusters y crea rutas dentro de clusters. |
| `fmb` | No | Integer | `5` | Factor de clustering. |
| `use_euclidean_distance` | No | Boolean | `false` | Usa distancia en línea recta. |
| `autoZone` | No | Boolean | `false` | Asigna vehículos que sirven las zonas especificadas. |
| `intensive_intra` | No | Boolean | `false` | Búsqueda más intensiva; puede aumentar tiempo de respuesta. |
| `open_routes_logic` | No | Boolean | `false` | Lógica de open route descrita de forma particular. |
| `vehicle_capacities_increment` | No | Integer | `0` | % aumento de capacidad de todos los vehículos. |
| `vehicle_journey_extention` | No | Integer | `0` | % aumento de ventana/tiempo de viaje de vehículos. |
| `enable_soft_window` | No | Boolean | `false` | Puede violar ventanas buscando minimizar retraso total. |
| `isReorder` | No | Boolean | `false` | Primero intenta insertar con primera ventana; si no, reintenta ignorando ventanas. |
| `radial_routing` | No | Integer | `0` | `1`, `-1` o `0`. |

---

# 31. Inconsistencia `country` mandatory

La tabla declara:

```text
country = Mandatory
```

pero el ejemplo básico oficial:

```json
{
  "vehicles": [...],
  "nodes": [...]
}
```

lo omite.

Estado:

```text
NEEDS_VERIFICATION
```

### Regla segura

Una implementación nueva SHOULD enviar `country` con el código ISO correcto, porque la tabla formal lo marca obligatorio.

---

# 32. `fmv` — Traffic factor

Valores documentados:

```text
1.0 = Low Traffic
1.5 = Medium Traffic
2.0 = High Traffic
3.0 = Intense Traffic
```

Default:

```text
2.0
```

No se documentan otros valores.

---

# 33. `fmb` — Clustering

Valores descritos:

```text
1 = Zero Clustering
2 = Low Clustering
3 = Medium Clustering
4 = High Clustering
5 = Intense Clustering
```

Default:

```text
5
```

La tabla dice Integer aunque la descripción los escribe como `1.0..5.0`.

Preferir Integer.

---

# 34. `balance`

Cuando:

```json
{
  "balance": true
}
```

el algoritmo fuerza mayor balance entre vehículos considerando tiempo y número de ubicaciones.

No se documenta la función objetivo exacta.

---

# 35. `all_vehicles`

```text
false -> minimiza cantidad de vehículos
true  -> utiliza todos los seleccionados
```

---

# 36. `open_ended`

Cuando `true`:

```text
vehicle does not need to return to depot at end
```

Además sobreescribe `vehicle.open_end`.

---

# 37. `single_tour`

Cuando `true`:

```text
one route/tour per vehicle
```

Es especialmente relevante para Radial Routing.

---

# 38. `join_v2`

Une visitas asociadas mediante:

```text
group_id
```

La descripción también habla de visitas con misma dirección y respeto de capacidad.

No confundir con el módulo moderno `visit_joiner` / Stop Routing.

---

# 39. `beauty`

Agrupa visitas en clusters y genera rutas dentro de ellos.

No existe contrato matemático del clustering.

---

# 40. `use_euclidean_distance`

Cuando `true`, la distancia entre ubicaciones es la línea directa.

Esto puede diferir de tiempo/distancia por red vial.

---

# 41. `autoZone`

Cuando `true`, el algoritmo asigna vehículos que atienden cada zona indicada en las visitas.

Interacción exacta con `vehicle.zones` y `node.zones` no está descrita matemáticamente.

---

# 42. `intensive_intra`

Búsqueda más intensiva.

La documentación advierte:

```text
response time may increase
```

No existe SLA.

---

# 43. `open_routes_logic`

Descripción oficial:

```text
route is created assuming vehicle will not return to depot, BUT it does
```

Esta semántica es ambigua.

Estado:

```text
NEEDS_VERIFICATION
```

No equiparar automáticamente con `open_ended`.

---

# 44. `vehicle_capacities_increment`

Integer en porcentaje.

Default `0`.

Ejemplo conceptual:

```text
10 -> increase all vehicle capacities by 10%
```

según descripción.

---

# 45. `vehicle_journey_extention`

Campo escrito oficialmente:

```text
vehicle_journey_extention
```

con esa ortografía.

No “corregir” a `extension` en el payload.

Representa porcentaje de aumento en ventana/tiempo permitido para los vehículos.

---

# 46. `enable_soft_window`

Cuando `true`, permite incumplir time windows intentando minimizar retraso total.

Esto convierte ventanas estrictas en restricciones blandas según descripción.

---

# 47. `isReorder`

Flujo documentado:

```text
1. intenta insertar todos los nodos usando primera ventana;
2. si no es posible;
3. reintenta ignorando restricciones de ventana.
```

No confundir con simple reordenamiento de array.

---

# 48. `radial_routing`

Enum estricto:

```text
1
0
-1
```

Otros valores:

```text
not accepted
```

Semántica:

```text
 1 -> comienza cerca del depósito y termina lejos
-1 -> comienza lejos y termina cerca
 0 -> disabled
```

---

# 49. Basic Optimization Input

Ejemplo mínimo moderno:

```json
{
  "country": "CL",
  "vehicles": [
    {
      "ident": "Vehicle 1",
      "location_start": {
        "ident": "depot_1_start",
        "lat": -33.4233926,
        "lon": -70.6104996
      }
    }
  ],
  "nodes": [
    {
      "ident": "1",
      "lat": -33.436135,
      "lon": -70.6509688
    },
    {
      "ident": "2",
      "lat": -33.4334123,
      "lon": -70.653234
    }
  ]
}
```

`country` se agregó aquí por la tabla formal aunque el ejemplo histórico lo omite.

---

# 50. Optimization Response

Top-level publicado:

```json
{
  "vehicles": [
    {
      "ident": "Vehicle 1",
      "tours": [
        {
          "nodes": []
        }
      ]
    }
  ],
  "num_vehicles_used": 1,
  "filteredClientsNodes": [],
  "unattendedClientsNodes": []
}
```

---

# 51. Response sections

SimpliRoute define:

- `vehicles`: vehículos del input;
- `tours`: tours/rutas de cada vehículo;
- `nodes`: deliveries incluidas;
- `num_vehicles_used`: cantidad de vehículos utilizados;
- `filteredClientsNodes`: nodos removidos antes de optimizar por incompatibilidad;
- `unattendedClientsNodes`: nodos que no fueron filtrados pero no pudieron incluirse en ninguna ruta.

---

# 52. Node response fields agregados

| Campo | Tipo | Descripción |
|---|---|---|
| `arrival` | String | Hora de llegada `"HH:mm:ss"`. |
| `departure` | String | Hora de salida `"HH:mm:ss"`. |
| `order` | Integer | Orden de visita. |

El response puede preservar además campos del input.

---

# 53. Depot nodes en response

El depósito aparece como node del tour.

Ejemplo:

```json
{
  "ident": "depot_1_start",
  "order": 0
}
```

y puede volver a aparecer al final.

No contar automáticamente todos los nodes del tour como entregas reales.

---

# 54. Multiple Depots

Cada Vehicle puede definir:

```text
location_start
location_end
```

diferentes.

Esto permite:

- distintos depósitos por vehículo;
- inicio y fin en distintas ciudades/ubicaciones.

No existe un objeto global `depots[]`; los depósitos se representan mediante locations de vehículos.

---

# 55. Backhaul Optimization

**Endpoint:** mismo VRP regular.

```http
POST http://optimizer.simpliroute.com/vrp/optimize/sync
```

Backhaul permite:

- delivery;
- pickup;
- pickup + delivery en el mismo cliente.

No confundir con Pick-up and Delivery Problem (PD), que tiene endpoint distinto.

---

# 56. Backhaul fields

| Campo | Required | Tipo | Descripción |
|---|:---:|---|---|
| `load` | No | Float | Carga entregada. |
| `load_2` | No | Float | Segunda carga entregada. |
| `load_3` | No | Float | Tercera carga entregada. |
| `pickload` | No | Float | Carga recogida. |
| `pickload_2` | No | Float | Segunda carga recogida. |
| `pickload_3` | No | Float | Tercera carga recogida. |

Las unidades deben coincidir con capacidades equivalentes del Vehicle.

---

# 57. Backhaul capacity

El algoritmo revisa capacidad **en cada stop**, ya que la carga cambia a medida que:

```text
deliveries decrease onboard load
pickups increase onboard load
```

---

# 58. Stop Routing / Visit Joiner

Se agrega un objeto:

```text
visit_joiner
```

al request.

La documentación indica que puede utilizarse con endpoints:

```text
vrp
big-vrp
```

La URL exacta de `big-vrp`:

```text
NOT_DOCUMENTED en esta sección
```

---

# 59. `visit_joiner`

```json
{
  "visit_joiner": {
    "enable_visit_join": true,
    "maximum_distance": 0.5,
    "match_skills": true,
    "match_zones": true,
    "match_time_windows": true
  }
}
```

---

# 60. Visit Joiner fields

| Campo | Tipo | Descripción |
|---|---|---|
| `enable_visit_join` | Boolean | Habilita Stop Routing. |
| `maximum_distance` | Number | Distancia máxima en **kilómetros**. `0` = mismo punto exacto. |
| `match_skills` | Boolean | Exige mismas required skills para agrupar. |
| `match_zones` | Boolean | Exige misma zona. |
| `match_time_windows` | Boolean | Exige misma ventana. |

---

# 61. Stop Routing output semantics

Cuando se agrupan visitas:

```text
combined load = sum of individual loads
service time  = longest service time among merged visits
```

---

# 62. Stop Routing — exact location

Con:

```json
{
  "maximum_distance": 0
}
```

la agrupación se basa en:

- misma latitud;
- misma longitud;
- skills según configuración;
- ventana según configuración.

La documentación aclara que **no valida `address`**, sino coordenadas.

---

# 63. Stop Routing — capacity validation

Si la carga combinada excede capacidad del Vehicle:

```text
visits are not grouped
```

---

# 64. Stop Routing — primary window

La documentación indica que, para visitas en misma ubicación pero ventanas distintas:

```text
primary visit's time window is used
```

Esto parece coexistir con `match_time_windows`; la interacción exacta es parcialmente ambigua.

Estado:

```text
PARTIALLY_DOCUMENTED
```

---

# 65. `similars_by_priority`

La sección menciona una opción:

```text
similars_by_priority
```

y afirma que, cuando está habilitada, dos visitas con la misma prioridad no se agrupan.

Sin embargo no define este parámetro en la tabla general ni muestra cómo se envía.

Estado:

```text
OFFICIAL_MENTION / NOT_FULLY_DOCUMENTED
```

No inventar su ubicación/type/default.

---

# 66. No usar `join:true` en frontend

La documentación afirma explícitamente:

```text
Stop Routing is backend-only
do not activate join:true in frontend
```

Además, el ejemplo inicial viejo usa:

```json
"join": true
```

mientras las opciones modernas documentan `join_v2`.

Estado de `join`:

```text
LEGACY / NOT_FORMALLY_DOCUMENTED
```

---

# 67. Detectar visitas agrupadas en response

SimpliRoute indica que, si varias visitas atendidas tienen el mismo:

```text
order
```

significa que fueron agrupadas en un mismo stop.

---

# 68. Pick-up and Delivery Problem

Endpoint:

```http
POST https://optimizer.simpliroute.com/pd/optimize/sync/
```

A diferencia del VRP regular:

```text
nodes -> jobs
```

Cada Job contiene:

```text
pickNodes[]
deliveryNodes[]
```

---

# 69. Tres tipos de Job

Oficialmente:

1. sólo un pick node;
2. sólo un delivery node;
3. un pick node + un delivery node.

Para el tercer caso:

```text
pickup must happen before its paired delivery
```

---

# 70. Pick-only Job

Después del pickup, la carga permanece en el Vehicle hasta el próximo depot.

---

# 71. Delivery-only Job

La carga viene originalmente desde un depot y se descarga al visitar el delivery node.

---

# 72. Pick + Delivery Job

El Vehicle:

```text
1. visita pickNode
2. recoge carga
3. luego visita deliveryNode específico
```

Capacidad cambia dinámicamente.

---

# 73. PD Node fields

| Campo | Required | Tipo |
|---|:---:|---|
| `ident` | Sí | String |
| `lat` | Sí | Float |
| `lon` | Sí | Float |
| `address` | No | String |
| `load` | No | Float |
| `load_2` | No | Float |
| `load_3` | No | Float |
| `window_start` | No | String HH:mm |
| `window_end` | No | String HH:mm |
| `window_start_2` | No | String HH:mm |
| `window_end_2` | No | String HH:mm |
| `duration` | No | Integer minutos |
| `skills_required` | No | Integer array |
| `skills_optional` | No | Integer array |
| `priority_level` | No | Integer |

---

# 74. Error de naming en ejemplo PD

Un ejemplo de `deliveryNodes` usa:

```json
{
  "load2": 1,
  "load3": 1
}
```

mientras la tabla formal usa:

```text
load_2
load_3
```

Estado:

```text
NEEDS_VERIFICATION
```

Preferir los nombres de la tabla formal:

```text
load_2
load_3
```

---

# 75. Rest Time

Usa el mismo endpoint VRP regular.

Debe activarse globalmente:

```json
{
  "enable_rest_time": true
}
```

y los vehículos que necesiten descanso deben contener sus parámetros.

---

# 76. Rest Time fields

| Campo | Required para vehículo con descanso | Tipo | Regla |
|---|:---:|---|---|
| `rest_time_start` | Sí | String HH:mm | Debe ser menor que `shift_end`. |
| `rest_time_end` | Sí | String HH:mm | Debe ser mayor que `shift_start`. |
| `rest_time_duration` | Sí | Integer | Minutos; <= tamaño de ventana de descanso. |
| `enable_rest_time` | No/global | Boolean | Default `false`. |

---

# 77. Scope de Rest Time

Sólo los Vehicles que contienen parámetros de descanso son considerados con break.

La feature representa:

```text
one pause in the vehicle route
```

según documentación.

---

# 78. Incremental Routing

Usa endpoint VRP regular.

Global:

```json
{
  "incremental_routing": true
}
```

Vehicle puede contener:

```text
partial_tour
```

---

# 79. Partial Tour

```json
{
  "partial_tour": {
    "ident": "7247",
    "partial_routes": [
      {
        "nodes": ["node-a", "node-b", "node-c"],
        "fixed_nodes_number": 2
      }
    ]
  }
}
```

`partial_tour.ident` debe coincidir con `vehicle.ident`.

Si no se desea partial route:

```json
{
  "partial_tour": null
}
```

---

# 80. Partial Route fields

| Campo | Required | Tipo | Descripción |
|---|:---:|---|---|
| `nodes` | Sí | String array | `ident` de nodes ya pertenecientes a esa ruta. |
| `fixed_nodes_number` | Sí | Integer | Primeros N nodes fijos en vehículo y posición. |

---

# 81. `fixed_nodes_number`

Semántica exacta:

```text
0:
  nodes pueden cambiar de posición
  pero no de vehículo

N == len(nodes):
  ruta queda completamente fija

0 < N < len(nodes):
  primeros N permanecen fijos en vehículo y posición
```

---

# 82. Requisito crítico de Incremental Routing

Todos los nodes:

- pertenecientes a partial routes;
- nuevos a insertar;

deben estar incluidos en:

```text
nodes[]
```

del problema completo.

No enviar sólo los nuevos.

---

# 83. Long Routes

Usa el mismo endpoint VRP regular.

Activación:

```json
{
  "longRoutes": true
}
```

Obsérvese camelCase exacto.

---

# 84. Long Routes — horizonte

Permite tiempos superiores a 24 horas.

Ejemplo:

```text
22:00 -> 31:00
```

donde `31:00` representa 07:00 del día siguiente.

---

# 85. `arrayOfTimeWindows`

Node de Long Routes:

```json
{
  "arrayOfTimeWindows": [
    ["25:00", "28:00"],
    ["30:00", "31:00"]
  ]
}
```

Formato interno:

```text
array of [start, end]
```

con strings `"HH:mm"` que pueden superar 24.

---

# 86. Limitaciones Long Routes

**Estado:** `OFFICIAL`

La feature soporta:

```text
horizon <= 7 days
vehicles <= 10
nodes per vehicle <= 40
```

La frase oficial es:

```text
no more than 7 days, no more than 10 vehicles and/or 40 nodes per vehicle
```

Una IA SHOULD respetar estos máximos.

---

# 87. Long Routes y time windows

La documentación afirma que cuando `longRoutes=true`:

```text
time windows must be sent in visits
```

y el campo especial es `arrayOfTimeWindows`.

No usar sólo `window_start/window_end` como garantía de Long Routes.

---

# 88. Radial Routing

Global:

```json
{
  "radial_routing": 1
}
```

o:

```json
{
  "radial_routing": -1
}
```

---

# 89. Radial Routing proximity

La cercanía/lejanía se mide por:

```text
travel time
```

NO por distancia física.

---

# 90. Condiciones para Radial Routing

Para usarlo, además de `radial_routing = 1|-1`, la documentación indica que debe cumplirse una o más:

```text
beauty = true
min_load > 0
more than 800 nodes
```

---

# 91. Radial + single_tour

El efecto está especialmente diseñado/se nota más con:

```json
{
  "single_tour": true
}
```

No aparece como requisito absoluto, sino recomendación/contexto.

---

# 92. Estimated Time Calculation (ETC)

Endpoint publicado:

```http
POST https://optimizator.simpliroute.com/etc/sync
```

Objetivo:

```text
recalcular ETA/ETD de una ruta ya ordenada
```

No realiza VRP ni TSP.

---

# 93. ETC input

```json
{
  "vehicle": {
    "vehicle_id": "Vehicle 1",
    "lat": -33.45754,
    "lon": -70.92697,
    "departure_time": "09:00"
  },
  "tours": [
    {
      "nodes": [
        {
          "id": "id1",
          "lat": -33.45754,
          "lon": -70.62697,
          "service_time": 30.0,
          "order": 0
        }
      ]
    }
  ],
  "fmv": 2.0
}
```

---

# 94. ETC Vehicle fields

| Campo | Required | Tipo |
|---|:---:|---|
| `vehicle_id` | Sí | String |
| `lat` | Sí | Double |
| `lon` | Sí | Double |
| `departure_time` | Sí | Time `"HH:mm"` |

---

# 95. ETC Node fields

| Campo | Required | Tipo | Descripción |
|---|:---:|---|---|
| `id` | Sí | String | Visit ID. |
| `lat` | Sí | Double | Latitud. |
| `lon` | Sí | Double | Longitud. |
| `service_time` | Sí | Double | Minutos de servicio. |
| `order` | Sí | Integer | Orden fijo. |

---

# 96. ETC constraints

Oficialmente:

```text
one vehicle per request
one tour per request
one route per tour
```

Si se envía más de una route por tour:

```text
responds with error
```

Código/status exacto:

```text
NOT_DOCUMENTED
```

---

# 97. ETC does not reorder

El ETC:

```text
maintains provided order
does not compute VRP
does not compute TSP
```

Es exclusivamente cálculo/re-cálculo temporal.

---

# 98. ETC traffic

`fmv` opcional.

La tabla del ETC dice Integer, pero default/valores incluyen:

```text
1.5
2.0
3.0
```

Estado:

```text
NEEDS_VERIFICATION type
```

Debe modelarse prácticamente como Number/Float.

---

# 99. ETC Response

Agrega:

```text
arrival
departure
```

por node.

Ejemplo:

```json
{
  "id": "id1",
  "order": 0,
  "arrival": "09:48",
  "departure": "10:18"
}
```

---

# 100. Validate Incompatibilities

**Estado:** `OFFICIAL`

Antes de resolver VRP, el optimizador compara cada Visit contra Vehicles por:

- required skills;
- optional skills;
- loads;
- time windows;
- zones.

Sólo aplica a problemas VRP.

---

# 101. Filtered nodes

Si una Visit no es compatible:

```text
filtered out before optimization
```

y aparece en:

```text
filteredClientsNodes
```

No se considera en el proceso de optimización.

---

# 102. Incompatibility response

Shape:

```json
{
  "filteredClientsNodes": [
    {
      "ident": "Visit",
      "cause": {
        "description": "No vehicles matching: required skills, optional skills, time windows, zone, load",
        "codes": ["W02002", "W02102"],
        "details": [
          {
            "code": "W02002",
            "category": "required skills",
            "description": "None Vehicles has the required skills for this visit.",
            "count": 3
          }
        ]
      }
    }
  ]
}
```

---

# 103. Cause details

`count` indica:

```text
cantidad de Vehicles incompatibles en esa categoría
```

Las causas se ordenan descendente por número de vehículos incompatibles.

---

# 104. Código format

Estructura:

```text
<Initial Letter><Problem Category><Specific Number>
```

Inicial publicada:

```text
W = warning/alert related to a poorly created visit
```

---

# 105. Primary incompatibility codes

| Código | Significado |
|---|---|
| `W00001` | Undefined |
| `W01002` | Ningún Vehicle tiene capacidad requerida. |
| `W02002` | Ningún Vehicle tiene required skills. |
| `W02102` | Ningún Vehicle tiene optional skill. |
| `W03002` | Ventana está fuera de horario de todos los Vehicles. |
| `W04002` | Ningún Vehicle está asignado a la zona. |

---

# 106. Secondary incompatibility codes

| Código | Significado |
|---|---|
| `W01001` | Algunos Vehicles no tienen capacidad requerida. |
| `W02001` | Algunos Vehicles no tienen required skills. |
| `W02101` | Algunos Vehicles no tienen optional skill. |
| `W03001` | Ventana está fuera de horario de algunos Vehicles. |
| `W04001` | Algún Vehicle no está asignado a la zona. |

---

# 107. Filtered vs Unattended

Distinción crítica:

```text
filteredClientsNodes
  -> excluidos ANTES de optimización por incompatibilidad

unattendedClientsNodes
  -> no fueron filtrados, pero el algoritmo no pudo incluirlos en una ruta
```

Una IA MUST manejar ambas listas por separado.

---

# 108. Off-route causes

SimpliRoute tiene una sección separada de:

```text
Off-Route Reasons
```

para explicar `unattendedClientsNodes`.

No se duplica completamente aquí porque será parte de la siguiente etapa dedicada a resultados/códigos/metadata.

---

# 109. Optimization endpoint inventory

| Método | Endpoint | Uso |
|---|---|---|
| POST | `http://optimizer.simpliroute.com/vrp/optimize/sync` | VRP regular y variantes sobre nodes |
| POST | `https://optimizer.simpliroute.com/pd/optimize/sync/` | Pick-up and Delivery Problem |
| POST | `https://optimizator.simpliroute.com/etc/sync` | Recalcular ETA/ETD manteniendo orden |

Mencionado pero URL no documentada aquí:

```text
big-vrp
```

---

# 110. Features sobre endpoint VRP regular

Usan mismo VRP:

```text
basic optimization
multiple depots
Backhaul
Rest Time
Incremental Routing
Long Routes
Radial Routing
Stop Routing (vrp/big-vrp)
```

---

# 111. Ejemplo VRP completo recomendado

```json
{
  "country": "AR",
  "vehicles": [
    {
      "ident": "vehicle-01",
      "location_start": {
        "ident": "depot-01",
        "lat": -34.6037,
        "lon": -58.3816
      },
      "location_end": {
        "ident": "depot-01",
        "lat": -34.6037,
        "lon": -58.3816
      },
      "capacity": 100,
      "capacity_2": 20,
      "capacity_3": 0,
      "shift_start": "08:00",
      "shift_end": "18:00",
      "skills": ["10"],
      "zones": [1],
      "max_visit": 30,
      "max_number_of_routes": 1
    }
  ],
  "nodes": [
    {
      "ident": "order-1001",
      "lat": -34.61,
      "lon": -58.40,
      "load": 10,
      "window_start": "09:00",
      "window_end": "12:00",
      "duration": 10,
      "skills_required": [10],
      "zones": [1],
      "priority_level": 3
    }
  ],
  "balance": false,
  "fmv": 2.0,
  "all_vehicles": false,
  "open_ended": false,
  "single_tour": true
}
```

Los IDs y ubicaciones son ejemplos, no datos oficiales.

---

# 112. Validaciones previas recomendadas

Antes de enviar VRP:

```text
[ ] vehicle.ident único
[ ] vehicle.location_start presente
[ ] node.ident único
[ ] node.lat presente
[ ] node.lon presente
[ ] country presente
[ ] cargas usan mismas unidades Vehicle/Node
[ ] required skills pueden ser satisfechas
[ ] optional skills pueden ser satisfechas por al menos un Vehicle
[ ] zones tienen Vehicle compatible
[ ] time windows están dentro de shifts cuando son hard
[ ] min_load es porcentaje
[ ] max_number_of_routes 0/null entendido como infinito
[ ] radial_routing ∈ {-1,0,1}
[ ] duration expresado en minutos
```

---

# 113. Validaciones Rest Time

```text
rest_time_start < shift_end
rest_time_end > shift_start
rest_time_duration <= rest_time_end - rest_time_start
enable_rest_time = true
```

Los vehículos sin campos de descanso no reciben esa restricción.

---

# 114. Validaciones Incremental Routing

```text
partial_tour.ident == vehicle.ident
0 <= fixed_nodes_number <= len(partial_route.nodes)
todos partial_route.nodes existen en problem.nodes[]
todos los nuevos nodes también están en problem.nodes[]
incremental_routing = true
```

---

# 115. Validaciones Long Routes

```text
longRoutes = true
horizon <= 7 days
vehicles <= 10
nodes_per_vehicle <= 40
time windows supplied
times may exceed 24:00
```

---

# 116. Validaciones Stop Routing

```text
maximum_distance >= 0
maximum_distance unit = kilometers
combined load <= vehicle capacity
lat/lon correct
match flags according to business rule
```

---

# 117. Inconsistencias oficiales detectadas

| Tema | Inconsistencia | Estado |
|---|---|---|
| VRP scheme | `http://` mientras otras APIs usan HTTPS | `NEEDS_VERIFICATION` |
| ETC host | `optimizator` vs `optimizer` | `NEEDS_VERIFICATION` |
| Auth optimizer | no documentada en sección | `NOT_DOCUMENTED` |
| Root VRP | primer ejemplo array; texto y otros ejemplos object | `NEEDS_VERIFICATION` |
| `country` | tabla mandatory, basic example lo omite | `NEEDS_VERIFICATION` |
| Skills | Vehicle string[], Node integer[] | `NEEDS_VERIFICATION` |
| Delivery sample | duplicate `load_2` | `OFFICIAL_EXAMPLE malformed` |
| `cost` | aparece en Vehicle example, falta en tabla | `PARTIALLY_DOCUMENTED` |
| Priority | tabla 1..5, PD examples usan 0 | `NEEDS_VERIFICATION` |
| PD load fields | example usa `load2/load3`, tabla `load_2/load_3` | `NEEDS_VERIFICATION` |
| `join` | example histórico; tabla moderna usa `join_v2` | `PARTIALLY_DOCUMENTED` |
| `similars_by_priority` | mencionado sin definición | `PARTIALLY_DOCUMENTED` |
| `open_routes_logic` | descripción semánticamente ambigua | `NEEDS_VERIFICATION` |
| ETC fmv | tabla Integer, valores son decimales | `NEEDS_VERIFICATION` |
| `vehicle_journey_extention` | spelling oficial con `extention` | `OFFICIAL` |

---

# 118. Aspectos NOT_DOCUMENTED

La documentación pública revisada no define exhaustivamente:

```text
optimizer authentication
VRP HTTPS support
HTTP status success
HTTP error schemas
timeouts
rate limits
request size limits
maximum nodes standard VRP
maximum vehicles standard VRP
maximum jobs PD
exact optimization objective weights
exact balance formula
exact beauty clustering algorithm
exact autoZone algorithm
cost semantics
cost currency
big-vrp exact URL
similars_by_priority schema/default
idempotency
retry behavior
async optimization endpoint in this section
country ISO standard version
lat/lon geographic validation
numeric ranges for loads
negative load behavior
fmb behavior outside 1..5
fmv behavior outside documented values
vehicle_capacities_increment allowed range
vehicle_journey_extention allowed range
soft-window penalty formula
```

Una IA MUST tratarlos como desconocidos.

---

# 119. Reglas MUST para IA

Una IA MUST:

1. distinguir optimizer API de API REST principal;
2. usar `ident` como ID del Vehicle/Node en VRP;
3. enviar `location_start`;
4. enviar lat/lon para Nodes según tabla formal;
5. mantener unidades de capacity/load alineadas;
6. expresar `duration` en minutos;
7. usar `"HH:mm"` en ventanas estándar;
8. respetar required skills = todas;
9. respetar optional skills = al menos una;
10. separar filtered de unattended;
11. respetar `max_number_of_routes=0|null` como infinito;
12. usar endpoint PD cuando exista relación pickup→delivery;
13. usar Backhaul en VRP sólo para pickups que vuelven al depósito;
14. activar flags explícitos de Rest/Incremental/Long Routes;
15. mantener orden en ETC;
16. manejar incompatibility codes;
17. preservar nombres exactos como `longRoutes` y `vehicle_journey_extention`.

---

# 120. Reglas MUST NOT para IA

MUST NOT:

1. confundir Visit API con Node de optimizer;
2. enviar `duration` como `"HH:mm:ss"` en Node estándar;
3. asumir optimizer usa `Authorization: Token`;
4. asumir HTTPS VRP sin verificar;
5. convertir `ident` automáticamente en ID numérico;
6. asumir skills siempre integer;
7. usar `load2/load3` sólo porque aparece en un ejemplo PD;
8. confundir Backhaul con Pick-up and Delivery;
9. reordenar ETC;
10. inventar endpoint `big-vrp`;
11. inventar valor de `similars_by_priority`;
12. usar `radial_routing=2`;
13. interpretar `min_load` como unidades absolutas;
14. omitir partial-route nodes del `nodes[]` principal;
15. superar límites oficiales de Long Routes;
16. tratar `filteredClientsNodes` y `unattendedClientsNodes` como equivalentes.

---

# 121. Fuente oficial

Fuente primaria:

```text
https://documentation.simpliroute.com/
```

Secciones revisadas:

```text
Optimization
Optimization Instance
Optimization Vehicles
Deliveries
Optimization options
Example - Multiple depots
Backhaul Optimization
Stop Routing
Pick-up and Delivery
Rest Time
Incremental Routing
Long Routes
Radial Routing
Estimated Time Calculation
Validate Incompatibilities
```

Fecha:

```text
2026-08-10
```

---

# 122. Estado final

**ETAPA 6 COMPLETADA**

Cobertura:

```text
VRP Optimization
Vehicles
Nodes / Deliveries
Options
Response
Multiple Depots
Backhaul
Stop Routing
Pick-up and Delivery
Rest Time
Incremental Routing
Long Routes
Radial Routing
ETA Recalculation
Incompatibility Validation
Warning Codes
```

Siguiente etapa recomendada:

```text
07-webhooks-events-offroute-metadata.md
```

Deberá cubrir exhaustivamente:

- Webhooks config;
- Create/List/Update/Delete Webhooks;
- todos los event types;
- Plan created/edited;
- Route created/edited/started/finished;
- On its way;
- Checkout;
- Checkout detailed;
- payload completo de cada evento;
- retry policy;
- headers;
- Off-Route Reasons;
- todos los códigos de off-route;
- Optimization Metadata;
- Distance endpoint.
