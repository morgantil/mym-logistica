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
- Panel para choferes → fuera del MVP, arquitectura debe dejarlo agregable sin rediseñar (sección 6).
- Notificación al destinatario (SMS/WhatsApp) → confirmada como 2da etapa (sección 6), costo real ver sección 5.

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
10. Si SimpliRoute ya devuelve coordenadas geocodificadas (afecta sección 6 — evitaría pagar un servicio de geocoding aparte).

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

# 6. Historial de decisiones

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
