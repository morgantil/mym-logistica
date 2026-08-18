# TEMAS PENDIENTES — vista consolidada de todo lo que falta

Última actualización: **2026-08-17**. Documento vivo, separado de `PENDIENTES.md`
(ese sigue con el detalle histórico de despliegue/credenciales). Este junta
**todo** lo que queda para terminar el proyecto — técnico, de negocio y de
assets — en un solo lugar.

Cómo leer la columna "Dueño":
- **Nosotros** = lo resuelve Claude Code directamente, sin esperar nada.
- **Leonardo** = necesita una decisión, una cuenta, o un archivo tuyo.
- **Cliente final** = depende de alguien fuera de MyM.

---

## 0. Discrepancias del documento v6 — ✅ resueltas e implementadas (2026-08-17)

`Documento_Funcional_MVP_Panales_SimpliRoute_Actualizado_v6.pdf` (Arbet
Consulting, 2026-08-13) traía dos puntos distintos de lo ya construido —
fecha de entrega y tarifas por zona. Ambos ya están implementados, migrados
contra la base real (207 pedidos preservados sin pérdida) y probados en
navegador real — ver `DOCUMENTO TECNICO.md` historial 2026-08-17.

## 1. Facturación

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 1.1 | Pregunta 1 de `PREGUNTAS_FACTURACION.pdf` | ✅ **Resuelta e implementada** | Pañales se factura al 100%, medicamentos con porcentaje adicional configurable. |
| 1.2 | Combinaciones habilitadas de entrega unificada | Nosotros, cargar como configuración | Farmaet↔Biosíntesis/Farmapal; Bella Vista medicamentos↔OSDE Bella Vista pañales/Previvax. Dato de configuración — falta cargarlo cuando arranque Etapa 2. |
| 1.3 | Concepto "Subcliente" (Bulto/Bolsa por cliente) | Nosotros, cuando arranque Etapa 2 | No existe en el schema. No bloquea nada hoy. |
| 1.4 | Cargar las localidades reales en "Localidades por zona" | Leonardo / Cliente final | Facturación → Zonas tarifarias ya funciona, pero está vacía. Sin esto, los pedidos de Provincia no se pueden facturar (quedan "sin zona tarifaria"). |

## 2. SimpliRoute — arquitectura definida el 2026-08-17

**No se va a construir ninguna importación de Zonas/Choferes.** El sistema
propio no tiene (ni va a tener) carga manual de esos datos como copia de
SimpliRoute — se investigó contra la documentación oficial: los campos
`driver`/`vehicle` de una Visita quedan vacíos hasta que SimpliRoute arma la
ruta en su Route Designer, no hay forma de "consultar antes". Se resuelve
solo, como parte de la misma sincronización de estados (punto 2.2).

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 2.1 | Sincronización de estados (+ chofer/vehículo asignado) | Nosotros, bloqueado por 2.2 | Reemplaza los 6 estados propios (`EstadoPedido`) por los reales de SimpliRoute (`pending`, `completed`, `failed`, + un estado inicial nuevo). Afecta Facturación (hoy filtra por `ENTREGADO`) y Dashboard — no se puede programar sin el nombre del estado nuevo. |
| 2.2 | Nombre del estado inicial nuevo en SimpliRoute | Leonardo | SimpliRoute no tiene hoy un estado para "recién creado" — Leonardo/su equipo lo va a agregar en la configuración de la cuenta y pasarnos el nombre. Bloquea 2.1. |
| 2.3 | Probar el envío real de un pedido (crear una Visita) | Nosotros, coordinado con Leonardo | Única operación del adapter nunca probada contra la cuenta real — a propósito, es la única que podría aparecerle a un chofer real. Adapter ya construido. Hacer la prueba con cuidado y borrar el registro de prueba después. |
| 2.4 | Activar modo real (`SIMPLIROUTE_MOCK=false`) | Leonardo decide cuándo | Sin duda técnica pendiente — es 100% timing de negocio. |

## 3. Etiquetas de envío y Embalaje y Despacho — ✅ construidas y probadas (2026-08-17)

Ambas implementadas end-to-end (backend + frontend), probadas en navegador
real contra datos reales — ver `DOCUMENTO TECNICO.md` historial. Pantalla
nueva `/embalaje-despacho` (rol Logística/Administración): filtra por
fecha/cliente/estado, carga de bultos, imprime/reimprime etiquetas en PDF
(una por bulto).

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 3.1 | Tamaño/impresora real de la etiqueta | Leonardo | Se usó un default razonable (10×15cm, tamaño estándar de envío) — el propio documento v6 deja esto como validación pendiente. Cambiar el tamaño es ajustar dos constantes, no un rediseño. |

## 4. Liquidación a transportistas (alcance nuevo desde el documento v6)

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 4.1 | Tarifa fija por viaje para cada transportista | Leonardo | Sin definir — Leonardo se lo llevó para pensar ("me lo llevo"). Regla simple: se paga por viaje realizado, sin 2×1 ni entrega unificada. |
| 4.2 | Construir cálculo/exportación de liquidación por viaje | Nosotros, una vez definida la tarifa | Nuevo — no hay código todavía (`Chofer` no tiene ningún campo de tarifa). |

## 5. Reglas de negocio sin definir

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 5.1 | Tratamiento de entregas fallidas | Leonardo / Cliente final | El estado `failed` ya se ve en SimpliRoute, falta definir qué hace **nuestro** sistema cuando pasa. |
| 5.2 | Tratamiento de cancelaciones | Leonardo / Cliente final | Sin definir. |
| 5.3 | Tratamiento de reentregas | Leonardo / Cliente final | Sin definir. |

## 6. Confirmado fuera de alcance (2da etapa, sin cambios)

| # | Tema | Motivo |
|---|---|---|
| 6.1 | Remitos (impresión definitiva) | Sigue en 2da etapa. |
| 6.2 | Medicamentos (importación y facturación) | Fuera de alcance de esta etapa. |
| 6.3 | Pago automático/integración contable de liquidación a transportistas | El *cálculo* sí entra ahora (sección 4) — el pago automático sigue afuera. |

## 7. Credenciales / cuentas externas

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 7.1 | Login con Google (`GOOGLE_CLIENT_ID`/`SECRET`) | Leonardo decide la cuenta | Gratis. |
| 7.2 | Storage de archivos Excel (Cloudflare R2) | Leonardo crea la cuenta | Baja prioridad. |

## 8. Infraestructura / despliegue

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 8.1 | Base de datos de test separada de prod (branch de Neon) | Nosotros | Hoy comparte la Neon de desarrollo. |
| 8.2 | Dominio propio | Leonardo (~$10-15/año) | Opcional. |
| 8.3 | Producción real (instancias pagas, sin "sleep") | Leonardo decide cuándo | Cuando el cliente final apruebe pasar de demo a uso real. |

## 9. Assets

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 9.1 | Logo real de MyM | Leonardo | Hoy la PWA usa un placeholder. |
