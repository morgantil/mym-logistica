# ESTADO DEL PROYECTO — leer esto primero si retomás después de una pausa

Última actualización: **2026-08-18**. Este documento es una **foto del momento**, se
reescribe cada vez que cambia el estado — no es un historial (eso vive en
`DOCUMENTO TECNICO.md` sección 7). Si algo acá contradice el código o
`DOCUMENTO TECNICO.md`, confiá en esos dos, no en esto — puede haber quedado viejo.

---

## Qué es este proyecto, en un párrafo

MyM Logística está reconstruyendo desde cero su sistema de gestión de pedidos,
logística y facturación (reemplaza `mym.7ward.com`). Primera etapa: pañales.
Segunda etapa (todavía no arrancada): medicamentos + facturación completa.
Documento de negocio completo: `DOCUMENTO FUNCIONAL.md` + `Documento_Funcional_MVP_Panales_SimpliRoute_Actualizado_v6.pdf`
(versión más nueva y detallada, de la consultora Arbet Consulting, revisada
contra el código el 2026-08-17).

## Quién es quién

- **Leonardo** (leonardomorganti1994@gmail.com) — lidera el proyecto del lado de
  MyM, decide alcance/prioridad, delega arquitectura técnica.
- Hay un **cliente final** (el dueño real del negocio de logística, no
  necesariamente Leonardo) del que siguen faltando algunas definiciones de
  negocio — ver `TEMAS_PENDIENTES.md`.

## Ambiente de test — desplegado (2026-08-12, al día 2026-08-18)

**https://mym-web-pi.vercel.app** (front) + **https://mym-n7bh.onrender.com**
(API) — probado de punta a punta, login real funcionando. Ambos en free
tier: se duermen tras inactividad, el primer request tarda ~50s, normal.
Desde el 2026-08-18 corre ahí todo lo construido hasta esa fecha: Zonas
tarifarias, Embalaje y Despacho, Facturación completa y la fecha de
entrega informada por el usuario — verificado en navegador real contra
las URLs desplegadas, no solo en local. Nota: la PWA cachea el frontend
con un service worker (Workbox) que actualiza en segundo plano, no al
instante — quien ya tenía la app abierta puede seguir viendo la versión
anterior hasta que su navegador la renueve solo. Detalle completo (config
exacta, gotchas encontrados) en **`DEPLOY.md`**. Producción real todavía
no existe — proyecto separado a armar cuando haga falta, ver
`TEMAS_PENDIENTES.md`.

## Dónde está todo

```
MYM/
├── DOCUMENTO FUNCIONAL.md       ← reglas de negocio originales
├── ...v6.pdf                    ← versión más nueva del funcional (Arbet Consulting)
├── DOCUMENTO TECNICO.md         ← arquitectura + historial de decisiones fechado
├── ESTADO_DEL_PROYECTO.md       ← este archivo
├── TEMAS_PENDIENTES.md          ← qué falta y de quién depende — el más al día
├── PENDIENTES.md                ← versión anterior, más acotada a despliegue/credenciales
├── DEPLOY.md                    ← cómo está armado el ambiente de test
├── PREGUNTAS_FACTURACION.pdf    ← preguntas para el cliente final (ambas ya respondidas)
├── Documentacion simpliroute/   ← contrato completo de la API pública de SimpliRoute
├── IMAGENES/                    ← capturas del sistema VIEJO, solo referencia
└── app/                         ← todo el código (monorepo pnpm/Turborepo)
    ├── apps/api/                 ← backend NestJS
    ├── apps/web/                 ← frontend React
    └── README.md                 ← cómo levantar el entorno local
```

Repo Git en la raíz de `MYM/`, rama **`develop`**, remoto en
`github.com/morgantil/mym-logistica` (privado).

## Qué está construido (backend)

| Módulo | Estado | Qué hace |
|---|---|---|
| Auth (local + Google), roles, permisos por cliente | 🟢 completo | refresh token en cookie httpOnly con rotación + revocación real de sesiones |
| Clientes | 🟢 completo | detección automática por nombre de Excel, editar y activar/desactivar |
| Destinatarios | 🟢 completo | padrón, detección de diferencia de dirección, sync con SimpliRoute |
| Pedidos | 🟢 completo | grilla paginada, N.º de pedido interno, bultos, revisión antes de enviar, envío a SimpliRoute, bloqueo optimista |
| Importadores | 🟢 completo | mapeo de columnas genérico, agrupación. **Fecha de entrega ahora la informa el usuario antes de subir el Excel** (2026-08-17, no se extrae más del archivo). Probado con los 3 Excel reales: 207 pedidos, 0 errores |
| Zonas/choferes (logística) | 🟢 completo | configurado a mano, CRUD + asignación zona↔chofer. **No se va a importar desde SimpliRoute** (decisión 2026-08-17) — SimpliRoute resuelve la asignación real del otro lado |
| Zonas tarifarias (facturación) | 🟢 completo (2026-08-17) | reemplaza el enum fijo CABA/Provincia por un modelo configurable (CABA + Cordón 1/2/3/…) — tabla + pantalla propia, sin código nuevo para agregar una zona |
| Embalaje y Despacho | 🟢 completo (2026-08-17) | pantalla nueva: filtra por fecha/cliente/estado, carga de bultos, genera/reimprime etiquetas en PDF (una por bulto) |
| SimpliRoute | 🟢 **validado con la cuenta real**, sigue en modo mock por decisión | token real probado en lectura y escritura (2026-08-16) contra `MYM LOGISTICA Y DISTRIBUCION SRL`. `SIMPLIROUTE_MOCK=true` por decisión de timing de Leonardo, no por duda técnica. **No se va a construir importación de Zonas/Choferes** — sí una sincronización de estados (+ chofer/vehículo asignado), bloqueada por el nombre de un estado nuevo que Leonardo va a agregar del lado de SimpliRoute — ver `TEMAS_PENDIENTES.md` sección 2. |
| Geografía (CABA/Provincia) | 🟢 completo | resuelto con API oficial gratuita `apis.datos.gob.ar/georef` |
| Dashboard | 🟡 mínimo | pedidos por estado + resumen de revisión — resto de KPIs pendiente, no urgente |
| **Facturación** | 🟢 **completo** | motor de reglas, vista previa/confirmación, tarifas por zona configurable, reporte mensual a Excel. La única pregunta de negocio que faltaba (qué servicio se cobra 100% en unificada) se respondió e implementó el 2026-08-17. |

41 tests unitarios sobre la lógica de dominio más riesgosa, todos pasando.
Todo probado contra una base Neon real, no contra mocks de base de datos.

## Frontend — 10 pantallas construidas

`apps/web` (React+Vite+Tailwind+shadcn/ui): Login (local + Google), shell,
Inicio/Dashboard, Pedidos (grilla, detalle, bultos, revisión y envío),
Importar Excel (con fecha de entrega obligatoria), Clientes, Zonas y
choferes, **Embalaje y Despacho** (nueva, 2026-08-17), y Facturación (3
pestañas: Liquidación, Tarifas, **Zonas tarifarias** — nueva, 2026-08-17).
PWA instalable con ícono placeholder (reemplazar cuando haya logo real).
Todo probado en navegador real contra el backend real, no solo con
typecheck/tests — ver `DOCUMENTO TECNICO.md` sección 7 para el detalle de
cada QA y los bugs reales encontrados y corregidos en el camino.

## Qué falta — ver `TEMAS_PENDIENTES.md` para el detalle completo

Resumen de lo más importante, todo del lado de Leonardo o del cliente final
(nada técnico bloqueado hoy):

1. Nombre del estado inicial nuevo que se va a agregar en SimpliRoute (bloquea la sincronización de estados).
2. Tarifa por viaje para la liquidación a transportistas.
3. Localidades reales por Cordón (la pantalla ya funciona, está vacía).
4. Tamaño/impresora real de la etiqueta de bulto (se usó un default de 10×15cm).
5. Reglas de tratamiento de entregas fallidas/canceladas/reentregas.
6. Qué cuenta de Google usar para el login, y logo real de MyM.

## Decisiones que ya están tomadas — no volver a discutir sin motivo nuevo

(Detalle y fecha de cada una en `DOCUMENTO TECNICO.md`)

- Stack: NestJS + TypeScript + Prisma + PostgreSQL (Neon) + React/Vite/Tailwind/shadcn/ui.
- Arquitectura hexagonal por módulo donde la complejidad lo justifica.
- Vocabulario del código en **español** (Cliente, Pedido, Destinatario...).
- Single-tenant ahora, diseñado para no cerrar la puerta a reventa futura.
- Borrado lógico + auditoría universal + bloqueo optimista: reglas de plataforma.
- Excel importer genérico y data-driven, no un parser por cliente.
- Fecha de entrega de un lote de Excel: la informa el usuario antes de subir el archivo, no se lee del contenido (2026-08-17, pedido del cliente final vía documento v6).
- CABA/Provincia se resuelve con la API oficial del Estado, no con catálogo manual.
- Zona logística: manual/configurable a mano — no derivada de datos oficiales.
- Zona tarifaria (facturación): tabla configurable, no un enum fijo — se puede agregar/renombrar una zona sin tocar código (2026-08-17).
- SimpliRoute: no se importan Zonas/Choferes propios — se sincronizan estados y asignación (chofer/vehículo) después de enviar el pedido, nunca antes (2026-08-17).
- Despliegue de test: Render + Vercel, free tier. Producción real es un proyecto aparte, todavía sin decidir cuándo armarlo.

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

Si `pnpm --filter @mym/web dev` falla con un error de `rolldown`/binding
nativo faltante: correr `pnpm install --force` en la raíz del monorepo (pasó
el 2026-08-17 después de instalar una dependencia nueva en `apps/api`, no
tiene que ver con el código de `apps/web`).

Usuario de prueba ya creado en Neon: `prueba@mym.test`, rol Administración
(la contraseña la sabe quien la generó — no queda en texto plano en ningún
lado, ni debería). También `qa-facturacion@mym.test` (mismo criterio).
También hay clientes y pedidos de prueba reales ("Biosintesis", "Farmapal",
"Bella Vista") para ver Pedidos, Importar Excel y Embalaje y Despacho con
datos reales. Es data de prueba de importación, no de un cliente ficticio —
se puede inspeccionar (no borrar sin necesidad) desde
`pnpm --filter @mym/api prisma:studio`.

Detalle completo, con cómo crear la base en Neon desde cero si hiciera
falta, en `app/README.md`.
