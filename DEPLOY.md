# DEPLOY — cómo está desplegado y cómo volver a hacerlo

Última actualización: **2026-09-01**. Cubre el ambiente de **test** (gratuito,
para demos). El de **producción real** todavía no existe — cuando se arme, es
un proyecto nuevo en Render/Vercel/Neon (branch separada), no "ascender" este.
Ver `PENDIENTES.md` para el estado de esa decisión.

## URLs actuales (test)

| Qué | URL |
|---|---|
| Frontend | https://mym-web-pi.vercel.app |
| Backend / API | https://mym-n7bh.onrender.com |
| Repo | https://github.com/morgantil/mym-logistica (privado, rama `develop`) |

Usuario de prueba: `qa-facturacion@mym.test` / (contraseña la sabe quien la
generó — no queda en texto plano acá, ni debería).

Ambas instancias son **free tier**: se "duermen" tras un rato sin uso — el
primer request después de estar inactivas tarda ~50s. Normal, no es un bug.

## Cómo está armado

**Backend (Render, servicio `mym`, Node nativo — no Docker):**

```text
Root Directory:  app
Branch:          develop
Build Command:   npm install -g pnpm@9.15.9 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @mym/shared-types build && pnpm --filter @mym/api exec prisma generate && pnpm --filter @mym/api exec prisma migrate deploy && pnpm --filter @mym/api build
Start Command:   pnpm --filter @mym/api start
Instance Type:   Free
```

Variables de entorno (Render → Environment): `DATABASE_URL` (hoy: la misma
Neon de desarrollo — ver "Pendiente" abajo), `JWT_SECRET`, `JWT_EXPIRES_IN`,
`JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `SIMPLIROUTE_MOCK=false`
(**modo real desde 2026-09-01** — antes estaba en `true`, ver gotcha #6 más
abajo), `SIMPLIROUTE_API_URL`, `SIMPLIROUTE_API_KEY`, `FRONTEND_URL`,
`CORS_ORIGIN` (ambas = URL exacta del frontend, sin barra final),
`NODE_ENV=production`.

**Frontend (Vercel, proyecto `mym-web`):**

```text
Root Directory:    app/apps/web
Framework:         Vite
Install Command:   npm install -g pnpm@9.15.9 && pnpm install --frozen-lockfile
Build Command:     pnpm --filter @mym/shared-types build && pnpm --filter @mym/web build
Output Directory:  dist
```

Variable de entorno: `VITE_API_URL` = URL del backend en Render, en
Production y Preview. `app/apps/web/vercel.json` tiene el rewrite a
`index.html` (necesario para que rutas de React Router como `/pedidos`
funcionen si se entra directo por URL, no solo navegando desde adentro).

## Gotchas reales encontrados (todos costaron tiempo real de debugging — no repetir)

1. **Railway no tiene free tier real** — el trial expira y pide tarjeta
   incluso para crear el primer proyecto. Por eso terminamos en Render.
2. **GitHub Apps de Render/Vercel necesitan acceso explícito al repo** —
   instalar la app no alcanza, hay que ir a
   `github.com/settings/installations` → Configure → agregar el repo a
   "Repository access" (o poner "All repositories").
3. **`corepack enable` falla en Render** con `EROFS: read-only file system,
   unlink '/usr/bin/pnpm'` — el filesystem de build de Render no deja que
   corepack reescriba esos symlinks. Se instala pnpm directo con
   `npm install -g pnpm@<version>` en su lugar.
4. **`@mym/shared-types` hay que compilarlo a mano en el build** —
   `pnpm install` solo linkea el paquete, no lo compila. Sin
   `pnpm --filter @mym/shared-types build` antes del build de `@mym/api` o
   `@mym/web`, falla con "Cannot find module '@mym/shared-types'".
5. **Cookie de refresh token con `sameSite: "lax"` no sirve entre dominios
   distintos.** En local "funcionaba" porque `localhost:5173`↔`localhost:3000`
   cuenta como mismo sitio para el navegador — desplegado, front y back viven
   en dominios de verdad distintos (`vercel.app` vs `onrender.com`), y con
   Lax el navegador no manda la cookie en absoluto. Se corrigió en
   `auth.controller.ts`: `sameSite: "none"` + `secure: true` cuando
   `NODE_ENV=production` (que además exige HTTPS, que ya tenemos en ambos).
6. **SPA sin rewrite = 404 en cualquier ruta que no sea `/`.** Vercel por
   default solo sirve archivos que existen físicamente — hace falta
   `vercel.json` con un rewrite `/(.*) → /index.html` para que React Router
   pueda manejar la ruta del lado del cliente.
7. **Vercel activa "Deployment Protection" (SSO) por default en proyectos de
   team** — bloquea el acceso a cualquiera que no esté logueado en esa cuenta
   de Vercel, lo cual rompe una demo pública. Se desactivó con
   `vercel project protection disable <proyecto> --sso`.
8. **Vercel Hobby (free) bloquea deploys si el autor del commit git no
   coincide con la cuenta de GitHub conectada al proyecto** ("The Hobby Plan
   does not support collaboration for private repositories"). El `git
   config user.email` local tiene que ser el mismo email de la cuenta de
   GitHub usada para conectar el repo.
9. **`tsconfig.json` de `shared-types` sin `rootDir` explícito** compila bien
   en algunas versiones de TypeScript y tira `TS5011` ("must be explicitly
   set") en otras — pasó en el entorno de Render aunque nunca en local.
   Se agregó `"rootDir": "src"` explícito para que sea determinístico.
10. **`NODE_ENV=production` hace que `pnpm install` salte `devDependencies`**
    — incluido `prisma` (el CLI, listado como devDependency), rompiendo
    `prisma generate`/`migrate deploy` en el build. Se agregó `--prod=false`
    al `pnpm install` del build command (las devDependencies hacen falta
    para *construir*, más allá de que el runtime corra en modo producción).
11. **La API REST de Render (`api.render.com/v1/...`) devuelve 400 vacío
    para este workspace/API key**, incluso en endpoints de solo lectura como
    `GET /v1/services`, sin nunca dar un motivo — se probó exhaustivamente
    (repo access, distintos endpoints, service conocido por ID) sin
    resolverlo. Toda la configuración de Render en esta sesión se hizo por
    el dashboard web o pidiéndole a Leonardo que hiciera clics puntuales —
    no perder tiempo reintentando la API REST sin una pista nueva de por qué
    falla.
12. **Copiar y pegar un valor de env var desde un mensaje de chat puede
    arrastrar texto de más** — al activar `SIMPLIROUTE_MOCK=false` (2026-09-01),
    `SIMPLIROUTE_API_KEY` quedó guardado en Render como
    `"Value: fff187be...` (con el prefijo "Value: " literal incluido) en vez
    de solo la clave, porque se copió directo de un mensaje que la mostraba
    así. El síntoma fue un 500 genérico ("Internal server error", sin
    detalle — `NODE_ENV=production` no expone el error real) al sincronizar
    Zonas/Choferes/Vehículos, mientras que la misma clave probada por curl
    directo contra la API de SimpliRoute y el mismo código corrido en local
    funcionaban perfecto — eso fue lo que aisló el problema al valor
    guardado en Render, no al código ni a la clave en sí. Al pasarle un
    valor para pegar en un campo de config, dejarlo en su propia línea sin
    ningún prefijo tipo "Value:"/"Key:" que se pueda arrastrar sin querer.

## Pendiente antes de que esto sea "producción" de verdad

Ver `PENDIENTES.md` — en resumen: separar la base de datos (branch de Neon
en vez de compartir la de desarrollo), decidir dominio propio, cargar
credenciales reales de Google (SimpliRoute ya está cargado y en modo real
desde 2026-09-01), y subir de instancia gratuita a paga en Render/Neon para
evitar el "duerme tras inactividad".
