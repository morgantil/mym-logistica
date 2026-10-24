# ESTADO DEL PROYECTO — leer esto primero si retomás después de una pausa

Última actualización: **2026-10-24**. Este documento es una **foto del momento**, se
reescribe cada vez que cambia el estado — no es un historial (eso vive en
`DOCUMENTO TECNICO.md` sección 7 y en `TEMAS_PENDIENTES.md`, que sí quedan
fechados y acumulativos). Si algo acá contradice el código, confiá en el código.

---

## Qué es este proyecto, en un párrafo

MyM Logística reconstruyó desde cero su sistema de gestión de pedidos,
logística y facturación (reemplaza `mym.7ward.com`). Primera etapa: pañales
y medicamentos (ambos en uso real). El alcance se sigue ampliando reunión a
reunión con el cliente — ver `TEMAS_PENDIENTES.md` §19-20 para lo más
reciente.

## Quién es quién

- **Leonardo** (leonardomorganti1994@gmail.com) — lidera el proyecto del lado de
  MyM, decide alcance/prioridad.
- **Pablo Renzo** (Arbet Consulting) — representa al cliente final, trae los
  requerimientos de negocio reunión a reunión, hoy dueño de las cuentas de
  Render/Vercel/Neon donde corre el ambiente real.
- **Sandra** — usuaria real del sistema del lado del cliente.

## ⚠️ Importante: hay DOS ambientes desplegados, distintos de como era antes

Desde el **2026-10-11** el ambiente que realmente usa el cliente **ya no es
el de las cuentas de Leonardo** — se migró a cuentas propias de Arbet/Pablo.
Detalle completo, URLs y credenciales en `DEPLOY.md` (siempre la fuente de
verdad para esto, no confiar en memoria de conversación vieja).

| Ambiente | Para qué sirve hoy | Base de datos |
|---|---|---|
| **Cuentas del cliente** (Render/Vercel de Pablo) | El real — acá está cargando datos reales el cliente (Farmaet, Farmapal, etc.) | Postgres propio de Render (plan pago desde 2026-10-13, sin expiración, con backups) |
| **Cuentas de Leonardo** (el de siempre) | Sigue vivo, pero es el que hay que dar de baja una vez que el del cliente esté 100% confirmado — **todavía no se borró** | Neon (desarrollo) |

**SimpliRoute está en modo real (no mock) en los dos ambientes** — cualquier
pedido que se envíe desde cualquiera de los dos crea una Visita real en la
cuenta de `MYM LOGISTICA Y DISTRIBUCION SRL`. Por eso, mientras los dos
ambientes convivan, **no conviene operar en paralelo en los dos** — pueden
pisarse.

**Local/desarrollo** sigue apuntando a la Neon de siempre (`apps/api/.env`),
sin tocar ninguno de los dos ambientes de arriba.

## Qué está construido — estado por módulo

| Módulo | Estado |
|---|---|
| Auth (local + Google, aunque Google sigue sin decidirse si se usa) | 🟢 completo |
| Clientes, Destinatarios | 🟢 completo |
| Pedidos | 🟢 completo — grilla con filtros avanzados, columnas personalizables, revisión antes de enviar, alta manual (nuevo, ver abajo), impresión masiva de etiquetas/remitos agrupada por cliente (nuevo, ver abajo) |
| Importadores (Excel) | 🟢 completo para los clientes reales activos — ver gotcha de Farmaet en `TEMAS_PENDIENTES.md` §18 |
| Zonas/choferes, SimpliRoute | 🟢 completo, en modo real en los dos ambientes |
| Embalaje y Despacho, etiquetas, remitos | 🟢 completo, impresión por diálogo nativo (no descarga) |
| Facturación (clientes + liquidación a transportistas) | 🟢 completo |
| Combustible y Peajes | 🟢 completo (ABM manual + import + estado de pago) |
| Usuarios | 🟢 completo |
| Seguridad/robustez de producción | 🟢 construido y desplegado 2026-10-10/11 — ver `TEMAS_PENDIENTES.md` §16 |

**242+ tests unitarios** sobre la lógica de dominio más riesgosa (hoy 250 en
`develop`, más los que se sumen en ramas sin mergear — ver abajo).

## Rama con trabajo construido pero SIN mergear ni desplegar: `mejoras-21-10`

Reunión del 21/10 con Pablo — 3 de los 6 puntos ya están construidos y
probados (unit tests + navegador), esperando OK para mergear a `develop`:

1. **Agrupar los pedidos del día en un solo Plan de SimpliRoute** (antes salía
   un Plan por chofer distinto) — corregido.
2. **Impresión masiva de etiquetas/remitos agrupada por cliente** — nuevo,
   desde la grilla de Pedidos (selección múltiple ya existente).
3. **Alta manual de pedidos** — nuevo botón en Pedidos, formulario que
   cambia según tipo de cliente (Pañales/Medicamentos), reusa el mismo
   motor de validación que la importación real.

Los otros 3 puntos de esa reunión (y 3 más de la reunión del 23/10) quedaron
como **preguntas pendientes para Pablo** — ver `TEMAS_PENDIENTES.md` §19-20
para el detalle completo con contexto de cada una.

## Decisiones que ya están tomadas — no volver a discutir sin motivo nuevo

(Detalle y fecha de cada una en `DOCUMENTO TECNICO.md`)

- Stack: NestJS + TypeScript + Prisma + PostgreSQL + React/Vite/Tailwind/shadcn/ui.
- Arquitectura hexagonal por módulo donde la complejidad lo justifica.
- Vocabulario del código en **español**.
- Borrado lógico + auditoría universal + bloqueo optimista: reglas de plataforma.
- Excel importer genérico y data-driven, no un parser por cliente — alta
  manual de pedidos (nuevo) reusa ese mismo motor en vez de reimplementar
  validación por separado.
- SimpliRoute es la fuente de verdad para Zonas/Choferes/Vehículos.
- Nunca escribir un secreto real (password, API key) en un archivo que
  quede trackeado en git — ver `DEPLOY.md` para el historial de incidentes
  reales por esto.

## Cómo levantar esto si volvés en frío

```bash
cd app
pnpm install
# apps/api/.env y apps/web/.env ya existen (Neon de desarrollo / http://localhost:3000)
cd apps/api && pnpm prisma:generate && pnpm prisma migrate deploy && cd ../..
pnpm dev   # levanta api (:3000) y web (:5173) juntos vía Turborepo
```

Si `pnpm dev` falla con "pnpm: command not found" en un shell nuevo, correr
`corepack enable` primero (pasó en esta sesión, el shim no estaba activado).

Detalle completo, con cómo crear la base desde cero si hiciera falta, en
`app/README.md`. Para todo lo de despliegue (URLs, credenciales, gotchas
reales encontrados), `DEPLOY.md` es la única fuente de verdad — no asumir
nada de acá.
