# Reporte de Seguridad y Robustez — 2026-10-09

Solo análisis, nada aplicado. Si se decide actuar sobre algo de acá, va en una rama aparte — no se toca `develop`.

## Riesgo real: **5/10**

Fundamentos sólidos (contraseñas con argon2, JWT, roles por endpoint, Prisma sin SQL crudo, CORS acotado a un origen, borrado lógico + auditoría), pero con varios huecos típicos de una app que todavía está en fase de test camino a producción real — ninguno es grave hoy mismo (uso interno, autenticado, repo privado), pero conviene cerrarlos antes de que el volumen de uso o de datos crezca.

## Seguridad

- **Una contraseña real quedó commiteada en el historial de git.** `crear-usuario-qa.js` tuvo en texto plano la contraseña del usuario de prueba `qa-facturacion@mym.test` (todavía válida) en dos commits; se borró el archivo del repo pero **sigue recuperable con `git log -p`** porque el repo nunca se reescribió. Acción simple: rotar esa contraseña y no volver a commitear una real ni de prueba. (A propósito no repito acá el valor exacto, para no sumar otro lugar donde quede escrito.)
- **Sin rate limiting en `/auth/login`.** No hay `@nestjs/throttler` ni nada similar — no hay techo para intentos de fuerza bruta contra ningún usuario.
- **`axios` desactualizado en el frontend** (`^1.19.0`, resuelve literal a esa versión vieja) — tiene varios CVE reales ya parchados en versiones más nuevas (ReDoS, prototype pollution, bypass de proxy/redirects). Actualizar es de bajo riesgo y alto beneficio.
- **CVE crítico en `proxy-addr`** (vía Express, dependencia de NestJS) — spoofing de IP si la app llega a confiar en `req.ip`/`X-Forwarded-For` para algo de seguridad. Hoy no se usa así, pero es una trampa para el día que se agregue rate limiting o bloqueo por IP sin antes resolver esto.
- **Sin límite de tamaño en los archivos subidos** (`FileInterceptor` en Importar Excel, sin `limits`) — sumado a vulnerabilidades conocidas de `multer` (DoS por parsing), un archivo gigante o malformado puede colgar un request.
- **Sin `helmet`** (headers de seguridad HTTP) en la API — rápido de agregar, buena práctica estándar en Express/NestJS.
- `pnpm audit` marca 72 avisos en total, pero la mayoría (incluyendo todo lo de `fast-uri`/`undici`/`js-yaml`/`@modelcontextprotocol/sdk`) cuelga de `shadcn` — una herramienta de desarrollo que genera componentes, **no se empaqueta en la app que corre en producción**. No es ruido a ignorar del todo (vale actualizarla en algún momento) pero no es riesgo real hoy.

## Robustez para producción

- **Todo corre en free tier** (Render + Vercel + Neon) — se "duerme" tras inactividad (~50s el primer request). Ya anotado en `PENDIENTES.md` como paso previo a producción real.
- **Una sola base de datos compartida entre desarrollo y test** — no hay rama/DB separada para producción; cualquier prueba local pega contra los mismos datos reales.
- **Sin backups confirmados** — depende del plan de Neon; el free tier no da garantías serias de recuperación ante un borrado accidental masivo.
- **Pedidos tiene solo 2 índices** (`clienteId+estado+fechaProgramada` y `destinatarioId`) pero la grilla filtra por muchos más campos sin índice (chofer, zona, ruta, localidad, usuario importador, prioridad). No es problema al volumen de hoy, pero las consultas se van a poner lentas a medida que crezcan los datos sin que nadie lo note hasta que ya duela.
- **Sin monitoreo de errores en producción** (tipo Sentry) — hoy un error en vivo se descubre porque alguien lo reporta, no porque el sistema avisa.
- **Import de Excel es síncrono** — un archivo grande puede acercarse al timeout de request de un plan gratuito.
