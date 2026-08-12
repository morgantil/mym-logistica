# PENDIENTES — todo lo que falta y de quién depende

Última actualización: **2026-08-11**. Documento vivo — se actualiza cada vez
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

| # | Pendiente | Dueño | Qué hace falta concretamente |
|---|---|---|---|
| 1.1 | Repo remoto en GitHub | Leonardo | Crear el repo (o darme acceso a una cuenta de GitHub de MyM) y pushear lo que hay en local. Es el primer paso literal — sin esto no se puede conectar nada de lo demás. |
| 1.2 | Base de datos de test separada de prod | Nosotros, una vez con acceso a Neon | Usar el sistema de "branching" de Neon (una branch para test, la principal para prod) en vez de pagar dos bases — encaja con el esquema de ramas de Git que ya tenés pensado. |
| 1.3 | Hosting de la API (Railway o Render) | Leonardo crea la cuenta, nosotros configuramos | Cuenta + conectar el repo de GitHub. Free tier alcanza para arrancar. |
| 1.4 | Hosting del frontend (Vercel o Netlify) | Leonardo crea la cuenta, nosotros configuramos | Ídem — conectar el mismo repo, build de Vite. |
| 1.5 | Variables de entorno por ambiente | Nosotros | `CORS_ORIGIN`/`FRONTEND_URL` por dominio, `JWT_SECRET`/`JWT_REFRESH_SECRET` distintos en cada ambiente, `SIMPLIROUTE_MOCK=true` en test. Se arma en cuanto existan 1.1-1.4. |
| 1.6 | Dominio propio (opcional) | Leonardo (tiene costo, ~$10-15/año) | Solo si querés una URL con marca propia en vez del subdominio gratis del hosting. No bloquea nada, se puede sumar después. |

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
