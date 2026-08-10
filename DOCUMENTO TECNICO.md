# DOCUMENTO TÉCNICO Y DE CONTROL
## Guía de arquitectura, decisiones y estado — MyM Logística (reconstrucción)

Este documento acompaña a `DOCUMENTO FUNCIONAL.md` (qué hace el sistema) y responde
**cómo se construye**. Se actualiza a medida que se toman decisiones. Cada ítem tiene un estado:

- 🟢 **Confirmado** — decidido, se construye así.
- 🟡 **Propuesto** — sugerido, falta que lo confirmes o lo rechaces.
- 🔴 **Pendiente de validación externa** — depende de algo fuera de nuestro control (ej. API de SimpliRoute).
- ⚪ **Descartado / fuera de alcance** — se consideró y se dejó afuera, a propósito.

---

# 1. Stack y arquitectura base

| Ítem | Decisión | Estado | Notas |
|---|---|---|---|
| Lenguaje | TypeScript (front y back) | 🟢 | Elegido por experiencia del equipo. |
| Backend | NestJS | 🟢 | Módulos + DI + interfaces desde el arranque. |
| Frontend | React + Vite, TanStack Table/Query, shadcn/ui | 🟢 | Diseño nuevo, no atado al look actual. |
| Base de datos | PostgreSQL | 🟢 | Integridad relacional para reglas de facturación. |
| ORM | Prisma | 🟢 | |
| Jobs asíncronos | BullMQ + Redis | 🟢 | Excel, sync SimpliRoute, facturación. |
| Monorepo | Turborepo (`apps/api`, `apps/web`, `packages/shared-types`) | 🟢 | Vive en subcarpeta `/app`, separado de la documentación en la raíz. |
| Idioma del código | Español (Cliente, Destinatario, Pedido, Entrega, Facturación...) para entidades, tablas y variables de dominio | 🟢 | Mismo vocabulario que el documento funcional, menos fricción con el negocio. Nombres técnicos genéricos (helpers, config) sí van en inglés. |
| Base de datos en desarrollo | Neon Postgres (free tier), usada también desde el entorno local | 🟢 | Permite demos sin depender de dónde corra el backend en el momento. |
| Alcance de tenant | Single-tenant para este cliente, `tenant_id` reservado en esquema | 🟢 | Puerta abierta a reventa futura sin reescribir. |
| Arquitectura interna | Hexagonal/Clean por módulo (`domain / application / infrastructure / interface`) | 🟢 | Motor de facturación como dominio puro, sin dependencias de framework. |
| Despliegue | A definir — PaaS (Railway/Render) es aceptable si se prioriza cero mantenimiento sobre el ahorro de $10-25/mes | 🔴 | Se retoma cuando la app funcional esté construida. VPS+Coolify queda como alternativa más barata si en ese momento se prefiere ahorrar. |
| Dominio front/API | Mismo dominio raíz para `app.` y `api.` (ej. `app.mym.com.ar` / `api.mym.com.ar`) | 🟡 propuesto | Simplifica la cookie de sesión a `SameSite=Lax` sin la complejidad extra de `SameSite=None` entre dominios distintos. Se confirma junto con la decisión de despliegue. |
| CI/CD, staging | A definir | 🔴 | Idem. Se escriben tests igual, sin depender de esta decisión. |

---

# 2. Reglas transversales de plataforma

| Regla | Decisión | Estado | Notas |
|---|---|---|---|
| Borrado lógico | Ninguna tabla borra físicamente. `deletedAt` / `deletedBy` en toda entidad, filtrado por defecto, restaurable por admin. | 🟢 | |
| Auditoría universal | Interceptor genérico: usuario + timestamp + valor anterior/nuevo en cada mutación de cada módulo (no solo los campos del §34 funcional). | 🟢 | |
| Autenticación | Login propio (email/password, Argon2) **y** Google OAuth, misma tabla de usuarios. | 🟢 | |
| Autorización | Roles del §33 funcional: Operaciones, Logística, Administración, Facturación. Un usuario puede tener más de un rol asignado a la vez (ej. alguien que hace Logística y Facturación). | 🟢 | Se modela como relación N a N `usuario_rol`, no como campo único. |
| `createdBy` / `updatedBy` | En toda entidad, no solo en las auditadas explícitamente. | 🟢 | Consecuencia directa de la auditoría universal. |
| Bloqueo optimista de edición | Todo registro editable (empezando por Pedido) lleva versión; si dos usuarios lo abren a la vez, el segundo que guarda recibe aviso de conflicto en vez de pisar en silencio. | 🟢 | Confirmado para el MVP. |
| Permisos por cliente | Un usuario puede estar restringido a ver/operar solo ciertos clientes (farmacias). Un administrador define qué clientes ve cada usuario. | 🟢 | Capa adicional sobre el rol, no lo reemplaza. Requiere tabla `usuario_cliente` (N a N). |
| Granularidad de permisos | Alcanza con combinar los 4 roles predefinidos (§33 funcional). No hace falta permisos "a la carta" dentro de cada rol para el MVP. | 🟢 | Se puede refinar más adelante si hace falta sin romper el modelo (los roles ya son N a N). |
| Vista previa de facturación | Antes de confirmar en firme una liquidación mensual, el usuario de Facturación puede ver una simulación editable del cálculo (2×1, unificaciones, tarifas) y volver a calcular si algo no cierra. Solo al confirmar queda en firme y auditado. | 🟢 | Reduce el riesgo de errores en plata real dado lo intrincado de las reglas (§21-§28 funcional). |
| Almacenamiento del token de sesión (frontend) | **Access token en memoria** (nunca a disco) + **refresh token en cookie `httpOnly` + `Secure` + `SameSite`**. Nunca `localStorage`. | 🟢 | Con roles que ven plata real (Administración/Facturación), no se arriesga a exposición por XSS. Requiere ajustar `/auth/login` y `/auth/refresh` para setear/leer la cookie en vez de devolver el refresh token en el body JSON — pendiente, es chico. |
| Revocación de sesiones | Se guarda (hash del) refresh token en una tabla chica, chequeada en el mismo refresh que ya consulta al usuario — permite cerrar sesión de verdad al desactivar un usuario o forzar "cerrar sesión en todos los dispositivos". | 🟢 | Costo marginal ~cero: ya se toca la base en cada refresh para releer roles/estado del usuario. Sin esto, un JWT robado sigue siendo válido hasta que expira solo (hasta 7 días). |
| Caché de la futura PWA | El service worker (cuando exista) cachea solo assets estáticos (JS/CSS/íconos) — **nunca** respuestas de la API. | 🟢 | Un celular perdido/robado no debería tener facturación cacheada en el dispositivo. Gratis de hacer bien si se configura desde el principio. |

---

# 3. Candidatas a agregar — necesitan tu decisión

Esto es lo que identifiqué como huecos o riesgos que el documento funcional no cubre explícitamente.
Para cada una, decime: **sí / no / después**.

| # | Candidata | Por qué importa | Estado |
|---|---|---|---|
| 1 | 2FA para roles Administración y Facturación | Confirmado como 2da etapa — no bloquea el MVP. | 🟡 2da etapa |
| 2 | Reseteo de contraseña | Confirmado: un admin lo resetea manualmente para el MVP (equipo interno chico). Self-service por email queda para después. | 🟢 |
| 3 | Bloqueo por intentos fallidos de login | Confirmado como 2da etapa — no bloquea el MVP. | 🟡 2da etapa |
| 4 | Webhook vs. polling para estados de SimpliRoute | Afecta la arquitectura del módulo de integración (§36.10 del funcional lo deja pendiente). | 🔴 depende de la API |
| 5 | Almacenamiento de archivos | Confirmado: Cloudflare R2 (free tier). Alcanza con guardar Excels importados y reportes mensuales exportados — remitos/etiquetas están fuera del alcance de la 1ra etapa (§3 funcional), no hace falta storage para eso todavía. | 🟢 |
| 6 | Dashboard / KPIs (más allá del reporte mensual del §31) | Confirmado: los endpoints de agregación (BE) se diseñan desde ahora aunque la pantalla (FE) espere, para no retocar el modelo de datos después. | 🟢 endpoints ahora, pantalla después |
| 7 | Multi-idioma | No hay indicio de necesitarlo. | ⚪ propuesto descartar |

**Ya resueltas en esta ronda** (movidas a su sección definitiva):

- Bloqueo de edición concurrente → confirmado, sección 2.
- Permisos por cliente → confirmado, sección 2.
- Granularidad de permisos → confirmado (alcanza con roles combinables), sección 2.
- Vista previa de facturación → confirmado, sección 2.
- Panel para choferes → fuera del MVP, arquitectura debe dejarlo agregable sin rediseñar (sección 7).
- Notificación al destinatario (SMS/WhatsApp) → confirmada como 2da etapa (sección 7), costo real ver sección 5.

**Quedan solo dos ítems abiertos**: almacenamiento de archivos (#5) y dashboard/KPIs (#6) — de menor riesgo, se pueden resolver más adelante sin bloquear nada. Multi-idioma (#7) queda descartado.

---

# 4. Validaciones técnicas pendientes (heredadas del documento funcional §36)

Estas siguen abiertas y bloquean el diseño final del módulo SimpliRoute — no son decisiones nuestras, dependen de la API:

1. API disponible de SimpliRoute y método de autenticación.
2. Consulta de destinatarios por número de afiliado.
3. Datos que devuelve SimpliRoute por destinatario.
4. Obtención de zonas y relación zona/chofer.
5. Envío de cantidad de bultos.
6. Creación de destinatarios nuevos vía API.
7. Actualización de domicilios vía API.
8. Estados disponibles y su equivalencia con los estados propios (§19 funcional).
9. Webhook vs. polling para sincronización de estados.
10. Si SimpliRoute ya devuelve coordenadas geocodificadas (afecta sección 7 — evitaría pagar un servicio de geocoding aparte).

**Mientras esto no se resuelva**, el módulo `simpliroute/` se construye contra un mock que respeta el contrato esperado, para no bloquear el resto del desarrollo.

---

# 5. Consideraciones económicas

Principio: ahorrar en infraestructura usando tiers gratuitos de **servicios administrados** de buena
reputación (te dan backups, parches de seguridad y TLS incluidos) en vez de auto-hostear todo a mano
para ahorrar los últimos dólares. Todo lo elegido es open-source o S3-compatible → sin lock-in, migrar
después es cambiar una variable de entorno, no rediseñar.

| Componente | Opción low-cost | Costo aprox. | Trade-off | Estado |
|---|---|---|---|---|
| Cómputo (app) | VPS Hetzner (~$5-6/mes) + Coolify (open-source, gratis) | $5–6/mes | Vos "tenés" el VPS pero Coolify hace deploy/SSL/restart automático — punto medio entre VPS puro y PaaS pago. | 🟡 propuesto, a confirmar |
| Base de datos | Neon Postgres (free tier) | $0 al inicio | Se prioriza seguridad de los datos (backups automáticos) por sobre ahorrar los $5-6/mes de tenerlo en el mismo VPS. | 🟡 propuesto, a confirmar |
| Redis (colas) | Auto-hosteado en el mismo VPS (vía Coolify) | $0 extra | Perder datos de cola no es grave — se puede reprocesar. | 🟡 propuesto, a confirmar |
| Archivos (Excels, remitos, etiquetas) | Cloudflare R2 | ~$0 | S3-compatible, sin costo de egreso. | 🟡 |
| Monitoreo de errores | Sentry free tier | $0 | Suficiente para MVP. | 🟡 |
| Emails (reset password, alertas) | Resend free tier | $0 | Hasta 3000/mes. | 🟡 |
| Dominio + SSL | Dominio propio + Let's Encrypt | ~$1/mes | SSL siempre gratis. | 🟡 |
| WhatsApp/SMS a destinatarios (2da etapa) | Twilio / WhatsApp Business API | Variable, por mensaje | Costo real e ineludible el día que se active esa feature. | 🔴 presupuestar cuando se active |
| Geocoding (dirección → coordenadas) | A confirmar | Potencialmente $0 | §9 del funcional dice que SimpliRoute ya devuelve coordenadas — si es así, no hace falta pagar geocoding aparte. | 🔴 depende de SimpliRoute |

**Estimado total del MVP: entre $0 y ~$25/mes.**

---

# 6. Frontend — arquitectura y principios de diseño

## 6.1 Stack y estructura

| Ítem | Decisión | Estado | Notas |
|---|---|---|---|
| Framework | React + Vite + TypeScript | 🟢 | `apps/web` dentro del monorepo Turborepo, junto a `apps/api`. |
| Estilos | Tailwind CSS | 🟢 | |
| Componentes | shadcn/ui (Radix + Tailwind, componentes copiados al repo, no una librería cerrada en `node_modules`) | 🟢 | Se instala solo lo que se usa; queda como código propio, fácil de ajustar sin pelear contra overrides de una librería de terceros. |
| Data fetching / cache | TanStack Query | 🟢 | Reemplaza estado manual de loading/error/cache para las llamadas a la API. |
| Tablas | TanStack Table | 🟢 | Para la grilla de Pedidos (§16-18 funcional): paginación, orden y filtros sobre datos ya paginados por el backend. |
| Ruteo | React Router | 🟢 | Rutas protegidas por sesión + rol donde aplique. |
| Sesión (mitad frontend) | Access token en memoria (estado de React, nunca `localStorage`) + refresh automático contra `/auth/refresh` (manda la cookie httpOnly sola) al arrancar la app y ante un 401. | 🟢 | La mitad backend de esta decisión ya estaba implementada (sección 2) antes de arrancar el frontend. |

## 6.2 Principios de diseño (pedido explícito del cliente, 2026-08-10)

Público real de la app: personal administrativo de MyM, perfil no técnico, incluye usuarios de +50 años.
Se prioriza claridad sobre impacto visual:

- Nada oculto: sin menús que solo aparecen al hacer hover, sin iconos sin texto en acciones importantes,
  sin tooltips como única explicación de algo.
- Contraste y tamaño de texto altos por defecto (base 16-18px), espaciado generoso, foco de teclado
  siempre visible, objetivos de click/tap grandes.
- Paleta acotada (2-3 colores), profesional. Sin identidad de marca definida todavía → se arranca con la
  base de shadcn/ui y se ajusta el día que haya logo/colores de MyM.
- Minimalista pero nunca vacío de información: cada pantalla comunica su estado (vacío, error, cargando)
  en texto simple, sin iconografía ambigua como único indicador.
- Se usa como guía el plugin/skill `frontend-design` de Anthropic (habilitado en `.claude/settings.json`,
  instalado 2026-08-10), pero adaptado a este público: acá se prioriza legibilidad y previsibilidad por
  sobre el "riesgo estético deliberado" que ese skill sugiere para sitios de marca/marketing.

## 6.3 Autenticación en el frontend

- Al cargar la app: intento silencioso de `POST /auth/refresh` (la cookie va sola) para restaurar sesión
  sin pedir login de nuevo si todavía es válida.
- Login: `POST /auth/login` guarda el `accessToken` en memoria (contexto de React); la cookie la setea
  el backend, el frontend nunca la toca directamente.
- Cada request autenticado manda `Authorization: Bearer <accessToken>`. Un 401 dispara un refresh
  automático y un reintento único; si el refresh también falla, se manda a Login.
- Logout: `POST /auth/logout` + limpieza del estado en memoria.
- Google OAuth: `/auth/google/callback` ahora redirige de vuelta al frontend con el `accessToken` en el
  fragment de la URL (antes devolvía JSON crudo — era un TODO explícito en el código para "cuando exista
  apps/web", ver historial).

## 6.4 Notas técnicas del stack (surgidas al construir, no decisiones de negocio)

- **`@mym/shared-types` compila dual CJS/ESM.** El backend (Nest) necesita CommonJS; Vite en modo
  desarrollo sirve ESM nativo al navegador y no puede reexportar nombres de un paquete workspace
  compilado solo en CJS (no lo pre-empaqueta como sí hace con dependencias normales de npm). Se agregó
  un segundo build (`tsconfig.esm.json` → `dist/esm/`, con su propio `package.json` de
  `{"type":"module"}`) y un `exports` map en `package.json` (`import` → ESM, `require` → CJS). Cambia
  cómo se buildea el paquete, no su contenido.
- **TanStack Table se usa en modo "legacy" (`@tanstack/react-table/legacy`).** La versión instalada (9.x)
  trae una API nueva (`useTable`/`Subscribe`) que rompe con la v8 que se conocía al decidir el stack —
  se optó por el modo de compatibilidad v8 que la propia librería ofrece (`useLegacyTable`,
  `getCoreRowModel`, etc.), más estable y documentado, en vez de adoptar la API experimental para una
  pantalla que usa personal no técnico a diario. Revisar si migrar cuando la v9 madure.

---

# 7. Historial de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-08-09 | Reemplazo total del sistema actual (greenfield), no convive con mym.7ward.com | Decisión del cliente. |
| 2026-08-09 | Node.js/TypeScript como lenguaje base | Experiencia del equipo. |
| 2026-08-09 | Single-tenant ahora, arquitectura lista para multi-tenant después | Priorizar velocidad sin cerrar la puerta a reventa futura. |
| 2026-08-09 | Diseño visual nuevo, sin atarse al look actual | Decisión del cliente. |
| 2026-08-09 | Borrado lógico + auditoría universal + login dual (propio y Google) | Requisito explícito del cliente. |
| 2026-08-09 | Bloqueo optimista de edición confirmado para el MVP | Riesgo real: Operaciones y Logística editan el mismo pedido. |
| 2026-08-09 | Permisos por cliente confirmados (admin define qué clientes ve cada usuario) | Necesidad real del cliente, se suma como capa sobre los roles. |
| 2026-08-09 | Panel para choferes: fuera del MVP, pero arquitectura debe dejarlo agregable | Hoy lo resuelve SimpliRoute; a futuro puede hacer falta uno propio. |
| 2026-08-09 | Notificación al destinatario (SMS/WhatsApp): confirmada como 2da etapa | Valiosa pero no bloquea el MVP. |
| 2026-08-09 | Ahorro de infra vía tiers gratuitos de servicios administrados, no auto-hosteo total | Evitar costos sin resignar seguridad/rendimiento; equipo chico no tiene tiempo para ser su propio DBA/sysadmin. |
| 2026-08-09 | Despliegue: PaaS aceptable, decisión final pendiente hasta tener la app construida | Prioriza cero mantenimiento sobre el ahorro de $10-25/mes; queda VPS+Coolify como alternativa. |
| 2026-08-09 | Roles combinables (N a N) sin permisos "a la carta" para el MVP | Alcanza con combinar los 4 roles del §33 funcional; se puede refinar después. |
| 2026-08-09 | 2FA para Administración/Facturación: 2da etapa, no bloquea el MVP | Decisión del cliente. |
| 2026-08-09 | Vista previa/simulación editable antes de confirmar una liquidación en firme | Reduce riesgo de error en plata real dado lo intrincado de las reglas de facturación. |
| 2026-08-09 | Bloqueo por intentos fallidos de login: 2da etapa, no bloquea el MVP | Decisión del cliente. |
| 2026-08-09 | Código en subcarpeta `/app`, español para vocabulario de dominio, Neon como DB desde desarrollo | Separar docs de código; menos fricción de negocio; permitir demos sin depender de dónde corra el backend. |
| 2026-08-09 | Reset de contraseña: admin manual para el MVP | Equipo interno chico, no justifica el flujo self-service todavía. |
| 2026-08-09 | Endpoints de dashboard/KPIs se diseñan desde el arranque del BE, pantalla FE queda para después | Evitar tener que retocar el modelo de datos más adelante. |
| 2026-08-09 | Scaffold inicial del backend creado en `/app` (monorepo, Prisma, auth, módulos de clientes/destinatarios/pedidos/zonas-choferes/simpliroute mock/dashboard). Compila y bootea correctamente. `importadores/` y `facturacion/` quedan documentados pero sin implementar — ver README de cada carpeta. | Arrancar hoy con el BE, según lo pedido. Ver `/app/README.md` para levantar el entorno. |
| 2026-08-09 | Base de datos Neon creada y conectada. 14 tablas migradas. Repo Git inicializado en la raíz (sin commits todavía) con `.gitignore` verificado. Probado end-to-end vía HTTP contra la base real (`POST /auth/login`). | El proyecto queda con backend, base de datos y control de versiones operativos. |
| 2026-08-09 | Primer commit hecho sobre rama `develop` (no `master`/`main`) | Pedido explícito del cliente — se retoma una rama estable cuando haya un primer release. |
| 2026-08-09 | Importador de Excel: mapeo de columnas **genérico y data-driven**, no un parser hardcodeado por cliente/formato | Los Excel cambian según el cliente y no hay que "casarse" con la marca/estructura de ninguno — un cliente nuevo con un formato distinto no debe requerir código nuevo ni deploy. Se resuelve con: (1) diccionario de sinónimos por campo canónico para auto-mapear encabezados, (2) si algo no matchea, el usuario lo confirma una sola vez, (3) el mapeo confirmado queda guardado por cliente (`PerfilImportacion`) y se reusa automáticamente después. |
| 2026-08-09 | Módulo `importadores` implementado end-to-end (lectura de Excel, detección/mapeo, agrupación, padrón, creación de pedidos) y conectado a Neon. 15 tests unitarios sobre las funciones puras más riesgosas — encontraron y permitieron corregir un bug real de normalización de espacios en la agrupación de pedidos (§7). Etapa 1 del §38 funcional queda funcionalmente completa a nivel backend, pendiente de probarse contra los 3 Excel reales y de conectar storage en R2. | Bajar el riesgo del módulo más nuevo con tests antes de darlo por "hecho", no después. |
| 2026-08-09 | SimpliRoute (mock) y zonas/choferes conectados al flujo de creación de pedidos: por cada pedido se consulta destinatario (§9-§10), se intenta resolver zona vía SimpliRoute con fallback por localidad (§12), y se asigna chofer (§13). Con el mock, todo cae hoy en "no encontrado"/"sin identificar"/"sin asignar" — es el comportamiento correcto mientras la API real no esté validada (§36), no un placeholder falso. El plumbing queda listo para funcionar solo el día que se conecte el adapter real. | Dejar la arquitectura de integración lista sin fingir una resolución de zona que el propio documento funcional marca como pendiente de validar. |
| 2026-08-09 | Hallazgo en las capturas del sistema actual: existe un catálogo real de Localidades (8135 filas) con flag "Es CABA" y transporte asignado por localidad. | Detectado al revisar las capturas de referencia. |
| 2026-08-09 | `Zona` se mantiene como entidad separada, configurada a mano por el cliente (no atada a divisiones administrativas oficiales) | Decisión explícita: la asignación de chofer por zona es una decisión operativa propia, no algo que se pueda derivar de datos públicos. |
| 2026-08-09 | Clasificación CABA/Provincia resuelta con la **API oficial y gratuita de datos.gob.ar** (`georef-ar-api`, `apis.datos.gob.ar/georef/api/direcciones`) en vez de pedirle al cliente el catálogo de Localidades. Módulo nuevo `geografia/` con `NormalizadorDireccionesPort` + adapter. Validado en vivo contra la API real (no asumido): una calle+altura sola puede ser ambigua a nivel país (ej. "Rivadavia 100" matcheó en 341 lugares), así que el adapter descarta cualquier resultado cuya provincia no sea CABA o Buenos Aires en vez de confiar en un match posiblemente erróneo — nunca "inventa" una clasificación. Se conecta al pipeline de importación: cada pedido nuevo llega con `cabaProvincia` ya resuelto. | "Tenemos que ser mejores que lo que hay" — no depender del cliente para algo que un dato público y siempre actualizado resuelve mejor que una tabla cargada a mano. |
| 2026-08-09 | `PREGUNTAS_FACTURACION.pdf` bajó de 3 a 2 preguntas — la de CABA/Provincia ya no hace falta. | Consecuencia directa de la decisión anterior. |
| 2026-08-09 | Etapa 3 implementada: `PATCH /pedidos/:id/bultos` (§16, con bloqueo optimista real — primer uso concreto de `version`), `GET /pedidos/revision` (§17, motivos bloqueantes por pedido) y `POST /pedidos/enviar-simpliroute` (§18, envío masivo donde un pedido fallido no frena a los demás). Se agregó un filtro global que traduce el conflicto de versión a HTTP 409. 6 tests nuevos sobre `validarPedidoParaEnvio`. Backend de las Etapas 1-3 del §38 funcional queda funcionalmente completo; falta Facturación (Etapa 4) y probar todo con datos/API reales. | Cerrar el ciclo operativo completo (importar → revisar → enviar) antes de pasar a facturación. |
| 2026-08-10 | Sesión de pausa/charla sobre Frontend (sin código): confirmado que un front web y una app mobile son viables sobre la misma API sin cambios; PWA elegida como camino a mobile sin pasar por app stores; token de sesión: access en memoria + refresh en cookie `httpOnly`/`Secure`/`SameSite` (nunca `localStorage`); se suma revocación real de sesiones (tabla de refresh tokens, costo marginal ~cero); front y API deberían quedar bajo el mismo dominio raíz cuando se decida el despliegue; el service worker de la futura PWA solo cachea assets estáticos, nunca respuestas de API. Nada de esto implementado todavía — queda anotado para cuando arranque el frontend. | El cliente pidió explícitamente "dejemos todo anotado siempre" — decisiones de una charla de planeamiento no se pierden aunque no se hayan construido. |
| 2026-08-10 | **Implementado** lo de la charla anterior: `SesionRefreshToken` (hash SHA-256 del refresh token, nunca en texto plano), `cookie-parser` conectado, `/auth/login`, `/auth/google/callback` y `/auth/refresh` ahora setean/leen el refresh token como cookie `httpOnly`+`Secure` (solo en prod)+`SameSite=Lax`, restringida al path `/auth`. El body de esas respuestas solo trae el `accessToken`. Rotación en cada refresh (el token usado queda revocado, se emite uno nuevo) y `POST /auth/logout` nuevo (público, revoca por cookie, no depende de que el access token siga vigente). Probado end-to-end contra Neon real con un usuario de prueba: login → cookie seteada → refresh rota → logout revoca → refresh posterior ya sin sesión válida. 2 tests nuevos (`parseDuracionAMs`). Bug encontrado y corregido en el camino: `/auth/logout` había quedado sin `@Publico()`, exigía un access token vigente para poder cerrar sesión. | Pedido explícito del cliente ("hagamos eso del back") después de la charla de la sesión anterior — se pasó de "anotado" a "construido". |
| 2026-08-10 | Commit `d1caaf9` sobre el trabajo de rotación/revocación de sesiones (quedaba sin commitear desde la entrada anterior), antes de arrancar el frontend. Arranque del frontend confirmado con Leonardo: primer flujo a construir es **Login + shell de la app** (no la grilla de Pedidos ni el importador todavía). Stack y principios de diseño quedaron formalizados en la nueva sección 6 de este documento — ver ahí el detalle completo (incluye el pedido explícito de una UI clara/sin elementos ocultos, pensada para personal administrativo no técnico, con usuarios de +50 años). | El cliente pidió explícitamente que esto quedara documentado como "traza" antes de escribir código, no solo en el chat. |
| 2026-08-10 | **Implementado** el arranque del frontend: `apps/web` (Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui preset Nova + TanStack Query/Table + React Router + Axios). Paleta ajustada del preset default (gris puro) a un azul profesional como color de acción (`--primary`/`--ring`), base tipográfica subida a 17px, foco de teclado siempre visible — ver sección 6.2. Cliente API con access token en memoria, interceptor de refresh automático ante 401 (con deduplicación de refreshes en paralelo) y limpieza de sesión si el refresh también falla. Pantalla de Login (email/password + Google, mostrar/ocultar contraseña) y shell de la app (nav lateral siempre visible sin hamburguesa, menú de usuario, logout) construidos y probados end-to-end contra el backend real: login → `/auth/perfil` → refresh silencioso al recargar → logout → refresh posterior ya rechazado. Corregido de paso el TODO pendiente en `auth.controller.ts`: `/auth/google/callback` ahora redirige a `FRONTEND_URL/auth/callback#accessToken=...` en vez de devolver JSON crudo (nueva config `frontendUrl`, default `http://localhost:5173`). Nav incluye placeholders "Esta pantalla todavía no está construida" para Pedidos/Importar/Clientes/Zonas/Facturación — nada roto ni oculto, cada ítem del menú comunica su estado real. **No probado en navegador real** (sin herramienta de automatización de browser disponible en esta sesión) — sí verificado: typecheck limpio, build de producción sin errores, y el flujo completo de auth contra la API real vía HTTP. | Seguir el plan acordado con Leonardo (pregunta de arranque de esta sesión) y dejar registro de cada decisión de diseño/arquitectura tomada en el camino, no solo el resultado final. |
| 2026-08-10 | **Implementada** la pantalla de Pedidos (§14-18 funcional), segundo flujo de frontend elegido por Leonardo tras confirmar el % de avance. Backend extendido primero: `GET /pedidos` y `GET /pedidos/revision` no traían nombre de cliente/destinatario/zona/chofer ni productos (solo IDs) — se agregó el tipo `PedidoListado` (domain/pedido.ts) y los `include` correspondientes en el repositorio Prisma, sin tocar el `Pedido` base que usa `validarPedidoParaEnvio`. Frontend: grilla con las 14 columnas sugeridas por el §14 (paginación server-side de a 20, filtro por estado), edición de bultos inline con guardado explícito (rol Logística/Administración) que maneja el 409 de bloqueo optimista mostrando el mensaje del backend, detalle de pedido en panel lateral (§15, productos + total), y pestaña de Revisión antes de enviar (§17) con selección masiva y envío a SimpliRoute (§18, rol Operaciones/Administración) que informa enviados vs. errores sin que uno frene al resto. Probado end-to-end contra Neon real con 2 pedidos de prueba creados a mano (uno completo, uno con datos faltantes): bultos con 409 real, revisión detectando los 4 motivos bloqueantes esperados, envío fallando correctamente por falta de `simplirouteId` en el destinatario (comportamiento correcto, no bug — SimpliRoute sigue en mock). Dos ajustes técnicos no relacionados con negocio quedaron documentados en la sección 6.4: build dual CJS/ESM de `@mym/shared-types` (Vite dev no podía importar sus named exports) y uso del modo "legacy" de TanStack Table v9 (la API nueva de esa versión es incompatible con lo que se conocía al decidir el stack). | Seguir el orden de prioridad que Leonardo confirmó ("Pedidos" era la segunda opción ofrecida al arrancar el frontend) — es la pantalla de uso diario del equipo. |
| 2026-08-10 | **Implementada** la pantalla de Importar Excel (§4-§8, §11 funcional), tercer flujo de frontend. Sin cambios de backend — el módulo `importadores/` ya exponía todo lo necesario (`POST /importaciones` con `archivo` + `clienteId` opcional multipart, `POST /importaciones/confirmar-mapeo`). Frontend en `apps/web/src/features/importar/`: subida de archivo con cliente opcional (se detecta solo por nombre de archivo si no se indica), y manejo de los 3 estados posibles de la respuesta como pasos de un mismo flujo en una sola pantalla (nada de wizard con rutas separadas): `requiereSeleccionCliente` (el nombre del archivo no lo identificó), `requiereMapeoManual` (formulario para indicar qué columna del Excel corresponde a cada campo obligatorio faltante — la lista de campos obligatorios la manda el backend, no está duplicada en el front) y `completada` (resumen con pedidos creados, alertas de dirección distinta al padrón, y tabla de filas con error si las hubo). Probado end-to-end contra Neon real con 3 Excels de prueba generados a mano (no los 3 reales del cliente, que siguen sin llegar — ver README del módulo): mapeo automático completo, cliente no detectable por nombre, y mapeo manual completo incluyendo que el perfil quedó guardado y la segunda importación del mismo cliente ya no lo volvió a pedir. | Completar el ciclo operativo principal del frontend (importar → revisar pedidos → enviar) que ya tenía Pedidos construido. |
| 2026-08-10 | **Respuesta recibida a la Pregunta 2 de `PREGUNTAS_FACTURACION.pdf`** (§22 funcional, "¿con qué fecha agrupamos los pedidos de un mismo viaje?"): los pedidos se arman de un día para el otro, así que la fecha que viene en el Excel (`fechaProgramada`) **es** la fecha de entrega real — no hay diferencia práctica entre "fecha programada" y "fecha de entrega efectiva" en el flujo real de operación. Confirma la propuesta que ya estaba planteada por defecto: agrupar por `fechaProgramada`, sin necesidad de trackear una fecha de entrega efectiva distinta para este cálculo. Sigue pendiente la Pregunta 1 (qué servicio se cobra 100% en una entrega unificada, §36.16 funcional) — la única que queda sin responder de las dos. Leonardo mencionó además que existe una carpeta de Drive con los 3 Excel reales pedidos para el importador (§4 README de `importadores/`) — todavía no se compartió el link/archivos en la sesión, queda pendiente para cuando los pase. | El cliente final ya contestó vía Leonardo; deja el motor de facturación (Etapa 4) con una duda menos antes de poder arrancarlo. |
| 2026-08-10 | **Prueba de fuego real del importador**: apareció localmente la carpeta de Drive mencionada arriba (`drive /` en la raíz — agregada a `.gitignore`, tiene datos reales de pacientes/OSDE, nunca se commitea). Se corrieron los 3 Excel reales de pañales (Biosíntesis, Bella Vista, Farmapal — misma estructura de columnas en los tres) contra Neon: **207 pedidos creados, 0 filas con error**. En el camino aparecieron y se corrigieron dos gaps reales que el diccionario/parser sintéticos no cubrían: (1) 6 encabezados reales sin sinónimo conocido (`Nro de afiliado CSV`, `REFERENCIA`, `Fecha de Entrega + Observac`, `Nro de telefono`, `Nro de tkt` de Farmapal) — sumados a `DICCIONARIO_SINONIMOS`, ahora los 3 clientes mapean el 100% de las columnas solos; (2) la celda de fecha trae la fecha **y** una nota de entrega pegadas en el mismo texto (ej. `"2026-08-06 UF03 PIDE QUE INGRESE"`, `"2026-08-06//FARMAPAL"`) — con el parser anterior esto rechazaba prácticamente todas las filas como "fecha inválida". `transformarFila` ahora extrae la fecha del inicio del texto (regex `^\d{4}-\d{2}-\d{2}`) y guarda el resto como nota — decisión confirmada con Leonardo: la nota se guarda en `Pedido.observaciones` en vez de descartarse, porque son instrucciones de entrega reales ("pide que ingrese al lote 48", etc.), no ruido. 2 tests nuevos sobre el parser. Los 2 Excel de medicamentos que llegaron junto con los de pañales (Bella Vista, Farmaet) quedan sin tocar — estructura de columnas distinta, Etapa 2 (medicamentos) no arrancó — ver README de `importadores/`. Antes de esta prueba se limpiaron de Neon los clientes/pedidos/perfiles sintéticos usados para probar Pedidos e Importar Excel en las entradas anteriores. | Leonardo confirmó explícitamente (a) guardar la nota de fecha como observación y (b) importar los 3 reales a Neon en vez de solo validar en memoria — era la validación real que el módulo tenía pendiente desde que se construyó (2026-08-09). |
