# MyM Logística — monorepo

Ver `../DOCUMENTO FUNCIONAL.md` (qué hace el sistema) y `../DOCUMENTO TECNICO.md`
(decisiones de arquitectura, con estado por ítem) en la raíz del proyecto.

## Estructura

```
apps/
  api/    → backend NestJS
  web/    → frontend React + Vite + Tailwind + shadcn/ui (Login + shell arrancados)
packages/
  shared-types/  → enums de dominio compartidos entre api y web
```

Dentro de `apps/api/src/modulos/`, cada módulo sigue (cuando la complejidad lo
justifica) el patrón hexagonal: `domain/` (reglas puras, sin Nest ni Prisma),
`application/` (casos de uso), `infrastructure/` (adapters concretos, ej. Prisma),
`interface/` (controllers, DTOs). `usuarios/` y `clientes/` son la plantilla más
completa de este patrón — mirar ahí si hay que armar un módulo nuevo.

`importadores/` y `facturacion/` tienen un `README.md` propio explicando por qué
todavía no están implementados (no fue por falta de tiempo — hace falta info que
no teníamos: los tres Excel reales de pañales, y tener el resto del flujo
funcionando antes de escribir el motor de facturación).

## Levantar el entorno local

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Base de datos (Neon)

Decidimos usar Neon Postgres (free tier) desde el desarrollo local — ver
DOCUMENTO TECNICO.md sección 1 y 5.

1. Crear cuenta en https://neon.tech (gratis).
2. Crear un proyecto nuevo, nombre sugerido: `mym-logistica`.
3. Copiar el **connection string** que te da Neon (empieza con `postgresql://`).
4. En `apps/api/`, copiar `.env.example` a `.env`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
5. Pegar el connection string de Neon en `DATABASE_URL` dentro de `apps/api/.env`.

### 3. Generar el cliente Prisma y crear las tablas

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate --name inicial
```

Esto crea todas las tablas del esquema (`prisma/schema.prisma`) en tu base de Neon.
Podés inspeccionar los datos con `pnpm prisma:studio`.

### 4. Completar el resto de las variables de entorno

En `apps/api/.env`:

- `JWT_SECRET` / `JWT_REFRESH_SECRET`: cualquier string largo y random para
  desarrollo (ej. `openssl rand -hex 32`).
- El resto (Redis, R2, SimpliRoute) puede quedar sin completar por ahora —
  `SIMPLIROUTE_MOCK=true` hace que el sistema use datos simulados en vez de
  fallar.

### 5. Correr el backend

```bash
pnpm --filter @mym/api dev
```

Debería levantar en `http://localhost:3000` y loguear todas las rutas mapeadas
(`/auth/*`, `/clientes`, `/pedidos`, `/zonas`, `/choferes`, `/dashboard/*`).

### 6. Crear el primer usuario administrador

Todavía no hay endpoint de registro (a propósito — ver DOCUMENTO TECNICO.md,
"reset de contraseña: admin manual para el MVP", mismo criterio aplica a la
creación del primer usuario). Por ahora se crea a mano en la base:

```bash
cd apps/api
pnpm prisma:studio
```

Y desde ahí, crear una fila en `usuarios` con `roles: ["ADMINISTRACION"]` y un
`passwordHash` generado con Argon2 (o pedime que te arme un script chico para
esto cuando lo necesites).

### 7. Correr el frontend

```bash
cp apps/web/.env.example apps/web/.env   # ya trae http://localhost:3000 por defecto
pnpm --filter @mym/web dev
```

Levanta en `http://localhost:5173` (el `CORS_ORIGIN` y el `FRONTEND_URL` del
backend ya apuntan ahí por defecto).

## Comandos útiles (desde la raíz del monorepo)

```bash
pnpm dev         # corre todas las apps en modo desarrollo (turbo) — api + web juntos
pnpm build       # build de todo
pnpm typecheck   # typecheck de todo
```
