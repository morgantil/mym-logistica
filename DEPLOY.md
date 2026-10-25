# DEPLOY — cómo está desplegado y cómo volver a hacerlo

Última actualización: **2026-10-24**. Hay **dos ambientes** desplegados, en
cuentas distintas:

1. **Ambiente en cuentas del cliente** (Render/Vercel/Postgres de
   Pablo/Arbet) — **este es el real, acá carga datos el cliente hoy**.
   Deploy manual sin integración git. Sección "Ambiente en cuentas del
   cliente" más abajo.
2. **Test** (cuentas propias de Leonardo, Render/Vercel/Neon) — el de
   siempre, sección inmediatamente abajo. Sigue vivo en paralelo, pendiente
   de darlo de baja una vez que el del cliente quede confirmado del todo
   (ver `TEMAS_PENDIENTES.md` §17.5).

**SimpliRoute está en modo REAL (`SIMPLIROUTE_MOCK=false`) en los DOS
ambientes** desde 2026-10-13 — cualquier pedido enviado desde cualquiera de
los dos crea una Visita real contra la misma cuenta
(`MYM LOGISTICA Y DISTRIBUCION SRL`). Por eso no conviene operar los dos en
paralelo con datos reales: se pueden pisar. El Postgres del cliente está en
plan pago desde 2026-10-13 (sin expiración, con backups) — ver gotcha #16
más abajo, ya no aplica tal cual estaba escrito originalmente.

## URLs actuales (test, cuentas propias de Leonardo)

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

## Ambiente en cuentas del cliente (Arbet/Pablo)

Armado el 2026-10-11, a partir de una API key de Render y un token de Vercel
que Pablo (dueño de Arbet, el cliente que paga el hosting) pasó directamente
en el chat. Verificado por API antes de tocar nada: ambas cuentas son del
mismo usuario (`arbetconsulting.arg@gmail.com` / GitHub `arbet-arg`), con rol
OWNER confirmado en las dos.

### URLs

| Qué | URL |
|---|---|
| Frontend | https://mym-logistica-web.vercel.app |
| Backend / API | https://mym-api.onrender.com |
| Base de datos | Postgres propio en Render (`mym-db`, plan pago `0.1c-256mb` desde 2026-10-13, región Oregon) — **no** es Neon |
| Repo | https://github.com/morgantil/mym-logistica — **ahora público** (ver por qué, abajo) |

### Por qué es distinto del ambiente de test: sin integración git

El plan inicial era replicar el mismo esquema que test (Render/Vercel
conectados al repo por GitHub, auto-deploy en cada push). No se pudo: el
repo es de la cuenta personal de Leonardo (`morgantil`), y las cuentas de
Render/Vercel son de Pablo — un GitHub App instalado en la cuenta de Pablo
**no puede ver repos que no son de Pablo**, ni siquiera estando el repo en
público (ver gotcha #13). La opción "correcta" (agregar a `arbet-arg` como
colaborador del repo y que Pablo reconfigure sus propias GitHub Apps) fue
descartada a pedido explícito de Leonardo: **"avancemos sin Pablo"** — no
depender de que el cliente tenga que hacer pasos manuales.

Por eso el deploy quedó **manual, sin auto-deploy en push**:

**Backend (Render, servicio `mym-api`, imagen Docker):**

```text
Imagen:               ghcr.io/morgantil/mym-api:latest
Dockerfile:            app/apps/api/Dockerfile (contexto de build: app/, NO la raíz
                        del repo — así "drive /", INPUT/ y demás quedan afuera del
                        build context sin necesidad de excluirlos a mano)
Registro:              GitHub Container Registry, paquete PRIVADO — Render tiene
                        credenciales propias (Render → Registry Credentials,
                        registry type "GITHUB", username "morgantil", password
                        un token de gh con scope write:packages)
Plan:                   Starter (`0.5c-512mb`) desde 2026-10-13 — antes Free, se dormía a los 15 min
```

El `CMD` de la imagen corre `prisma migrate deploy && node dist/main.js` al
arrancar — así las migraciones se aplican en cada deploy real, no en build
time.

Variables de entorno cargadas: `DATABASE_URL` (connection string **interno**
del Postgres de Render — más rápido, mismo datacenter, no necesita SSL),
`JWT_SECRET`/`JWT_REFRESH_SECRET` (generados nuevos para este ambiente, no
son los mismos que test), `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`,
`SIMPLIROUTE_MOCK=false` (activado 2026-10-13, mismas credenciales reales que
el ambiente de test — misma cuenta `MYM LOGISTICA Y DISTRIBUCION SRL`),
`NODE_ENV=production`, `FRONTEND_URL`/`CORS_ORIGIN` = la URL exacta de Vercel
de este ambiente.

**Frontend (Vercel, proyecto `mym-logistica-web`):**

Desplegado con `vercel --prod` desde `app/` (monorepo root) usando el CLI
directo, sin pasar por git. Configuración del proyecto (via API, no hay
`vercel.json` de root directory — se seteó en Project Settings):

```text
Root Directory:    apps/web
Framework:         Vite
Install Command:   npm install -g pnpm@9.15.9 && pnpm install --frozen-lockfile
Build Command:     npm install -g pnpm@9.15.9 && pnpm --filter @mym/shared-types build && pnpm --filter @mym/web build
Output Directory:  dist
```

Variable de entorno: `VITE_API_URL` = `https://mym-api.onrender.com`.
Deployment Protection (SSO) se desactivó igual que en test (gotcha #7).

### Cómo volver a desplegar acá (no hay auto-deploy)

Backend, después de cambiar código:

```bash
cd app
docker build -f apps/api/Dockerfile -t ghcr.io/morgantil/mym-api:latest .
gh auth token | docker login ghcr.io -u morgantil --password-stdin
docker push ghcr.io/morgantil/mym-api:latest
# Disparar el deploy en Render (no se redeploya solo con el push a GHCR):
curl -X POST -H "Authorization: Bearer <RENDER_API_KEY>" \
  https://api.render.com/v1/services/srv-db607ofavr4c73aa3fmg/deploys
```

Frontend, después de cambiar código:

```bash
cd app
npx vercel --prod --token=<VERCEL_TOKEN> --yes
```

### Por qué el repo quedó público

Al no poder conectar el repo por GitHub App (ver arriba), se evaluó hacerlo
público como atajo. Antes de hacerlo se verificó que **nunca se commiteó
ningún `.env` ni secreto** (`git log --all -- "**/.env"` vacío) — así que no
hay riesgo de fuga de credenciales. Lo único que se expone es el código
fuente (lógica de negocio incluida). Leonardo lo autorizó explícitamente.
Dato real: hacerlo público **no alcanzó** para que Vercel pudiera *vincular*
el repo para auto-deploy (ver gotcha #13) — terminó siendo una decisión sin
efecto práctico en el deploy en sí, solo cambió la visibilidad del código.

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

13. **Un GitHub App instalado en una cuenta solo ve repos de ESA cuenta —
    hacer el repo público no cambia eso.** El team de Vercel/Render de un
    tercero (ej. un cliente) tiene su propia integración de GitHub, atada a
    SU cuenta/org. Si el repo es de otra persona (ej. tu cuenta personal),
    da igual que sea público: al intentar *vincular* el repo para
    auto-deploy, la API devuelve `repo_no_access` / "You need admin or write
    access to the repository to link it" — GitHub exige permiso de
    escritura para crear el webhook, sin importar la visibilidad. La única
    forma real de arreglarlo es (a) agregar la cuenta del tercero como
    colaborador con escritura y que ESA cuenta reconfigure su propio GitHub
    App, o (b) no usar integración git (deploy manual, lo que se hizo acá).
    Diagnosticado con `GET /v1/integrations/search-repo` de la API de
    Vercel — devuelve `"repos": []` para cualquier repo fuera de la cuenta
    conectada, sin importar si existe o es público.
14. **Prisma en `node:*-alpine` necesita `openssl` instalado explícito.**
    Sin el paquete `openssl` de Alpine, Prisma no puede detectar la versión
    de libssl, asume `openssl-1.1.x` por default, y el motor de queries
    (schema engine) queda roto en runtime con un error de parseo JSON
    confuso (`Error: Could not parse schema engine response:
    SyntaxError...`) o `P1017: Server has closed the connection` al
    intentar conectar — el mensaje no menciona OpenSSL para nada, hay que
    reconocer el síntoma. Fix: `RUN apk add --no-cache openssl` en el
    Dockerfile, antes de `pnpm install`/`prisma generate`.
15. **El campo `registry` de `POST /v1/registrycredentials` de Render para
    GitHub Container Registry es `"GITHUB"` (mayúsculas), no `"ghcr"` ni
    `"ghcr.io"` — no está documentado, se encontró por prueba y error.**
    El `username` es el usuario de GitHub (no "token" ni vacío) y el
    `authToken` es un Personal Access Token con scope `write:packages`
    (que de paso habilita lectura).
16. **El Postgres gratuito de Render expira a los 30 días, no 90** (dato
    que se había asumido mal en una conversación — la API lo devuelve en
    `expiresAt` al crear la base: exactamente 30 días después de
    `createdAt`). Si este ambiente sigue vivo para cuando se cumplan 30
    días desde 2026-10-11, hay que migrar a un plan pago o recrear la base
    (con su `pg_dump`/`pg_restore` correspondiente) antes de que expire.
17. **Un token de Vercel con scope de PROYECTO funciona para `vercel --prod`
    aunque `vercel whoami`/`vercel teams ls` lo rechacen.** Al pedirle un
    token al cliente (2026-10-25) varios intentos fallaron: uno con scope
    de cuenta personal (sin acceso al team del proyecto), uno de otra
    cuenta/team por completo, uno inválido de entrada — hasta que generó
    uno con **scope = el nombre del proyecto** (`mym-logistica-web`), que
    Vercel muestra como una fila aparte en la lista de tokens, distinta de
    "Personal Account" o un team. Ese SÍ funcionó para desplegar, pese a
    que los comandos de diagnóstico (`whoami`, `teams ls`) seguían
    devolviendo error — no usar esos comandos para "validar" un token antes
    de probarlo con el deploy real, dan falso negativo con un token de
    proyecto.

## Pendiente antes de que esto sea "producción" de verdad

Ver `TEMAS_PENDIENTES.md` §17 — en resumen: ya se decidió que el ambiente de
cuentas del cliente es el real (hecho 2026-10-11/13); falta borrar el de
Leonardo cuando se confirme del todo; decidir dominio propio; resolver el
acceso de git (agregar a Pablo como colaborador, o seguir con deploy manual)
si se quiere auto-deploy en el ambiente del cliente.
