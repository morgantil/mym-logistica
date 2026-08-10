# Importadores

Implementa §4, §5, §6, §7, §8, §11 del documento funcional: subir un Excel,
detectar el cliente, mapear columnas, agrupar líneas en pedidos, actualizar el
padrón de destinatarios y crear los pedidos.

## La decisión clave: mapeo de columnas genérico, no un parser por cliente

Ver DOCUMENTO TECNICO.md, historial 2026-08-09 ("mapeo genérico y data-driven").
En vez de una clase por formato (Biosíntesis/Bella Vista/Farmapal), hay:

1. **`domain/campo-canonico.ts`** — qué campos necesita el sistema, sin importar
   cómo los llame cada cliente.
2. **`domain/diccionario-sinonimos.ts`** — nombres de columna conocidos por
   campo. Es el único lugar que normalmente hace falta tocar para un cliente
   nuevo "parecido" a los que ya conocemos.
3. **`domain/mapeo-columnas.ts`** (`intentarMapeoAutomatico`) — matchea los
   encabezados reales del Excel contra el diccionario. Si falta algo, lo dice.
4. **`PerfilImportacion`** (Prisma) — el mapeo confirmado (automático o manual)
   queda guardado por cliente. La primera importación de un cliente nuevo
   puede requerir una confirmación manual una sola vez; las siguientes no.

## Flujo end-to-end (`ImportarExcelService`)

```
POST /importaciones (archivo + clienteId opcional)
  → detectar cliente (o pedirlo si no se pudo)
  → leer Excel (LectorExcelPort, adapter con exceljs)
  → resolver mapeo (perfil guardado → automático → manual)
  → si falta mapeo manual: responde { estado: "requiereMapeoManual", ... } y NO persiste nada
  → si el mapeo está completo:
      - transforma cada fila (errores puntuales no frenan el resto — §6)
      - agrupa líneas en pedidos (mismo afiliado+dirección+fecha — §7)
      - por cada grupo: actualiza padrón de destinatarios (§8),
        detecta diferencia de dirección (§11, se usa "solo este pedido" por
        defecto hasta que exista una pantalla de resolución en Etapa 2),
        crea el Pedido + Productos
      - devuelve { estado: "completada", pedidosCreados, filasConError, ... }

POST /importaciones/confirmar-mapeo (mismo archivo + clienteId + mapeoManual)
  → segundo paso cuando el automático no alcanzó
```

## Lo que falta a propósito

- **Storage en R2**: `ImportacionExcel.urlArchivo` queda `null` — no hay
  credenciales configuradas todavía (ver `.env.example`). El archivo se
  procesa en memoria y no se conserva. Cuando se configure R2, subir el
  buffer antes de procesar y completar esa columna.
- **Pantalla de resolución de dirección** (§11, las 3 opciones): hoy se aplica
  automáticamente "usar solo este pedido" y se deja una observación en el
  pedido. Falta el endpoint/pantalla para que un usuario elija de verdad —
  es trabajo de Etapa 2 (Revisión antes de enviar, §17).
- **Sin probar contra los 3 Excel reales todavía** — el diccionario de
  sinónimos es un punto de partida razonable, no una certeza. Cuando
  aparezcan los archivos de Biosíntesis/Bella Vista/Farmapal, correrlos es la
  prueba de fuego real.
- **Medicamentos** (§37): mismo motor, pero casi seguro va a necesitar sumar
  sinónimos nuevos al diccionario — no debería requerir tocar la lógica.
