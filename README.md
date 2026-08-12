# MyM Logística

Sistema de gestión de pedidos, revisión logística, facturación e integración con
SimpliRoute para MyM. Reemplaza el sistema actual (`mym.7ward.com`).

**Primera etapa**: pañales. **Segunda etapa**: medicamentos y facturación completa.

## Empezá por acá

**¿Retomando después de una pausa?** Leé primero
**[`ESTADO_DEL_PROYECTO.md`](./ESTADO_DEL_PROYECTO.md)** — una foto de 2 minutos de
dónde está todo, qué falta y qué está bloqueado. Se reescribe en cada sesión, así
que confiá en ese antes que en tu memoria de la última vez.

**¿Necesitás saber qué falta y de quién depende** (cuentas, credenciales,
decisiones de negocio, deploy)? Ese es **[`PENDIENTES.md`](./PENDIENTES.md)**.

**¿Buscás las URLs desplegadas o cómo volver a desplegar?** Ese es
**[`DEPLOY.md`](./DEPLOY.md)** — ambiente de test ya funcionando en Render + Vercel.

Para el resto, este proyecto tiene tres documentos que hay que leer en este orden:

1. **[`DOCUMENTO FUNCIONAL.md`](./DOCUMENTO%20FUNCIONAL.md)** — qué hace el sistema.
   El negocio: pedidos, destinatarios, zonas, choferes, facturación (2×1, entregas
   unificadas, CABA/Provincia), roles. Es la fuente de verdad de las reglas de negocio.
2. **[`DOCUMENTO TECNICO.md`](./DOCUMENTO%20TECNICO.md)** — cómo se construye. Stack,
   arquitectura, decisiones de seguridad/costos/despliegue, y un historial con
   fecha de cada decisión tomada. Cada ítem tiene un estado (🟢 confirmado, 🟡
   propuesto, 🔴 depende de algo externo, ⚪ descartado) — es el documento que se
   actualiza cada vez que se decide algo nuevo, no solo una foto del día que se escribió.
3. **[`app/README.md`](./app/README.md)** — cómo levantar el código en tu máquina.

`IMAGENES/` son capturas del sistema **actual** (`mym.7ward.com`), usadas solo
como referencia de qué información necesita ver el usuario en cada pantalla —
no como referencia visual a imitar. El sistema nuevo tiene diseño propio.

## Estructura de la carpeta

```
MYM/
├── DOCUMENTO FUNCIONAL.md   ← qué hace el sistema (negocio)
├── DOCUMENTO TECNICO.md     ← cómo se construye (arquitectura, decisiones, estado)
├── ESTADO_DEL_PROYECTO.md  ← foto rápida de dónde está todo ahora
├── PENDIENTES.md            ← qué falta y de quién depende
├── DEPLOY.md                 ← URLs desplegadas y cómo volver a desplegar
├── IMAGENES/                ← capturas del sistema actual, solo de referencia
└── app/                     ← todo el código
    ├── apps/
    │   ├── api/              ← backend NestJS
    │   └── web/               ← frontend React + Vite
    ├── packages/
    │   └── shared-types/     ← enums de dominio compartidos entre api y web
    └── README.md             ← cómo levantar el entorno local
```

## Estado actual del proyecto

Resumen rápido — para el detalle real y actualizado, siempre confiar en
`ESTADO_DEL_PROYECTO.md` antes que en esta lista, que se desactualiza fácil:

- **Stack**: TypeScript en todo — NestJS (backend), React + Vite + Tailwind +
  shadcn/ui (frontend), PostgreSQL + Prisma.
- **Backend**: completo salvo la pregunta de negocio pendiente de Facturación
  (ver `PENDIENTES.md`) — auth (login propio + Google), roles combinables,
  permisos por cliente, borrado lógico y auditoría universal, importador de
  Excel genérico, pedidos/zonas/choferes/dashboard, motor de facturación
  completo con reporte mensual exportable a Excel, e integración con
  SimpliRoute (adapter real construido, activo en modo mock hasta tener un
  token real).
- **Frontend**: las 8 pantallas del nav construidas y probadas end-to-end,
  PWA instalable.
- **Base de datos**: Neon Postgres, usada desde desarrollo y desde el
  ambiente de test desplegado (ver abajo) — separar una branch dedicada para
  test queda pendiente antes de producción real.
- **Despliegue**: ambiente de **test ya desplegado** (Render + Vercel, free
  tier) — ver `DEPLOY.md` para URLs y cómo volver a hacerlo. Producción real
  todavía no arrancó, es una decisión de negocio pendiente.

## Quick start

```bash
cd app
pnpm install
cp apps/api/.env.example apps/api/.env   # completar DATABASE_URL con el connection string de Neon
cd apps/api && pnpm prisma:migrate --name inicial
cd .. && pnpm --filter @mym/api dev
```

Instrucciones completas, incluyendo cómo crear la base en Neon paso a paso, en
[`app/README.md`](./app/README.md).

## Convenciones del proyecto

- **Idioma del código**: español para todo lo que sea vocabulario de negocio
  (`Cliente`, `Destinatario`, `Pedido`, `Entrega`, `Facturación`...), inglés
  para lo genérico (helpers, config). Mismo vocabulario que este documento —
  ver `DOCUMENTO TECNICO.md` sección 1.
- **Arquitectura**: hexagonal por módulo (`domain/application/infrastructure/interface`)
  donde la complejidad lo justifica. `usuarios/` y `clientes/` en `app/apps/api/src/modulos/`
  son la plantilla de referencia.
- **Nunca se borra nada físicamente** (borrado lógico) y **toda mutación queda
  auditada** (quién, cuándo, valor anterior/nuevo) — es una regla de plataforma,
  no algo que cada módulo tenga que implementar por su cuenta.

## Seguridad — no commitear

`.env`, connection strings, API keys y cualquier secreto quedan fuera del repo
por `.gitignore`. Si en algún momento se pega un secreto por error en un commit,
avisar antes de seguir — no alcanza con borrarlo en un commit nuevo, hay que
rotarlo.
