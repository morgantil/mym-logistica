# TEMAS PENDIENTES — vista consolidada de todo lo que falta

Última actualización: **2026-08-26**. Documento vivo, separado de `PENDIENTES.md`
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
| 1.4 | Cargar las localidades reales en "Localidades por zona" — **o** el atajo nuevo | Leonardo / Cliente final | Construido 2026-08-26: alternativa a cargar cientos de localidades — mapear directo las 11 zonas reales de SimpliRoute a un Cordón (`Facturación → Zonas tarifarias → "Cordón por zona de SimpliRoute"`), mucho menos trabajo. Falta que Leonardo/cliente final confirme que esas 11 zonas (dibujadas para logística) representan bien los Cordones de facturación, y las asigne. El mapeo por localidad sigue existiendo como fallback si una zona no está mapeada o el destinatario no tiene coordenadas. |

## 2. SimpliRoute — Zonas/Choferes/Vehículos construido el 2026-08-26 (revierte lo del 2026-08-17)

**Construido de punta a punta** con luz verde explícita de Leonardo. Principio
general para toda la integración con SimpliRoute, no solo para esto:
SimpliRoute es la fuente de verdad. En los recursos donde su API pública
permite CRUD (Choferes, Vehículos) MyM lee **y** edita directo contra
SimpliRoute. En los recursos de solo lectura (Zonas, y también Fleets/Skills
si algún día hicieran falta) MyM solo trae y muestra — cualquier alta o
edición de Zona sigue haciéndose en SimpliRoute. Detalle completo en
`DOCUMENTO TECNICO.md` historial 2026-08-26 y en el README de
`zonas-choferes/`.

| # | Pendiente | Dueño | Detalle |
|---|---|---|---|
| 2.1 | ~~Rediseñar el módulo `zonas-choferes/`~~ | ✅ Construido 2026-08-26 | Cache local (3 tablas nuevas) sincronizado desde SimpliRoute, refresco perezoso (TTL 15 min) + botón "Sincronizar ahora". Sin BullMQ/Redis — nunca se llegaron a usar en este proyecto, con 11/12/17 registros reales no hace falta un job real. Probado en navegador real (modo mock). |
| 2.2 | ~~Point-in-polygon para resolver zona~~ | ✅ Construido 2026-08-26 | `zonas-choferes/domain/punto-en-poligono.ts`, 8 tests. Se resuelve al mismo tiempo que CABA/Provincia, con fallback a coincidencia por localidad si no hay coordenadas o no matchea ninguna zona. |
| 2.3 | ~~Confirmar addon de Zonas habilitado~~ | ✅ Resuelto 2026-08-26 | Confirmado con `GET /v1/zones/` real: **11 zonas** activas. También `GET /v1/routes/vehicles/` (12) y `GET /v1/accounts/drivers/` (17). Sin ninguna escritura contra la cuenta real. |
| 2.4 | Probar escritura de Choferes/Vehículos contra la cuenta real | Leonardo (mismo patrón que 2.6) | `crearChofer`/`actualizarChofer`/`eliminarChofer`/`crearVehiculo`/`actualizarVehiculo`/`eliminarVehiculo` están construidos y con `SIMPLIROUTE_MOCK=true` funcionan de punta a punta, pero nunca se probaron contra la cuenta real — el entorno de Claude Code bloquea escrituras contra servicios externos reales (mismo bloqueo ya documentado para Destinatario). Si se quiere confirmar antes de confiar en esto en producción, correrlo manualmente. |
| 2.5 | Sincronización de estados (+ chofer/vehículo asignado a un pedido puntual) | Nosotros, bloqueado por 2.6 | Reemplaza los 6 estados propios (`EstadoPedido`) por los reales de SimpliRoute (`pending`, `completed`, `failed`, + un estado inicial nuevo). Afecta Facturación (hoy filtra por `ENTREGADO`) y Dashboard. Distinto del catálogo de Zonas/Choferes/Vehículos de arriba: acá se trata del chofer/vehículo que terminó atendiendo un pedido específico, que sigue sin estar disponible hasta que SimpliRoute arma la ruta en su Route Designer. |
| 2.6 | Nombre del estado inicial nuevo en SimpliRoute | Leonardo | SimpliRoute no tiene hoy un estado para "recién creado" — Leonardo/su equipo lo va a agregar en la configuración de la cuenta y pasarnos el nombre. Bloquea 2.5. |
| 2.7 | Probar el envío real de un pedido (crear una Visita) | Nosotros, coordinado con Leonardo | Única operación del adapter de Pedidos nunca probada contra la cuenta real — a propósito, es la única que podría aparecerle a un chofer real. Adapter ya construido. Hacer la prueba con cuidado y borrar el registro de prueba después. |
| 2.8 | Activar modo real (`SIMPLIROUTE_MOCK=false`) | Leonardo decide cuándo | Sin duda técnica pendiente — es 100% timing de negocio. |

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
| 4.1 | ~~Tarifa fija por viaje para cada transportista~~ | ✅ Construido 2026-08-26 | En vez de pedirle a Leonardo un número fijo, se construyó como un **monto configurable con historial de vigencia** (`Facturación → Transportistas`, mismo patrón que `PorcentajeSegundoServicio`) — lo carga/actualiza directamente quien haga Facturación, sin depender de código. Probado en navegador real. |
| 4.2 | Construir el *cálculo* de liquidación (cuántos viajes hizo cada chofer) | Nosotros, bloqueado | El monto ya está (4.1), pero contar viajes reales requiere sincronizar datos de Rutas/Viajes desde SimpliRoute — hoy no se sincronizan (ver sección 2, ítem 2.5). Sin eso, no hay de dónde sacar "cuántos viajes hizo Fulano este mes". |

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
| 7.1 | Login con Google (`GOOGLE_CLIENT_ID`/`SECRET`) | Leonardo decide | Leonardo está evaluando sacarlo de este MVP y quedarse solo con login local. Para eso hacía falta una forma de gestionar usuarios sin Google — construida 2026-08-26 (pantalla "Usuarios", rol Administración: alta con contraseña temporal, roles combinables, permisos por cliente, resetear contraseña, activar/desactivar). Decisión pendiente: sacar el botón "Continuar con Google" del login o dejarlo (el código sigue andando de cualquier manera, no hay que tocarlo para decidir esto). |
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
