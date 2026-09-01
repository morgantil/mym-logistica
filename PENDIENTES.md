# PENDIENTES — todo lo que falta y de quién depende

Última actualización: **2026-08-25**. Documento vivo — se actualiza cada vez
que se resuelve o aparece un pendiente nuevo. Si algo de acá ya se resolvió y
este archivo no lo refleja, confiá en `ESTADO_DEL_PROYECTO.md`/`DOCUMENTO
TECNICO.md`, no en esto.

Ver también `TEMAS_PENDIENTES.md` — vista consolidada más amplia y más al día
(incluye SimpliRoute, etiquetas, Embalaje y Despacho, liquidación a
transportistas y reglas de negocio que no estaban acá). Ante cualquier duda,
`TEMAS_PENDIENTES.md` es la fuente más actualizada de las dos.

Cómo leer la columna "Dueño":
- **Nosotros** = lo puedo resolver yo (Claude Code) directamente, sin esperar nada.
- **Leonardo** = necesita una decisión o una acción tuya (crear una cuenta,
  hacer un login interactivo, conseguir un archivo).
- **Cliente final** = depende de alguien fuera de MyM/nuestro equipo.

---

## 1. Para poder desplegar (test y prod)

| # | Pendiente | Dueño | Estado |
|---|---|---|---|
| 1.1 | Repo remoto en GitHub | Leonardo | ✅ **Resuelto (2026-08-11)** — `github.com/morgantil/mym-logistica`, privado. |
| 1.2 | Ambiente de test desplegado | Nosotros | ✅ **Resuelto (2026-08-12)** — Render (API) + Vercel (front), ambos free tier, probado de punta a punta. Ver `DEPLOY.md`. |
| 1.3 | Base de datos de test separada de prod | Nosotros | 🔲 Pendiente — hoy el ambiente de test comparte la misma Neon que desarrollo. Sirve para probar, pero antes de mostrarle esto al cliente final de forma sostenida conviene separar una branch de Neon dedicada. |
| 1.4 | Dominio propio (opcional) | Leonardo (tiene costo, ~$10-15/año) | 🔲 Pendiente — no bloquea nada, se puede sumar cuando se decida ir a producción real. |
| 1.5 | Producción real (instancias pagas, sin "sleep") | Leonardo decide cuándo | 🔲 Pendiente — recién cuando el cliente final apruebe pasar de demo a uso real. Costo estimado ~$25-30/mes (Render + Neon pagos, Vercel se mantiene gratis). Es un proyecto nuevo, no "ascender" el de test. |

## 2. Credenciales / cuentas externas

| # | Pendiente | Dueño | Qué hace falta concretamente |
|---|---|---|---|
| 2.1 | Login con Google (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) | Leonardo decide la cuenta, nosotros lo configuramos | Es **gratis**, no hace falta facturación. Sí importa qué cuenta de Google la crea (queda como dueña del proyecto OAuth) — mejor una que controle MyM de verdad, no una al azar. Falta: que Leonardo diga qué cuenta usar. |
| 2.2 | Token real de la API de SimpliRoute | ✅ **Resuelto (2026-08-16)** | Conseguido desde la pantalla de Perfil de la cuenta real (`MYM LOGISTICA Y DISTRIBUCION SRL`) y probado contra la API real: lectura (`GET /v1/accounts/me/`, búsqueda de destinatario, estados reales) **y** escritura (crear/actualizar/borrar un destinatario de prueba, ciclo completo verificado sin dejar rastro en la cuenta real). Guardado en `app/apps/api/.env` (nunca en Git). **Sigue en `SIMPLIROUTE_MOCK="true"`** — de las 10 validaciones técnicas del §36 funcional, 9 ya están confirmadas contra la API real; solo falta decidir con Leonardo cuándo pasar a real (decisión de negocio/timing, ya no de riesgo técnico) y la arquitectura webhook vs. polling. Ver detalle en `DOCUMENTO TECNICO.md` sección 4 e historial 2026-08-16. |
| 2.3 | Storage de archivos Excel (Cloudflare R2) | Leonardo crea la cuenta (si no existe una de MyM) | No bloquea nada — los Excel se procesan igual, solo no se archivan para poder "descargar el original" después. Baja prioridad. |

## 2.5 SimpliRoute — Zonas/Choferes/Vehículos construido el 2026-08-26 (revierte lo del 2026-08-17)

**Construido de punta a punta** — Zonas se trae de SimpliRoute de solo
lectura, Choferes y Vehículos se traen y también se pueden crear/editar/
borrar desde MyM porque su API sí tiene CRUD completo. Falta solo probar las
escrituras de Choferes/Vehículos contra la cuenta real (mismo bloqueo de
siempre para escrituras desde el entorno de Claude Code). Detalle completo y
lista de pendientes actualizada en `TEMAS_PENDIENTES.md` sección 2 — ese
documento es el más al día para este tema.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 2.5.1 | ~~Activar modo real (`SIMPLIROUTE_MOCK=false`)~~ | ✅ Activado 2026-09-01 | Leonardo lo activó en el ambiente de test (Render) — ver `TEMAS_PENDIENTES.md` §2.8 para el detalle (incluye un gotcha real de config encontrado y corregido en el camino). |

## 3. Decisiones de negocio pendientes (no técnicas)

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 3.1 | Pregunta 1 de `PREGUNTAS_FACTURACION.pdf` | ✅ **Resuelta (2026-08-17)** | Respondida en `Documento_Funcional_MVP_Panales_SimpliRoute_Actualizado_v6.pdf`: pañales se factura al 100%, medicamentos con un porcentaje adicional configurable. Falta solo reemplazar el placeholder `SERVICIO_AL_CIEN_POR_CIENTO_EN_UNIFICADA` en el motor de facturación (una línea, ya preparado para esto). Ver `TEMAS_PENDIENTES.md` sección 1. |

## 4. Assets que faltan

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 4.1 | Logo real de MyM | Leonardo | Hoy la PWA usa un ícono placeholder (monograma "M" azul). Hace falta el archivo de marca real (SVG o PNG de buena resolución) — no es algo que se pueda inventar. |

---

## Qué NO es un pendiente (aclarado para no confundir)

- **"¿Las ciudades están cargadas?"** — no aplica, la clasificación CABA/Provincia
  se resuelve en vivo contra la API oficial del Estado, no hay nada que cargar.
- **SimpliRoute en modo mock** — no bloquea la demo, el flujo se ve completo,
  solo no manda nada a un sistema real todavía.
- **Medicamentos (Etapa 2)** — explícitamente fuera de alcance por ahora, no
  es un pendiente de esta etapa.
