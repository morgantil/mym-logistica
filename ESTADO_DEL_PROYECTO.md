# ESTADO DEL PROYECTO — leer esto primero si retomás después de una pausa

Última actualización: **2026-08-10**. Este documento es una **foto del momento**, se
reescribe cada vez que cambia el estado — no es un historial (eso vive en
`DOCUMENTO TECNICO.md` sección 7). Si algo acá contradice el código o
`DOCUMENTO TECNICO.md`, confiá en esos dos, no en esto — puede haber quedado viejo.

---

## Qué es este proyecto, en un párrafo

MyM Logística está reconstruyendo desde cero su sistema de gestión de pedidos,
logística y facturación (reemplaza `mym.7ward.com`). Primera etapa: pañales.
Segunda etapa (todavía no arrancada): medicamentos + facturación completa.
Documento de negocio completo: `DOCUMENTO FUNCIONAL.md`.

## Quién es quién

- **Leonardo** (leonardomorganti1994@gmail.com) — lidera el proyecto del lado de
  MyM, decide alcance/prioridad, delega arquitectura técnica. Cómo prefiere
  trabajar: ver memoria `usuario-leonardo` o preguntarle directamente si hace
  falta reconstruir el estilo de colaboración.
- Hay un **cliente final** (el dueño real del negocio de logística, no
  necesariamente Leonardo) del que todavía faltan definiciones de negocio para
  Facturación — ver más abajo.

## Dónde está todo

```
MYM/
├── DOCUMENTO FUNCIONAL.md      ← reglas de negocio (fuente: Leonardo)
├── DOCUMENTO TECNICO.md        ← arquitectura + historial de decisiones fechado
├── ESTADO_DEL_PROYECTO.md      ← este archivo
├── PREGUNTAS_FACTURACION.pdf   ← preguntas pendientes para el cliente final
├── IMAGENES/                   ← capturas del sistema VIEJO, solo referencia
└── app/                        ← todo el código (monorepo pnpm/Turborepo)
    ├── apps/api/                ← backend NestJS
    ├── apps/web/                ← frontend React — arrancado 2026-08-10 (Login + shell)
    └── README.md                ← cómo levantar el entorno local
```

Repo Git inicializado en la raíz de `MYM/`, rama **`develop`** (no hay
`main`/`master` todavía, es intencional). Último commit: `d8247f4` (arranque del
frontend). Hay trabajo de Pedidos sin commitear todavía al momento de escribir
esta línea — si retomás vos mismo, `git status` y pedile un commit si sigue así.

## Qué está construido (backend)

| Módulo | Estado | Qué hace |
|---|---|---|
| Auth (local + Google), roles, permisos por cliente | 🟢 completo | refresh token en cookie httpOnly con rotación + revocación real de sesiones (`SesionRefreshToken`) |
| Clientes | 🟢 completo | detección automática por nombre de Excel, editar y activar/desactivar (2026-08-10) |
| Destinatarios | 🟢 completo | padrón, detección de diferencia de dirección, sync con SimpliRoute |
| Pedidos | 🟢 completo | grilla paginada, bultos, revisión antes de enviar, envío a SimpliRoute, bloqueo optimista |
| Importadores | 🟢 completo | mapeo de columnas **genérico** (no un parser por cliente — ver DOCUMENTO TECNICO.md), agrupación, creación de pedidos. Probado con los 3 Excel reales de pañales: 207 pedidos, 0 errores (2026-08-10) |
| Zonas/choferes | 🟢 completo | configurado a mano por el cliente, no atado a divisiones oficiales |
| SimpliRoute | 🟡 mock | adapter real pendiente — falta gestionar acceso a la API (§36 funcional) |
| Geografía (CABA/Provincia) | 🟢 completo | resuelto con API oficial gratuita `apis.datos.gob.ar/georef`, sin depender del cliente |
| Dashboard | 🟡 mínimo | un endpoint (pedidos por estado) — ya conectado en el frontend, resto de KPIs pendiente |
| **Facturación** | 🔴 **bloqueada** | ver abajo |
| Frontend | 🟡 en construcción | `apps/web` (React+Vite+Tailwind+shadcn/ui). Login (local + Google), shell, **Inicio/Dashboard**, **Pedidos** (grilla §14, detalle §15, bultos §16, revisión y envío §17-18), **Importar Excel** (§4-8, §11) y **Clientes** (listar, crear, editar, activar/desactivar) funcionando end-to-end contra el backend real. Solo Zonas y Facturación siguen como placeholder — Zonas/choferes porque el backend hoy es de solo lectura (sin alta/edición todavía), Facturación porque sigue bloqueada. Ver DOCUMENTO TECNICO.md sección 6. |

21 tests unitarios sobre la lógica de dominio más riesgosa (agrupación,
mapeo de columnas, validación de envío). Todo probado end-to-end contra una base
Neon real, no contra mocks de base de datos.

## Qué está bloqueado, y por qué

**Facturación (Etapa 4)** no arrancó todavía. La lógica de reglas (2×1,
unificación pañales+medicamentos) está bien definida en el documento funcional
(§21-§32, con 4 ejemplos numéricos exactos) — se puede construir en cualquier
momento. De las 2 decisiones de negocio que le mandamos al cliente final en
`PREGUNTAS_FACTURACION.pdf`, queda **1 sola pendiente**:

1. 🔴 **Sin responder.** En una entrega unificada (pañales + medicamentos mismo
   cliente/dirección/fecha), ¿cuál de los dos servicios se cobra al 100% y cuál
   con el porcentaje reducido?
2. 🟢 **Respondida (2026-08-10).** Para agrupar pedidos de un mismo viaje se usa
   `fechaProgramada`: el cliente arma los pedidos de un día para el otro, así que
   esa fecha ya es la fecha de entrega real, no hace falta trackear una "fecha de
   entrega efectiva" distinta — ver DOCUMENTO TECNICO.md sección 7 (historial,
   2026-08-10).

**Actualizado 2026-08-10: la carpeta de Drive con los 3 Excel reales apareció**
localmente en `MYM/drive /` (gitignorada — tiene datos reales de pacientes/OSDE,
nunca se commitea). Se corrieron los 3 contra Neon: **207 pedidos, 0 errores** —
la "prueba de fuego" que el módulo importadores tenía pendiente desde que se
construyó. Encontró 2 gaps reales, ya corregidos (detalle en DOCUMENTO
TECNICO.md historial y en el README de `importadores/`): encabezados sin
sinónimo conocido, y la celda de fecha con una nota de entrega pegada al
texto (ahora se separa y la nota queda en `Pedido.observaciones`). También
llegaron 2 Excel de medicamentos (Bella Vista, Farmaet) — quedan sin tocar,
son Etapa 2.

**Antes de arrancar Facturación, falta la respuesta a la pregunta 1.** Cuando
llegue, construir el motor de reglas como funciones puras de dominio (sin
Nest/Prisma) testeadas contra los 4 ejemplos del §28 funcional, después conectar
tarifas (`TarifaCliente`, ya existe en el schema pero sin datos ni pantalla de
carga todavía).

## Decisiones que ya están tomadas — no volver a discutir sin motivo nuevo

(Detalle y fecha de cada una en `DOCUMENTO TECNICO.md`)

- Stack: NestJS + TypeScript + Prisma + PostgreSQL (Neon) + React/Vite/Tailwind/shadcn/ui (frontend).
- Arquitectura hexagonal por módulo donde la complejidad lo justifica.
- Vocabulario del código en **español** (Cliente, Pedido, Destinatario...).
- Single-tenant para este cliente ahora, pero diseñado para no cerrar la puerta a
  reventa futura.
- Borrado lógico + auditoría universal + bloqueo optimista: reglas de plataforma,
  no algo que cada módulo implemente por su cuenta.
- Excel importer genérico y data-driven — explícitamente **no** un parser
  hardcodeado por cliente/formato (pedido directo de Leonardo).
- CABA/Provincia se resuelve con la API oficial del Estado, no con catálogo manual.
- Zona sí queda manual/configurable a mano — decisión explícita, no derivarla de
  datos oficiales.
- Despliegue: todavía sin decidir a propósito, se retoma cuando el backend esté
  más completo.

## Cómo levantar esto si volvés en frío

```bash
cd app
pnpm install
# apps/api/.env y apps/web/.env ya existen (Neon real / http://localhost:3000)
cd apps/api && pnpm prisma:generate && pnpm prisma migrate deploy && cd ../..
pnpm dev   # levanta api (:3000) y web (:5173) juntos vía Turborepo
```

Si `pnpm dev` falla en el primer intento con "Can't reach database server" en la
API: Neon (free tier) suspende el cómputo tras estar inactivo y tarda unos
segundos en despertar — probar de nuevo.

Usuario de prueba ya creado en Neon: `prueba@mym.test`, rol Administración
(la contraseña la sabe quien la generó — no queda en texto plano en ningún lado,
ni debería). También hay clientes y pedidos de prueba ("Biosintesis", "Farmapal")
para poder ver Pedidos e Importar Excel con datos reales, incluyendo uno con
datos faltantes a propósito para ver la pestaña de Revisión con motivos
bloqueantes. Es data de prueba, no de un cliente real — se puede borrar desde
`pnpm --filter @mym/api prisma:studio` sin problema.

Detalle completo, con cómo crear la base en Neon desde cero si hiciera falta, en
`app/README.md`.
