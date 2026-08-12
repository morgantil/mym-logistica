# PENDIENTES — todo lo que falta y de quién depende

Última actualización: **2026-08-12**. Documento vivo — se actualiza cada vez
que se resuelve o aparece un pendiente nuevo. Si algo de acá ya se resolvió y
este archivo no lo refleja, confiá en `ESTADO_DEL_PROYECTO.md`/`DOCUMENTO
TECNICO.md`, no en esto.

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
| 2.2 | Token real de la API de SimpliRoute | Cliente final / Leonardo | El adapter real ya está construido (2026-08-11) y probado hasta donde se puede sin token — ver `app/apps/api/src/modulos/simpliroute/README.md`. Falta saber si MyM ya tiene una cuenta de SimpliRoute contratada (la que usaba el sistema viejo) o si hay que dar de alta una nueva. Leonardo dijo que lo consigue. |
| 2.3 | Storage de archivos Excel (Cloudflare R2) | Leonardo crea la cuenta (si no existe una de MyM) | No bloquea nada — los Excel se procesan igual, solo no se archivan para poder "descargar el original" después. Baja prioridad. |

## 3. Decisiones de negocio pendientes (no técnicas)

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 3.1 | Pregunta 1 de `PREGUNTAS_FACTURACION.pdf` | Cliente final | En una entrega unificada pañales+medicamentos, ¿qué servicio se cobra al 100%? No bloquea nada del sistema hoy (medicamentos todavía no importa pedidos reales) — el motor de facturación ya está 100% construido con un placeholder documentado para el día que llegue la respuesta. |

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
