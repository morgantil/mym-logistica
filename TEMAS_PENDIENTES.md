# TEMAS PENDIENTES — vista consolidada de todo lo que falta

Última actualización: **2026-09-04**. Documento vivo, separado de `PENDIENTES.md`
(ese sigue con el detalle histórico de despliegue/credenciales). Este junta
**todo** lo que queda para terminar el proyecto — técnico, de negocio y de
assets — en un solo lugar.

Cómo leer la columna "Dueño":
- **Nosotros** = lo resuelve Claude Code directamente, sin esperar nada.
- **Leonardo** = necesita una decisión, una cuenta, o un archivo tuyo.
- **Cliente final** = depende de alguien fuera de MyM.

---

## 0. Discrepancias del documento v6 — ✅ resueltas e implementadas (2026-08-17)

`Documento_Funcional_MVP_Panales_SimpliRoute_Actualizado_v6.pdf` (Arbet
Consulting, 2026-08-13) traía dos puntos distintos de lo ya construido —
fecha de entrega y tarifas por zona. Ambos ya están implementados, migrados
contra la base real (207 pedidos preservados sin pérdida) y probados en
navegador real — ver `DOCUMENTO TECNICO.md` historial 2026-08-17.

## 1. Facturación

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 1.1 | Pregunta 1 de `PREGUNTAS_FACTURACION.pdf` | ✅ **Resuelta e implementada** | Pañales se factura al 100%, medicamentos con porcentaje adicional configurable. |
| 1.2 | Combinaciones habilitadas de entrega unificada | Nosotros, cuando arranque Etapa 2 | **Verificado 2026-09-04, es más que cargar una config**: `FacturacionService.generarVistaPrevia` calcula siempre para **un solo Cliente a la vez** (`listarFacturables({clienteId, ...})`). Las combinaciones reales (Farmaet↔Biosíntesis/Farmapal; Bella Vista medicamentos↔OSDE Bella Vista pañales/Previvax) son entre Clientes *distintos* en el sistema — hoy no hay forma de que un pedido de Farmaet se cruce con uno de Biosíntesis para unificar, porque nunca se traen juntos. Falta construir esa lógica de agrupación entre clientes, no solo cargar el dato de qué combinaciones están habilitadas. No bloquea nada hoy porque medicamentos todavía no se importa (Etapa 2). |
| 1.3 | Concepto "Subcliente" (Bulto/Bolsa por cliente) | Nosotros, cuando arranque Etapa 2 | No existe en el schema. No bloquea nada hoy. |
| 1.4 | Cargar las localidades reales en "Localidades por zona" — **o** el atajo nuevo | Leonardo / Cliente final | ⏳ **En progreso, arrancado 2026-09-04**: Leonardo confirmó que pañales sí cobra distinto por Cordón (no es un valor único de "Provincia"). Ya creó una `ZonaTarifaria` nueva ("Primer Cordon"), le cargó tarifa para el cliente "PR" ($120, vs. $100 de "Provincia"), y mapeó la localidad "AVELLANEDA" + 4 de las 11 zonas de SimpliRoute (`Caba (caballito)`, `Caba - noroeste` → CABA; `CABA`, `Oeste largo` → Provincia — ojo, revisar si esos dos últimos nombres están bien asignados, se ven invertidos a simple vista). Falta completar el resto de las zonas/localidades y decidir si hacen falta más Cordones (2º, 3º) además de "Primer Cordon". Ambas pantallas (`Facturación → Zonas tarifarias`) son 100% autoservicio, no requieren código. |

## 2. SimpliRoute — Zonas/Choferes/Vehículos construido el 2026-08-26 (revierte lo del 2026-08-17)

**Construido de punta a punta** con luz verde explícita de Leonardo. Principio
general para toda la integración con SimpliRoute, no solo para esto:
SimpliRoute es la fuente de verdad. En los recursos donde su API pública
permite CRUD (Choferes, Vehículos) MyM lee **y** edita directo contra
SimpliRoute. En los recursos de solo lectura (Zonas, y también Fleets/Skills
si algún día hicieran falta) MyM solo trae y muestra — cualquier alta o
edición de Zona sigue haciéndose en SimpliRoute. Detalle completo en
`DOCUMENTO TECNICO.md` historial 2026-08-26 y en el README de
`zonas-choferes/`.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 2.1 | ~~Rediseñar el módulo `zonas-choferes/`~~ | ✅ Construido 2026-08-26 | Cache local (3 tablas nuevas) sincronizado desde SimpliRoute, refresco perezoso (TTL 15 min) + botón "Sincronizar ahora". Sin BullMQ/Redis — nunca se llegaron a usar en este proyecto, con 11/12/17 registros reales no hace falta un job real. Probado en navegador real (modo mock). |
| 2.2 | ~~Point-in-polygon para resolver zona~~ | ✅ Construido 2026-08-26 | `zonas-choferes/domain/punto-en-poligono.ts`, 8 tests. Se resuelve al mismo tiempo que CABA/Provincia, con fallback a coincidencia por localidad si no hay coordenadas o no matchea ninguna zona. |
| 2.3 | ~~Confirmar addon de Zonas habilitado~~ | ✅ Resuelto 2026-08-26 | Confirmado con `GET /v1/zones/` real: **11 zonas** activas. También `GET /v1/routes/vehicles/` (12) y `GET /v1/accounts/drivers/` (17). Sin ninguna escritura contra la cuenta real. |
| 2.4 | ~~Probar escritura de Choferes/Vehículos contra la cuenta real~~ | ✅ Probado 2026-08-28 | Se probó contra la cuenta real (`crearChofer`/`actualizarChofer`/`eliminarChofer`) y aparecieron **3 discrepancias reales** contra lo que decía la documentación de SimpliRoute, ya corregidas: (1) el body de create/update va como objeto plano, no como array — la API real devuelve "Expected a dictionary, but got list" con el array que el doc oficial mostraba; (2) PUT/PATCH exigen re-enviar `is_driver: true` siempre, si no tira "You must select user type"; (3) `DELETE` no está implementado pese a listarse en el header `Allow` (devuelve 405) — la baja real es un soft-delete vía `PATCH status: "deleted"` (valores posibles: `active`/`deleted`/`blocked`, descubiertos vía `OPTIONS`). `listarChoferes` también se corrigió para tratar `status: "deleted"` como inactivo (antes solo miraba `is_driver`/`blocked`, que no cambian). Probado de punta a punta: alta → edición → baja real, registro de prueba limpiado después. Vehículos comparte el mismo adapter genérico pero no se probó su escritura puntualmente — mismo riesgo bajo, no bloquea nada. |
| 2.5 | ~~Sincronización de estados~~ | ✅ Construido y probado 2026-08-28 | **No hizo falta ningún estado nuevo en SimpliRoute** — decisión anterior (ítem 2.6, ya no aplica) estaba sobredimensionada: alcanza con los estados que la Visita siempre tiene (`pending`/`entered`/`completed`/`failed`, confirmados vía `OPTIONS` contra la cuenta real), mapeados 1 a 1 a los 4 valores de `EstadoPedido` que ya existían (`COORDINADO`/`EN_TRANSITO`/`ENTREGADO`/`ENTREGA_FALLIDA`) — el schema ya estaba listo, solo faltaba el código que lo usara. `PedidosService.sincronizarEstados()` trae el estado real de cada pedido enviado y en curso, y se dispara solo antes de calcular cualquier facturación (cliente o transportistas) además de estar disponible como botón manual ("Sincronizar estados" en Pedidos). Usa `checkout_time` de la Visita (la marca real del chofer al completar, vía su app) como `fechaEntregaEfectiva` — si no está poblado (ej. estado cambiado a mano) queda `null` en vez de inventar una fecha. Probado de punta a punta contra la cuenta real: pedido de prueba enviado → Visita marcada `completed` → sincronizado desde la UI real → pasó a Entregado → apareció en la liquidación de transportistas con el monto correcto. Esto además destapó que **la Liquidación a clientes tampoco tenía nunca ningún pedido en `ENTREGADO`** (nada lo seteaba) — sin este trabajo esa pantalla no podía funcionar con datos reales, aunque ya estuviera "construida". |
| 2.6 | ~~Nombre del estado inicial nuevo en SimpliRoute~~ | Ya no aplica | Ver 2.5 — no hizo falta ningún estado nuevo, esto quedó obsoleto. |
| 2.7 | ~~Probar el envío real de un pedido (crear una Visita)~~ | ✅ Probado 2026-08-27 | Adapter probado de punta a punta contra la cuenta real — pedido de prueba enviado, Visita real creada y verificada, registro borrado después. |
| 2.8 | ~~Activar modo real (`SIMPLIROUTE_MOCK=false`)~~ | ✅ Activado 2026-09-01 | Leonardo lo activó en el ambiente de test (Render). Un primer intento falló (500) por un error de tipeo real al pegar la clave en el panel de Render (el valor había quedado como `"Value: fff187...` en vez de solo la clave — se corrigió y redesplegó). Confirmado funcionando: `POST /simpliroute-cache/sincronizar` trae las 11 zonas/18 choferes/12 vehículos reales, verificado también en el navegador. A partir de acá el ambiente de test manda tráfico real — cualquier pedido enviado crea una Visita real visible para los choferes. |

## 3. Etiquetas de envío y Embalaje y Despacho — ✅ construidas y probadas (2026-08-17)

Ambas implementadas end-to-end (backend + frontend), probadas en navegador
real contra datos reales — ver `DOCUMENTO TECNICO.md` historial. Pantalla
nueva `/embalaje-despacho` (rol Logística/Administración): filtra por
fecha/cliente/estado, carga de bultos, imprime/reimprime etiquetas en PDF
(una por bulto).

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 3.1 | Tamaño/impresora real de la etiqueta | Leonardo | Se usó un default razonable (10×15cm, tamaño estándar de envío) — el propio documento v6 deja esto como validación pendiente. Cambiar el tamaño es ajustar dos constantes, no un rediseño. |

## 4. Liquidación a transportistas (alcance nuevo desde el documento v6)

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 4.1 | ~~Tarifa fija por viaje para cada transportista~~ | ✅ Construido 2026-08-26 | En vez de pedirle a Leonardo un número fijo, se construyó como un **monto configurable con historial de vigencia** (`Facturación → Transportistas`, mismo patrón que `PorcentajeSegundoServicio`) — lo carga/actualiza directamente quien haga Facturación, sin depender de código. Probado en navegador real. |
| 4.2 | ~~Construir el *cálculo* de liquidación (cuántos viajes hizo cada chofer)~~ | ✅ Construido y probado 2026-08-28 | Desbloqueado por 2.5. `Facturación → Transportistas` ahora muestra, para el mes/año elegido, un resumen por chofer (viajes entregados × tarifa vigente = total a pagar) — sincroniza estados reales antes de calcular. Cuenta pedidos `ENTREGADO` con chofer asignado por `fechaEntregaEfectiva` (la real, no la programada). Sin 2×1 ni entrega unificada, a diferencia de la facturación a clientes: cada pedido entregado es un viaje completo. Función pura testeada (`motor-liquidacion-transportistas.ts`, 4 tests) + probado en navegador real contra la cuenta real de SimpliRoute. |

## 5. Reglas de negocio sin definir

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 5.1 | Tratamiento de entregas fallidas | Leonardo / Cliente final | Desde 2026-08-28 el sistema ya sincroniza `ENTREGA_FALLIDA` desde SimpliRoute y lo refleja en la grilla de Pedidos (ver 2.5) — falta definir qué hace **nuestro** sistema además de mostrarlo (¿reintento automático? ¿aviso a alguien? ¿se factura igual?). |
| 5.2 | Tratamiento de cancelaciones | Leonardo / Cliente final | Sin definir. |
| 5.3 | Tratamiento de reentregas | Leonardo / Cliente final | Sin definir. |

## 6. Confirmado fuera de alcance (2da etapa, sin cambios)

| # | Tema | Motivo |
|---|---|---|
| 6.1 | Remitos (impresión definitiva) | Sigue en 2da etapa. |
| 6.2 | Medicamentos (importación y facturación) | Fuera de alcance de esta etapa. |
| 6.3 | Pago automático/integración contable de liquidación a transportistas | El *cálculo* sí entra ahora (sección 4) — el pago automático sigue afuera. |

## 7. Credenciales / cuentas externas

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 7.1 | Login con Google (`GOOGLE_CLIENT_ID`/`SECRET`) | Leonardo decide | Leonardo está evaluando sacarlo de este MVP y quedarse solo con login local. Para eso hacía falta una forma de gestionar usuarios sin Google — construida 2026-08-26 (pantalla "Usuarios", rol Administración: alta con contraseña temporal, roles combinables, permisos por cliente, resetear contraseña, activar/desactivar). Decisión pendiente: sacar el botón "Continuar con Google" del login o dejarlo (el código sigue andando de cualquier manera, no hay que tocarlo para decidir esto). |
| 7.2 | Storage de archivos Excel (Cloudflare R2) | Leonardo crea la cuenta | Baja prioridad. |

## 8. Infraestructura / despliegue

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 8.1 | Base de datos de test separada de prod (branch de Neon) | Nosotros | Hoy comparte la Neon de desarrollo. |
| 8.2 | Dominio propio | Leonardo (~$10-15/año) | Opcional. |
| 8.3 | Producción real (instancias pagas, sin "sleep") | Leonardo decide cuándo | Cuando el cliente final apruebe pasar de demo a uso real. |

## 9. Assets

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 9.1 | Logo real de MyM | Leonardo | Hoy la PWA usa un placeholder. |

## 10. Mejoras UX en Pedidos — ✅ construidas 2026-09-01 (charla y luz verde explícita de Leonardo)

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 10.1 | ~~Sacar el control de bultos antes de enviar a SimpliRoute~~ | ✅ Construido | Ya no bloquea "Enviar a SimpliRoute" — se puede cargar bultos más cerca del despacho. El control de bultos antes de imprimir etiquetas queda igual (sin bultos no se puede numerar "Bulto X de N"). |
| 10.2 | ~~Filtros y búsqueda en la grilla de Pedidos~~ | ✅ Construido | Fecha desde/hasta, Bultos desde/hasta (mayor/menor) y búsqueda libre (destinatario, dirección o Nº de afiliado) — todos combinables. |
| 10.3 | ~~Ticket de Farmapal se perdía al importar~~ | ✅ Corregido | Se capturaba en la vista previa pero nunca se guardaba en ningún lado — bug real encontrado al revisar el pedido de Leonardo. Ahora se agrega al texto de Observaciones (sale impreso en la etiqueta, sin tocar el generador de PDF). |
| 10.4 | ~~Mostrar todas las columnas en la grilla de Pedidos + personalización~~ | ✅ Construido | Se agregaron Nº de Pedido y Teléfono (existían en la base pero no se mostraban). Botón "Personalizar columnas": cada usuario elige cuáles fijar a la izquierda, en el orden que las va marcando — preferencia guardada por usuario (nueva columna `Usuario.columnasFijasPedidos`), no por navegador. |
| 10.5 | ~~Ordenar la grilla al tocar una columna~~ | ✅ Construido | Click en el encabezado ordena ascendente, otro click descendente, un tercero vuelve al orden por defecto — con flechita indicando el sentido. Server-side (la grilla pagina de a 20, ordenar solo en el navegador hubiera ordenado nada más la página visible) — nueva whitelist `CampoOrdenPedido` en el backend, nunca un string libre. Única excepción: la columna "Productos" no es ordenable, es un cálculo agregado sobre varios renglones, no una columna guardada. |
| 10.6 | ~~Columna "Fecha de subida" (con hora)~~ | ✅ Construido | Nueva columna separada de "Fecha" (que es la fecha de *entrega* elegida a mano antes de importar, sin hora real) — muestra `creadoEn` con fecha y hora (`dd/mm/aaaa hh:mm`, horario de Argentina), el momento real en que se creó el pedido en el sistema. |

**Hallazgo real en el camino, no relacionado con lo construido:** existe un cliente real llamado **"PR"** (creado hoy, ya con 5 pedidos reales) con patrones de detección `PR, PABLO, RENZO` — "PR" es un patrón peligrosamente genérico: cualquier archivo Excel futuro cuyo nombre simplemente *contenga* las letras "PR" (parte de un nombre de empresa, por ejemplo) se le va a asignar a este cliente por error, con su mapeo de columnas — no es un problema de esta sesión, pero conviene que Leonardo lo revise y le ponga un patrón más específico antes de que cause una importación mal asignada con datos reales.

## 11. Dirección del afiliado: SimpliRoute vs. Excel — investigado y backend resuelto 2026-09-03

Ver DOCUMENTO TECNICO.md historial 2026-09-03 y `prueba de visitas con direccion diferente.pdf` (raíz del proyecto) para el detalle completo con evidencia real.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 11.1 | ~~Medir y corregir el impacto en liquidación a transportistas cuando la dirección del afiliado en SimpliRoute está desactualizada~~ | ✅ Construido (backend) | `PedidosService.enviarASimpliRoute` recalcula zona/chofer con la coordenada real que SimpliRoute devuelve al geocodificar la Visita (antes se descartaba) y corrige `zonaId`/`choferId` si da distinto al asignado antes de enviar, dejando snapshot del valor anterior (`zonaPreEnvioId`/`choferPreEnvioId`, etc.) para poder medir cuántas veces pasó. No bloquea el envío — la entrega en sí ya llegaba bien igual (usa siempre la dirección del Excel, no la de SimpliRoute). **Deployado a test 2026-09-03** (commit `11c48b0`), verificado en vivo (login, dashboard y grilla reales, sin errores en consola). |
| 11.2 | ~~Alerta visible en el frontend para baja confianza de geocodificación~~ | ✅ Construido | Decisión explícita de Leonardo: **solo** la alarma de `geocode_alert` (SimpliRoute sin confianza al geolocalizar la dirección del Excel — riesgo real de mandar al chofer a cualquier lado), no las otras dos. Solo fondo, sin frase: fila de la grilla en ámbar (`bg-amber-50 dark:bg-amber-500/10`) cuando `geocodeAlert` no es null y no es `"no alert"`. Verificado en navegador real (claro y oscuro) con datos de prueba sembrados directo en la base y borrados después. |
| 11.3 | ~~Medición retroactiva sobre pedidos ya enviados antes de este cambio~~ | No hace falta | Decisión de Leonardo: no se envió ningún pedido real todavía con este problema — el ambiente sigue en test, nunca se pasó a producción, no hay impacto real que medir hacia atrás. |
| 11.4 | ~~Bug real — la dirección que se manda a SimpliRoute no incluía suficiente contexto~~ | ✅ Corregido y verificado de punta a punta 2026-09-04 | Encontrado con un pedido real (Nº 1, cliente PR, afiliado 61269439802): "Balcarce 594 -depto 1" geocodificó en **San Luis, a 600+ km** — "Balcarce" es una calle real tanto en CABA (Balcarce 50 = Casa Rosada) como en otras provincias. **Dos intentos hasta la solución real** — ambos probados y descartados/reforzados contra la cuenta real, no solo en teoría: (1) concatenar la localidad ("Monserrat") — no alcanzó; (2) agregar "CABA, Argentina" vía `clasificarCabaProvincia` — pareció andar en una prueba directa, pero al probar el flujo real completo (Excel → enviar) seguía fallando, porque esa función clasificaba buscando la **dirección completa** contra la API oficial (tan ambigua como el problema original — "Balcarce 594" resolvía a Rosario) en vez de la localidad. **Solución final**: se cambió `GeorefArAdapter.clasificarCabaProvincia` para buscar por **nombre de localidad** (`/georef/api/localidades?nombre=`) en vez de por dirección — mucho menos ambiguo, probado a mano con 6 localidades reales (Monserrat, Belgrano, Avellaneda, Tigre, San Isidro, Villa Crespo), las 6 bien clasificadas pese a que varias tienen homónimos en otras provincias. El parámetro `direccion`, que ya no se usa, se sacó de la firma del puerto. **Importante**: esta misma función también resuelve la zona tarifaria para facturación — el bug era preexistente ahí también, no algo nuevo de este fix. Verificado de punta a punta (Excel → importar → enviar) contra la cuenta real, sin errores. |
| 11.5 | ~~Red de seguridad — validar que la coordenada geocodificada esté dentro de Buenos Aires~~ | ✅ Construido y verificado 2026-09-04 | Leonardo confirmó con el cliente final que **ninguna entrega sale nunca de Buenos Aires** (CABA + GBA). Nueva función pura `validar-coordenada-buenos-aires.ts` (5 tests) con un rectángulo generoso de lat/lon que cubre CABA+conurbano. `PedidosService.enviarASimpliRoute` la chequea después de cada envío: si la coordenada cae afuera, **no se trata como envío exitoso** — el pedido queda con `estadoSimpliroute: ERROR` (valor del enum que existía sin usar), sin avanzar a Coordinado ni recalcular zona/chofer con una coordenada que ya se sabe que está mal, y se informa en la respuesta con el id de la Visita creada en SimpliRoute para revisión manual (la Visita en sí no se borra — eso quedaría para una mejora futura si hace falta). **Probado en 3 casos reales contra la cuenta**: detectó y bloqueó tanto el caso de San Luis (11.4, antes de reforzar el fix) como una dirección real de Córdoba a propósito, y dejó pasar sin problema un caso de control en Belgrano — funcionó exactamente como se diseñó en los tres. Esta validación es un complemento al fix de 11.4, no un reemplazo: es la única red que puede detectar el error incluso si la ambigüedad de dirección vuelve a pasar por otro motivo. 68/68 tests, typecheck limpio, boot de Nest verificado. Deployado. |
| 11.6 | ~~Bug real — la clasificación de localidad era sensible a acentos~~ | ✅ Corregido 2026-09-06 | Probando casos de conurbano ("Villa Pueyrredón" venía en el Excel sin acento, "Villa Pueyrredon"), la comparación exacta de `clasificarCabaProvincia` fallaba en silencio (`"villa pueyrredon" !== "villa pueyrredón"`) y la clasificación se perdía — muy común en datos reales de negocio, no un caso raro. Corregido normalizando acentos (NFD + remover diacríticos) antes de comparar, tanto la localidad buscada como las que devuelve la API. |
| 11.7 | ~~Direcciones que se repiten en más de un municipio del conurbano podían geocodificar en el lugar equivocado~~ | ✅ Corregido y verificado 2026-09-06 | Probado con "Av. San Martín" en Caseros y en Munro (Vicente López) — ambos geocodificaban en la misma coordenada exacta (la de Caseros), el geocodificador de SimpliRoute confundía la calle "San Martín" con el partido homónimo. **Corregido** agregando el partido (dato que la misma API oficial ya devolvía, `departamento.nombre`, sin usar) a la dirección para Provincia — `clasificarCabaProvincia` ahora también devuelve el partido cuando se puede determinar sin ambigüedad. Reprobado: Caseros y Munro ahora geocodifican en sus coordenadas reales y distintas, confianza "no alert" en ambos. |
| 11.8 | ~~Abreviaturas comunes ("Vte.", "Gral.", "V.") y sinónimos de CABA ("Capital Federal", "Cap Fed") no clasificaban~~ | ✅ Corregido 2026-09-06 | `/localidades` busca el nombre completo, no expande abreviaturas de nomenclatura argentina ni reconoce que "CABA"/"Capital Federal" es la ciudad entera, no un barrio puntual. Corregido con `expandirAbreviaturas` (reglas genéricas de escritura, no nombres de lugares) y `SINONIMOS_CABA` (resuelve directo, sin llamar a la API). **Sin corregir, aceptado como límite conocido**: nombres coloquiales no oficiales como "Once" (parte de Balvanera) — probado de punta a punta con una avenida poco ambigua y geocodificó bien igual, pero no hay garantía general para calles más ambiguas combinadas con un nombre así. |
| 11.9 | ~~Bug propio — se usaba la localidad cruda del Excel en vez de la oficial resuelta al armar la dirección~~ | ✅ Corregido 2026-09-06 | Encontrado probando el fix de 11.8: para "Vte. Lopez" se mandaba "Av. Maipú 2000, **Vte. Lopez**, Vicente López, Provincia de Buenos Aires, Argentina" — la localidad cruda (abreviada) mezclada con el partido ya resuelto confundió a SimpliRoute, que geocodificó en CABA en vez de Vicente López (`geocode_alert: "medium"`). Corregido: `ClasificacionLocalidad` ahora también devuelve `localidadOficial` (nombre bien escrito, confirmado por la API), usado en vez de la variante cruda. Reprobado: mismo caso, ahora en Vicente López real, `"no alert"`. |
| 11.10 | 🔲 Sin corregir, quedó pendiente de decisión — localidad combinada con otro texto en la misma celda, y "San Martín" sin "General" | Nosotros, a definir alcance | Probado 2026-09-06: "Belgrano (CABA)", "Caballito, CABA", "Nuñez - CABA", "CABALLITO/CABA" (localidad + aclaración en la misma celda) no clasifican — la comparación exacta no limpia paréntesis/comas/guiones/barras. "San Martín" a secas tampoco (el partido real se llama oficialmente "General San Martín" — la gente omite "General" al hablar, al revés que con "Gral. Pacheco"). Ninguno rompe nada (caen al comportamiento de antes, sin excepción), es cobertura, no estabilidad. Quedó explícitamente sin avanzar más para no seguir extendiendo el alcance sin chequear — retomar si vuelve a aparecer un caso real. |

## 12. Trazabilidad de órdenes de origen al agrupar pedidos — resuelto 2026-09-07

Duda traída por el cliente final vía Leonardo: al agrupar líneas del mismo
afiliado+dirección+fecha en un solo pedido (§7 funcional, regla explícita
del cliente), ¿qué pasa si esas líneas vienen de órdenes de origen
distintas (ej. dos números de serie de Farmanet)? Ver DOCUMENTO
TECNICO.md historial 2026-09-07 para el análisis completo.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 12.1 | ~~Bug real — el ticket/número de orden se perdía si dos líneas agrupadas traían valores distintos~~ | ✅ Corregido 2026-09-07 | `agruparLineasEnPedidos` guardaba el ticket una sola vez por pedido, tomado de la primera línea — un segundo ticket distinto se perdía en silencio, sin fallback (el Excel original tampoco se archiva, R2 sin configurar). Corregido: `ticket` pasa a ser un campo de cada producto, no del pedido — ninguna línea agrupada pierde su dato. La agrupación en sí **no cambia** (sigue siendo correcta para facturación y 2×1, que cuentan viajes por domicilio/fecha, no órdenes de origen). Observaciones/etiqueta muestran "Ticket: X" si todos los productos comparten el mismo (caso común, sin cambios visibles) o "Tickets: X, Y" si difieren. Columna "Ticket" nueva en el detalle del pedido del frontend, solo visible si aplica. |

## 13. Guía de facturación Arbet (`Guia_Desarrollo_Logica_Facturacion_Arbet.docx`) — revisión "de a poco"

Documento nuevo, pero **idéntico en contenido** al ya analizado en la
conversación (mismas reglas de zona/Cordón, Bolsa/Bulto, 2×1, unificados —
ver el repaso punto por punto ya hecho). Se revisa de a poco, no todo de
una — Leonardo pidió avanzar en bloques chicos en vez de encarar toda la
guía junta.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 13.1 | ~~Categoría de cliente (Pañales/Medicamentos/Ambos)~~ | ✅ Construido 2026-09-08 | Primer bloque: no existía forma de saber qué tipo de servicio maneja cada Cliente — dato que la guía asume implícito. Nuevo campo `Cliente.tipoServicio`, selector en el formulario, columna en el listado. Bella Vista ya cargado como "Ambos" (dato real, confirmado con Leonardo, no asumido). Sienta la base para lo que sigue (13.2, 13.3). |
| 13.2 | ~~Bolsa/Bulto para medicamentos~~ | ✅ Construido, probado (sintético) y deployado 2026-09-08 | `Producto.tipoEnvase` nuevo, `determinarClasificacionMedicamento` (Bolsa+Bulto → Bulto), `TarifaCliente` con dimensión tipoServicio+tipoEnvase. Probado contra la Neon real con datos "PR-\*" (no con un pedido real de medicamentos — sigue sin existir el importador, ver 13.5). |
| 13.3 | ~~Unificación entre Clientes distintos~~ | ✅ Construido, probado (sintético) y deployado 2026-09-08 | Nueva tabla `CombinacionUnificacionClientes` (habilitación explícita, administrable) + módulo `unificacion-cruzada.ts`. Cada cliente se factura por separado, solo su propia porción (con su propia tarifa/%) — **decisión no confirmada explícitamente por Leonardo, la más consistente con "una tarifa por cliente"**, a validar (ver 13.8). Bella Vista sigue sin necesitar esto (flujo interno, motor de un solo cliente). Probado con datos sintéticos "PR-CROSS-\*" contra la Neon real, en los dos órdenes de ejecución posibles (encontró y corrigió un bug real de orden — ver DOCUMENTO TECNICO.md historial). Falta probar con Farmaet real (bloqueado por 13.5). |
| 13.4 | ~~Cordón por partido (AMBA)~~ | ✅ Construido, verificado y deployado 2026-09-08 | Reemplazó del todo a "Cordón por zona de SimpliRoute" (**sacado completamente del sistema el mismo día** — ver DOCUMENTO TECNICO.md historial — esas zonas cruzan entre 5 y 9 partidos reales cada una, mal candidatas para un Cordón único). Mapeo **Partido → Cordón** con el dato real que dio el cliente final (28 partidos en Primer/Segundo/Tercer Cordón), reutilizando el `partido` que ya calculaba `clasificarCabaProvincia`. `resolverParaPedido` quedó en 3 pasos: CABA → Partido → Localidad. **"La Matanza" queda pendiente** (13.6) — cruza los 3 Cordones, no se puede resolver a nivel de partido entero. |
| 13.5 | 🔲 Dar de alta a Farmaet como Cliente + importador de medicamentos | Leonardo/Nosotros | Cliente real de medicamentos, mandó un Excel real en 2026-08-10 pero nunca se cargó como Cliente en el sistema, y no existe importador de medicamentos (que además necesita cargar `tipoEnvase` por línea, ver 13.2). La lógica de cálculo (13.2/13.3/13.7) ya está construida y probada con datos sintéticos — lo que falta es la parte de datos reales: alta del Cliente y el importador. |
| 13.6 | 🔲 "La Matanza" sin asignar a ningún Cordón | Leonardo/Cliente final | Cruza los 3 Cordones de forma transversal (distintas localidades del partido van a Cordones distintos) — no se puede resolver a nivel de partido entero como el resto. Falta que el cliente final defina, localidad por localidad dentro de La Matanza, a qué Cordón corresponde cada una (se cargarían en "Localidades por zona", que sigue funcionando como fallback más fino). Mientras tanto, un pedido en La Matanza queda sin zona tarifaria asignada — no se inventa un valor. |
| 13.7 | ~~% de entrega unificada configurable para pañal Y medicamento~~ | ✅ Construido, probado (sintético) y deployado 2026-09-08 | `PorcentajeSegundoServicio` ahora tiene `porcentajePanal`+`porcentajeMedicamento` (se eliminó `SERVICIO_AL_CIEN_POR_CIENTO_EN_UNIFICADA`, que fijaba pañales al 100%). Probado con datos sintéticos "PR-\*" contra la Neon real (unificación interna y cruzada, ambos porcentajes distintos de 100). |
| 13.8 | 🔲 Dos preguntas abiertas sobre la unificación entre clientes, no asumidas | Leonardo | (1) Se asumió que cada cliente en una unificación cruzada se factura por separado, solo por su propia porción (nunca un monto único repartido) — a confirmar si es lo esperado. (2) El documento Arbet menciona "% adicional de unificados para CABA y AMBA" (sugiere que el % podría variar por zona, no solo por cliente) — se implementó un solo % por cliente sin distinguir zona; a confirmar si hace falta más granularidad. |
| 13.9 | 🔲 Recargar tarifas y porcentajes reales | Leonardo | Se perdieron en el incidente de base de datos del 2026-09-08 (ver DOCUMENTO TECNICO.md historial) — son plata real, no se inventaron valores al reconstruir el resto (clientes, zonas, partidos). Hay que volver a cargarlos desde Facturación → Tarifas para poder generar una vista previa real. |
