# TEMAS PENDIENTES — vista consolidada de todo lo que falta

Última actualización: **2026-09-02**. Documento vivo, separado de `PENDIENTES.md`
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
| 1.2 | Combinaciones habilitadas de entrega unificada | Nosotros, cargar como configuración | Farmaet↔Biosíntesis/Farmapal; Bella Vista medicamentos↔OSDE Bella Vista pañales/Previvax. Dato de configuración — falta cargarlo cuando arranque Etapa 2. |
| 1.3 | Concepto "Subcliente" (Bulto/Bolsa por cliente) | Nosotros, cuando arranque Etapa 2 | No existe en el schema. No bloquea nada hoy. |
| 1.4 | Cargar las localidades reales en "Localidades por zona" — **o** el atajo nuevo | Leonardo / Cliente final | Construido 2026-08-26: alternativa a cargar cientos de localidades — mapear directo las 11 zonas reales de SimpliRoute a un Cordón (`Facturación → Zonas tarifarias → "Cordón por zona de SimpliRoute"`), mucho menos trabajo. Falta que Leonardo/cliente final confirme que esas 11 zonas (dibujadas para logística) representan bien los Cordones de facturación, y las asigne. El mapeo por localidad sigue existiendo como fallback si una zona no está mapeada o el destinatario no tiene coordenadas. |

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
| 11.1 | ~~Medir y corregir el impacto en liquidación a transportistas cuando la dirección del afiliado en SimpliRoute está desactualizada~~ | ✅ Construido (backend) | `PedidosService.enviarASimpliRoute` recalcula zona/chofer con la coordenada real que SimpliRoute devuelve al geocodificar la Visita (antes se descartaba) y corrige `zonaId`/`choferId` si da distinto al asignado antes de enviar, dejando snapshot del valor anterior (`zonaPreEnvioId`/`choferPreEnvioId`, etc.) para poder medir cuántas veces pasó. No bloquea el envío — la entrega en sí ya llegaba bien igual (usa siempre la dirección del Excel, no la de SimpliRoute). **No deployado todavía** (pedido explícito de Leonardo, "tenemos otro"). |
| 11.2 | ~~Alerta visible en el frontend para baja confianza de geocodificación~~ | ✅ Construido | Decisión explícita de Leonardo: **solo** la alarma de `geocode_alert` (SimpliRoute sin confianza al geolocalizar la dirección del Excel — riesgo real de mandar al chofer a cualquier lado), no las otras dos. Solo fondo, sin frase: fila de la grilla en ámbar (`bg-amber-50 dark:bg-amber-500/10`) cuando `geocodeAlert` no es null y no es `"no alert"`. Verificado en navegador real (claro y oscuro) con datos de prueba sembrados directo en la base y borrados después. |
| 11.3 | ~~Medición retroactiva sobre pedidos ya enviados antes de este cambio~~ | No hace falta | Decisión de Leonardo: no se envió ningún pedido real todavía con este problema — el ambiente sigue en test, nunca se pasó a producción, no hay impacto real que medir hacia atrás. |
