# DOCUMENTO FUNCIONAL
## Sistema de gestión de pedidos, revisión logística e integración con SimpliRoute

**Primera etapa: Pañales**  
**Segunda etapa: Medicamentos y facturación**

---

# 1. Objetivo del sistema

El sistema tendrá como objetivo recibir archivos Excel de pedidos provenientes de diferentes clientes, procesarlos y convertirlos en pedidos operativos para logística.

El flujo general será:

**Excel → Importación → Validación → Padrón de destinatarios → Dirección → Zona → Chofer → Revisión → Bultos → SimpliRoute → Estados → Facturación**

La primera implementación estará enfocada exclusivamente en **pañales**.

Los medicamentos se incorporarán posteriormente porque los archivos analizados presentan estructuras diferentes.

---

# 2. Conceptos principales

Para evitar confusiones, se utilizarán estos conceptos:

### Cliente

Es la **farmacia o empresa que contrata el servicio** y a la que posteriormente se le factura.

Ejemplos:

- Farmacia / cliente A.
- Farmacia / cliente B.

### Destinatario

Es la persona final que recibe el pedido.

El destinatario puede identificarse mediante:

- Número de afiliado.
- Nombre.
- Domicilio.
- Teléfono.

### Pedido

Es el envío que corresponde a un destinatario.

Un pedido puede contener varios productos.

### Producto

Es cada artículo incluido dentro del pedido.

### Entrega

Es la entrega física realizada en un domicilio determinado en una fecha determinada.

### Facturación

Es el cálculo mensual de los viajes/servicios realizados para cada cliente.

---

# 3. Alcance de la primera implementación

## Incluido

La primera versión deberá contemplar:

1. Importación de archivos Excel de pañales.
2. Identificación del cliente.
3. Validación de la estructura del archivo.
4. Creación y actualización del padrón de destinatarios.
5. Agrupación de productos.
6. Consulta del destinatario en SimpliRoute.
7. Comparación de domicilios.
8. Identificación de zona.
9. Asignación de chofer.
10. Grilla de revisión.
11. Carga de bultos.
12. Envío a SimpliRoute.
13. Actualización de estados.
14. Información necesaria para la futura facturación.

## Fuera del alcance inicial

Quedan para una segunda etapa:

- Importación de medicamentos.
- Adaptación de los distintos formatos de medicamentos.
- Facturación automática.
- Impresión definitiva de remitos.
- Impresión definitiva de etiquetas.
- Liquidación definitiva de choferes.

---

# 4. Archivos de pañales

Se analizaron tres archivos de pañales:

- Grilla OSDE Biosíntesis.
- Grilla OSDE Bella Vista.
- Grilla OSDE Farmapal.

Los tres archivos tienen una estructura similar.

Farmapal tiene algunos campos adicionales, como el número de ticket, que deberán considerarse opcionales.

El sistema deberá permitir trabajar con los tres formatos sin tener que desarrollar tres sistemas diferentes.

---

# 5. Importación

## 5.1 Selección del cliente

El usuario **no deberá estar obligado a seleccionar el cliente antes de importar el Excel**.

El sistema deberá intentar identificar el cliente a partir del archivo.

Por ejemplo:

- BIOSINTESIS → Cliente Biosíntesis.
- BELLA VISTA → Cliente Bella Vista.
- FARMAPAL → Cliente Farmapal.

El sistema deberá mostrar el cliente detectado antes de confirmar la importación.

Si no puede identificarlo:

**Cliente sin identificar**

y deberá permitir que el usuario lo seleccione manualmente.

---

# 6. Validación del archivo

Al cargar el Excel, el sistema deberá validar:

- Que el archivo sea válido.
- Que tenga las columnas necesarias.
- Que exista número de afiliado.
- Que exista destinatario.
- Que exista dirección.
- Que exista localidad.
- Que exista fecha de entrega.
- Que existan productos.
- Que exista cantidad.

Los errores no deberían impedir necesariamente todo el procesamiento.

Los registros con problemas deberán quedar marcados para revisión.

---

# 7. Agrupación de productos

Una línea del Excel representa un producto, no necesariamente un pedido.

Por lo tanto, el sistema deberá agrupar las líneas que correspondan a:

**Mismo cliente + mismo afiliado + misma dirección + misma fecha de entrega.**

El resultado será un único pedido con varios productos.

### Ejemplo

En el Excel:

| Afiliado | Dirección | Producto | Cantidad |
|---|---|---|---:|
| 12345 | Rivadavia 100 | Pañal A | 4 |
| 12345 | Rivadavia 100 | Pañal B | 5 |
| 12345 | Rivadavia 100 | Pañal C | 2 |

El sistema deberá generar:

**1 pedido**

con:

- 3 productos diferentes.
- 11 unidades.

Si el mismo afiliado aparece con una dirección diferente, deberá generarse otro pedido.

---

# 8. Padrón de destinatarios

Cada importación deberá actualizar el padrón interno de destinatarios.

El sistema deberá:

- Crear nuevos destinatarios.
- Actualizar información cuando corresponda.
- Mantener el historial.
- Relacionar el destinatario con el cliente.

El número de afiliado será uno de los identificadores principales.

---

# 9. Consulta a SimpliRoute

Por cada destinatario importado, el sistema deberá intentar consultar si existe en SimpliRoute.

La consulta deberá realizarse utilizando el identificador acordado para el afiliado/destinatario.

Se deberá validar técnicamente qué información expone la API de SimpliRoute.

Cuando el destinatario exista, se deberá recuperar, cuando esté disponible:

- Nombre.
- Dirección.
- Localidad.
- Teléfono.
- Coordenadas.
- Identificador del destinatario en SimpliRoute.
- Otros datos necesarios para la planificación.

---

# 10. Destinatario no encontrado

Si el destinatario no existe en SimpliRoute:

El pedido deberá quedar marcado como:

**No encontrado en SimpliRoute**

El sistema deberá conservar los datos del Excel y permitir revisar el registro.

Deberá quedar preparada la posibilidad de crear el destinatario en SimpliRoute si la API y el proceso operativo lo permiten.

---

# 11. Control de dirección

Este es un punto importante del sistema.

Puede ocurrir que el mismo destinatario figure con una dirección diferente en una nueva importación.

Ejemplo:

### Padrón

Juan Pérez  
Av. Rivadavia 100

### Nuevo Excel

Juan Pérez  
Av. Rivadavia 200

El sistema deberá detectar la diferencia.

No deberá actualizar automáticamente la dirección del padrón.

Deberá mostrar una alerta:

**Dirección diferente a la registrada**

Y permitir decidir:

### Opción 1
Usar la dirección del Excel solamente para ese pedido.

### Opción 2
Usar la nueva dirección y actualizar el padrón.

### Opción 3
Mantener la dirección existente.

La dirección finalmente seleccionada será la que se utilizará para zona y planificación.

---

# 12. Zona

Una vez definida la dirección válida, el sistema deberá determinar la zona logística.

La zona deberá obtenerse según la dirección y/o coordenadas.

La relación de:

**Zona → Chofer**

deberá poder consultarse desde la información disponible de SimpliRoute o configurarse en el sistema.

Esto deberá validarse técnicamente.

---

# 13. Asignación de chofer

Una vez determinada la zona:

1. Se identifica la zona.
2. Se consulta la relación zona/chofer.
3. Se asigna el chofer correspondiente.
4. El resultado se muestra en la grilla.

Si no existe una relación:

**Chofer sin asignar**

El usuario podrá corregir manualmente el chofer.

---

# 14. Grilla principal

La grilla será el centro de trabajo del usuario.

Deberá mostrar **un registro por pedido**, no una línea por producto.

Columnas sugeridas:

- Cliente.
- Número de afiliado.
- Destinatario.
- Dirección.
- Localidad.
- Fecha.
- Cantidad de productos.
- Cantidad total de unidades.
- Bultos.
- Zona.
- Chofer.
- Estado de validación.
- Estado de SimpliRoute.
- Observaciones.
- Acciones.

---

# 15. Detalle del pedido

Desde la grilla se podrá abrir el pedido y visualizar sus productos.

Por ejemplo:

**Afiliado:** 12345  
**Destinatario:** Juan Pérez  
**Dirección:** Rivadavia 100

Detalle:

| Producto | Código | Cantidad |
|---|---|---:|
| Pañal A | EAN001 | 4 |
| Pañal B | EAN002 | 5 |
| Pañal C | EAN003 | 2 |

Total:

**11 unidades**

---

# 16. Carga de bultos

La cantidad de bultos deberá poder cargarse desde la grilla.

El campo deberá quedar editable para logística.

Ejemplo:

| Pedido | Unidades | Bultos |
|---|---:|---:|
| Afiliado 12345 | 11 | 2 |

La cantidad de bultos deberá quedar asociada al pedido y posteriormente deberá enviarse a SimpliRoute, según lo que permita la integración.

---

# 17. Revisión antes de enviar

Antes de enviar los pedidos a SimpliRoute, el sistema deberá identificar:

- Afiliado no encontrado.
- Dirección diferente.
- Dirección incompleta.
- Zona sin identificar.
- Chofer sin asignar.
- Datos obligatorios faltantes.
- Bultos sin cargar, cuando sean obligatorios.

Los pedidos con errores bloqueantes no deberán enviarse.

---

# 18. Envío a SimpliRoute

El usuario deberá poder seleccionar los pedidos que desea enviar.

El sistema deberá:

1. Validar los pedidos.
2. Enviar los pedidos válidos.
3. Guardar el identificador devuelto por SimpliRoute.
4. Informar errores.
5. Permitir reintentar los pedidos fallidos.

El error de un pedido no deberá impedir el envío de los demás pedidos válidos.

---

# 19. Estados

El sistema deberá mantener los estados propios y relacionarlos con los estados de SimpliRoute.

Estados funcionales iniciales:

### Sin asignar

El pedido todavía no tiene planificación/chofer.

### Coordinado / Asignado

El pedido fue asignado a una planificación o chofer.

### En despacho / En tránsito

El pedido se encuentra en proceso de entrega.

### Entregado

El pedido fue entregado al destinatario.

### Entrega fallida

Se realizó el intento de entrega pero no se pudo concretar.

Ejemplo:

El chofer fue al domicilio y el destinatario no estaba.

### Cancelado

El pedido fue cancelado.

La equivalencia exacta con los estados que exponga SimpliRoute deberá confirmarse técnicamente.

---

# 20. Cliente y destinatario

Esta diferenciación deberá mantenerse en todo el sistema.

### Cliente

Farmacia o empresa que contrata el servicio.

### Destinatario

Persona final que recibe el pedido.

Nunca se deberán utilizar ambos conceptos como sinónimos.

Esta separación es especialmente importante para la facturación.

---

# 21. Facturación

La facturación se realizará:

**Al cierre de cada mes.**

La facturación será:

**Por cliente.**

Es decir, cada farmacia tendrá su propia liquidación.

Los pedidos de clientes diferentes **nunca se cruzan para calcular la facturación**.

---

# 22. Regla principal de facturación

El primer criterio siempre será:

**Cliente**

Después se analizarán:

- Fecha de entrega.
- Dirección.
- Tipo de servicio.
- Cantidad de pedidos.

Por lo tanto:

**Cliente + Fecha + Dirección**

será la base para analizar los pedidos que pueden compartir un viaje dentro de ese cliente.

---

# 23. CABA y Provincia

Las entregas deberán clasificarse como:

- CABA.
- Provincia de Buenos Aires.

CABA y Provincia tendrán tarifas diferentes.

Las tarifas deberán ser configurables por cliente.

Por ejemplo:

| Cliente | CABA | Provincia |
|---|---:|---:|
| Farmacia A | $X | $Y |
| Farmacia B | $X | $Y |

Las tarifas deberán tener vigencia para poder mantener históricos.

---

# 24. Regla 2 × 1

Cuando un mismo cliente tenga varios pedidos del mismo tipo:

- En la misma fecha.
- En la misma dirección.

Se aplicará la regla:

**Cada 2 pedidos = 1 viaje facturable.**

Esto aplica por separado a:

- Pañales.
- Medicamentos.

### Ejemplos

| Pedidos | Viajes |
|---:|---:|
| 1 | 1 |
| 2 | 1 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |
| 10 | 5 |

Si queda un pedido sin pareja, se factura como un viaje adicional.

---

# 25. Entrega unificada

Una entrega se considera **unificada únicamente cuando se entregan pañales y medicamentos del mismo cliente**.

Deben cumplirse simultáneamente estas condiciones:

- Mismo cliente.
- Mismo domicilio.
- Misma fecha.
- Un pedido de pañales.
- Un pedido de medicamentos.

En ese caso:

- Un servicio se factura al valor completo del viaje.
- El segundo servicio se factura aplicando un porcentaje adicional.

El porcentaje deberá ser configurable.

---

# 26. Qué NO es una entrega unificada

No se considera unificada cuando:

### Solo hay pañales

Se aplica la regla 2 × 1.

### Solo hay medicamentos

Se aplica la regla 2 × 1.

### Son clientes diferentes

Nunca se cruzan.

### Son fechas diferentes

No se unifican.

### Son domicilios diferentes

No se unifican.

---

# 27. Orden para calcular la facturación

Para evitar errores, el sistema deberá aplicar las reglas en este orden:

### Paso 1

Separar todos los pedidos por cliente.

### Paso 2

Dentro de cada cliente, agrupar por:

**Fecha + dirección normalizada.**

### Paso 3

Separar:

- Pedidos de pañales.
- Pedidos de medicamentos.

### Paso 4

Buscar entregas unificadas.

Un pedido de pañales puede unificarse con un pedido de medicamentos cuando cumplen las condiciones.

### Paso 5

Los pedidos que no fueron utilizados en una entrega unificada quedan disponibles para la regla 2 × 1.

### Paso 6

Aplicar 2 × 1 a los pedidos restantes de cada tipo.

### Paso 7

Aplicar la tarifa correspondiente:

- CABA.
- Provincia.

---

# 28. Ejemplos de facturación

## Caso 1 — 10 pedidos de pañales

Mismo cliente.

Misma fecha.

Misma dirección.

10 pedidos de pañales.

Resultado:

**5 viajes facturables.**

No es una entrega unificada.

---

## Caso 2 — 3 pedidos de medicamentos

Mismo cliente.

Misma fecha.

Misma dirección.

3 pedidos de medicamentos.

Resultado:

**2 viajes facturables.**

---

## Caso 3 — 1 pañal + 1 medicamento

Mismo cliente.

Misma fecha.

Misma dirección.

Resultado:

**1 entrega unificada.**

Se cobra:

- 1 viaje al 100 %.
- Segundo servicio con el porcentaje configurado.

---

## Caso 4 — 3 pañales + 1 medicamento

Mismo cliente.

Misma fecha.

Misma dirección.

Se realiza:

- 1 unificación entre un pedido de pañales y uno de medicamentos.
- Quedan 2 pedidos de pañales.
- Los 2 pañales restantes generan 1 viaje por 2 × 1.

Resultado:

**1 viaje completo + porcentaje del segundo servicio + 1 viaje adicional.**

---

# 29. Clientes diferentes

Ejemplo:

En el mismo domicilio y fecha se entregan:

- 10 pedidos de Farmacia A.
- 4 pedidos de Farmacia B.

No se suman.

El sistema calcula:

### Farmacia A

10 pedidos → 5 viajes.

### Farmacia B

4 pedidos → 2 viajes.

Cada cliente tendrá su propia facturación.

---

# 30. Información necesaria para facturación

Cada pedido deberá conservar:

- Cliente.
- Afiliado.
- Destinatario.
- Dirección original.
- Dirección normalizada.
- Localidad.
- CABA / Provincia.
- Fecha programada.
- Fecha efectiva de entrega.
- Tipo de servicio.
- Estado final.
- Remito.
- Ticket, cuando corresponda.
- Chofer.
- Identificador de SimpliRoute.
- Regla aplicada.
- Tarifa utilizada.
- Porcentaje aplicado.
- Importe calculado.
- Grupo de facturación.

---

# 31. Reporte mensual

El sistema deberá permitir generar un reporte por:

- Mes.
- Cliente.

El reporte deberá mostrar:

- Cliente.
- Fecha.
- Destinatario.
- Número de afiliado.
- Dirección.
- CABA / Provincia.
- Tipo de servicio.
- Cantidad de pedidos.
- Cantidad de viajes.
- Entregas unificadas.
- Regla aplicada.
- Tarifa.
- Porcentaje.
- Importe.
- Chofer.

Deberá poder exportarse a Excel.

---

# 32. Trazabilidad de facturación

Los pedidos nunca deberán fusionarse físicamente ni eliminarse por motivos de facturación.

Cada pedido deberá seguir existiendo como registro independiente.

El sistema deberá relacionarlo con un grupo de facturación.

Esto permitirá saber:

- Qué pedidos generaron un viaje.
- Qué pedidos se unificaron.
- Qué tarifa se utilizó.
- Qué porcentaje se aplicó.
- Cómo se obtuvo el importe final.

---

# 33. Roles

## Operaciones

- Importar archivos.
- Revisar pedidos.
- Resolver errores.
- Confirmar direcciones.
- Enviar pedidos a SimpliRoute.

## Logística

- Cargar bultos.
- Revisar zona.
- Revisar chofer.
- Corregir información logística.

## Administración

- Configurar clientes.
- Configurar tarifas.
- Configurar zonas.
- Configurar porcentajes.
- Administrar usuarios.

## Facturación

- Seleccionar mes.
- Seleccionar cliente.
- Generar liquidación.
- Revisar viajes.
- Revisar unificaciones.
- Exportar información.

---

# 34. Auditoría

El sistema deberá guardar:

- Usuario que realizó el cambio.
- Fecha y hora.
- Dato anterior.
- Dato nuevo.

Especialmente para:

- Dirección.
- Cliente.
- Zona.
- Chofer.
- Bultos.
- Estado.
- Tarifa.
- Ajustes de facturación.

---

# 35. Criterios de aceptación del MVP

El MVP deberá cumplir como mínimo con:

- Importar los tres formatos de pañales.
- Identificar el cliente sin exigir selección previa.
- Permitir corregir el cliente detectado.
- Agrupar productos por afiliado, dirección y fecha.
- Mantener separados los pedidos cuando la dirección sea diferente.
- Crear y actualizar el padrón de destinatarios.
- Consultar el destinatario en SimpliRoute.
- Detectar diferencias de domicilio.
- Permitir resolver las diferencias de domicilio.
- Determinar zona.
- Asignar chofer.
- Mostrar todos los pedidos en una grilla.
- Permitir abrir el detalle de productos.
- Permitir cargar bultos.
- Enviar pedidos válidos a SimpliRoute.
- Registrar errores de integración.
- Actualizar estados.
- Mantener separado cliente de destinatario.
- Mantener la información necesaria para facturación.
- Aplicar la facturación por cliente.
- Separar CABA y Provincia.
- Aplicar la regla 2 × 1.
- Identificar entregas unificadas únicamente entre pañales y medicamentos del mismo cliente.
- No cruzar nunca clientes diferentes.

---

# 36. Validaciones técnicas pendientes

Antes de cerrar el diseño técnico deberán confirmarse:

1. API disponible de SimpliRoute.
2. Cómo consultar destinatarios por número de afiliado.
3. Qué datos del destinatario devuelve SimpliRoute.
4. Cómo obtener las zonas.
5. Cómo obtener la relación zona/chofer.
6. Cómo enviar la cantidad de bultos.
7. Cómo crear nuevos destinatarios.
8. Cómo actualizar domicilios.
9. Estados disponibles en SimpliRoute.
10. Frecuencia de sincronización de estados.
11. Formato definitivo de remitos.
12. Formato definitivo de etiquetas.
13. Tarifas de CABA por cliente.
14. Tarifas de Provincia por cliente.
15. Porcentaje del segundo servicio en una entrega unificada.
16. Qué servicio se considera principal en una unificación.
17. Tratamiento de entregas fallidas.
18. Tratamiento de cancelaciones.
19. Tratamiento de reentregas.
20. Reglas definitivas para liquidación de choferes.

---

# 37. Segunda etapa — Medicamentos

Una vez estabilizado el proceso de pañales se incorporarán los medicamentos.

Los archivos de medicamentos analizados presentan estructuras diferentes, por lo que deberán desarrollarse importadores específicos.

La lógica de negocio común será reutilizada:

**Importación → Destinatario → Dirección → Zona → Chofer → SimpliRoute → Estado → Facturación**

pero cada formato de archivo podrá requerir su propio mapeo.

---

# 38. Implementación sugerida

## Etapa 1

**Importador de pañales**

- Lectura Excel.
- Identificación de cliente.
- Agrupación.
- Padrón.

## Etapa 2

**Validación logística**

- SimpliRoute.
- Direcciones.
- Zonas.
- Choferes.
- Grilla.

## Etapa 3

**Operación**

- Bultos.
- Envío.
- Estados.
- Revisión.

## Etapa 4

**Facturación**

- Clientes.
- Tarifas.
- CABA / Provincia.
- 2 × 1.
- Entregas unificadas.
- Reportes mensuales.

## Etapa 5

**Medicamentos**

- Importadores específicos.
- Integración con la lógica existente.
- Integración con facturación.

---

# 39. Principio general del sistema

La aplicación deberá mantener separados tres niveles:

### Pedido

Qué se está enviando.

### Entrega

Dónde y cuándo se realizó la entrega.

### Facturación

Cómo se cobra esa entrega al **cliente/farmacia**.

Esto es importante porque varios productos pueden formar un pedido, varios pedidos pueden formar una entrega facturable según las reglas comerciales, pero **nunca se deben cruzar clientes diferentes**.

La información original y la trazabilidad de cada pedido deberán conservarse durante todo el proceso.