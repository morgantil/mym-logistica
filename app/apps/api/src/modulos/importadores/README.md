# Importadores — pendiente de implementación

Responsable de: §4, §5, §6 del documento funcional (leer Excel, detectar cliente,
validar columnas, y usar `agruparLineasEnPedidos` de `modulos/pedidos/domain/pedido.ts`
para convertir líneas en pedidos).

## Por qué no está implementado todavía

Necesita **Strategy pattern**: un adapter por formato de archivo (Biosíntesis, Bella
Vista, Farmapal — §4 funcional). Implementarlo bien requiere tener a mano ejemplos
reales de los tres Excels para mapear columnas exactas, que todavía no revisamos en
detalle fila por fila. Armarlo a ciegas hoy sería adivinar el formato y probablemente
haya que rehacerlo.

## Forma prevista (cuando se ataque)

```
importadores/
  domain/
    importador-excel.port.ts   → interfaz ImportadorExcel { parsear(buffer): LineaExcelPanales[] }
  infrastructure/
    biosintesis.importador.ts
    bella-vista.importador.ts
    farmapal.importador.ts     → ticket opcional, ver §4 funcional
  application/
    importar-excel.service.ts  → detecta cliente (clientes.service), elige el
                                  importador correspondiente, agrupa (pedidos/domain),
                                  llama a destinatarios.service por cada grupo,
                                  persiste ImportacionExcel + Pedido + Producto.
  interface/
    importadores.controller.ts → POST /importaciones (multipart), sube el Excel
                                  original a R2 antes de procesarlo (trazabilidad).
```

Depende de: `ClientesService.detectarDesdeNombreArchivo`, `DestinatariosService.procesarDesdeImportacion`,
`agruparLineasEnPedidos`, y de tener resuelto el storage en R2 (ver `.env.example`).
