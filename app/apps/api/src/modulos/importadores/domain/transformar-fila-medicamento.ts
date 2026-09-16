import { TipoEnvase } from "@mym/shared-types";
import { LineaExcelImportada } from "../../pedidos/domain/pedido";
import { MapeoColumnas } from "./campo-canonico";
import { parseEnvaseDesdeTexto } from "./envase-medicamento-importado";
import { FilaExcelCruda } from "./lector-excel.port";
import { aTexto, extraerNotaDeCeldaFecha } from "./transformar-fila";

export interface ResultadoTransformarFilaMedicamento {
  valida: boolean;
  // Plural a propósito: a diferencia de pañales (una fila = un producto), un
  // pedido de Bella Vista puede traer una fila con Bulto Y Bolsa a la vez
  // (dos columnas de cantidad, ver TEMAS_PENDIENTES.md §13.14) — eso son DOS
  // líneas de producto que se agrupan igual que si fueran dos filas
  // separadas del Excel (mismo mecanismo de Farmapal/Farmaet: varias líneas
  // con el mismo afiliado+dirección+fecha se agrupan en un Pedido).
  lineas: LineaExcelImportada[];
  errores: string[];
}

function aNumeroOCero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  const numero = typeof valor === "number" ? valor : Number(String(valor).trim());
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function aBooleanoSiNo(valor: unknown): boolean | null {
  const texto = aTexto(valor);
  if (!texto) return null;
  const normalizado = texto.trim().toUpperCase();
  if (normalizado === "SI" || normalizado === "SÍ") return true;
  if (normalizado === "NO") return false;
  return null;
}

const DESCRIPCION_GENERICA: Record<TipoEnvase, string> = {
  [TipoEnvase.BOLSA]: "Medicamentos - Bolsa",
  [TipoEnvase.BULTO]: "Medicamentos - Bulto",
};

// Toma UNA fila cruda de un Excel de medicamentos (Farmaet o Bella Vista —
// mismo motor genérico, distinto mapeo por cliente, ver
// TEMAS_PENDIENTES.md §13.14) y la convierte en 1 o 2 líneas de producto
// SINTÉTICAS: ninguno de los dos archivos reales dice qué medicamento es
// (§13.19, confirmado con Leonardo — "un producto genérico por pedido, le
// pondría los bultos o bolsas"), así que la "descripción de producto" y la
// "cantidad" no se leen de ninguna columna, se derivan de Bolsa/Bulto:
//
// - Farmaet: una fila = un remito = una unidad de Bolsa O Bulto (columna
//   "Empresa", texto libre tipo "M&M BOLSA") → 1 línea.
// - Bella Vista: una fila puede traer BULTO y BOLSA a la vez, cada uno con
//   su cantidad (columnas numéricas) → hasta 2 líneas, una por cada
//   cantidad > 0. Ejemplo real verificado: Bulto=4, Bolsa=1 → imprimir 4
//   etiquetas de Bulto + 1 de Bolsa, facturar 5 unidades (Leonardo,
//   2026-09-15).
//
// La regla de facturación "Bolsa+Bulto en un pedido → se factura todo como
// Bulto" (Guia Arbet paso 2) NO se aplica acá: ya está resuelta por
// `determinarClasificacionMedicamento`, que corre sobre el pedido agrupado
// completo (facturacion/domain/clasificacion-medicamento.ts) — esta función
// solo prepara las líneas, no decide la clasificación final.
export function transformarFilaMedicamento(
  filaCruda: FilaExcelCruda,
  mapeo: MapeoColumnas,
  clienteId: string,
  fechaEntregaLote: string,
): ResultadoTransformarFilaMedicamento {
  const errores: string[] = [];

  const leer = (campo: keyof MapeoColumnas) => {
    const encabezado = mapeo[campo];
    return encabezado ? filaCruda[encabezado] : undefined;
  };

  const numeroAfiliado = aTexto(leer("numeroAfiliado"));
  const destinatario = aTexto(leer("destinatario"));
  const direccion = aTexto(leer("direccion"));
  const localidad = aTexto(leer("localidad"));
  const notaFecha = extraerNotaDeCeldaFecha(leer("fechaEntrega"));
  const telefono = aTexto(leer("telefono"));
  const ticket = aTexto(leer("ticket"));
  const receta = aTexto(leer("receta"));
  const tipoPedido = aTexto(leer("tipoPedido"));
  const retiroDeReceta = aBooleanoSiNo(leer("retiroDeReceta"));
  const tiempoDeEntrega = aTexto(leer("tiempoDeEntrega"));
  const horarioEntrega = aTexto(leer("horarioEntrega"));

  if (!numeroAfiliado) errores.push("Falta número de afiliado.");
  if (!destinatario) errores.push("Falta destinatario.");
  if (!direccion) errores.push("Falta dirección.");
  if (!localidad) errores.push("Falta localidad.");

  // Bella Vista (cantidadBulto/cantidadBolsa) tiene prioridad sobre Farmaet
  // (envaseTexto) si por algún motivo un cliente tuviera las dos mapeadas —
  // no debería pasar en la práctica, cada cliente usa una sola forma.
  const cantidadBulto = aNumeroOCero(leer("cantidadBulto"));
  const cantidadBolsa = aNumeroOCero(leer("cantidadBolsa"));
  const entradasEnvase: { cantidad: number; tipoEnvase: TipoEnvase }[] = [];
  if (cantidadBulto > 0) entradasEnvase.push({ cantidad: cantidadBulto, tipoEnvase: TipoEnvase.BULTO });
  if (cantidadBolsa > 0) entradasEnvase.push({ cantidad: cantidadBolsa, tipoEnvase: TipoEnvase.BOLSA });

  if (entradasEnvase.length === 0) {
    const envaseTexto = parseEnvaseDesdeTexto(aTexto(leer("envaseTexto")));
    if (envaseTexto) entradasEnvase.push({ cantidad: 1, tipoEnvase: envaseTexto });
  }

  if (entradasEnvase.length === 0) {
    errores.push("No se pudo determinar Bolsa o Bulto para esta línea.");
  }

  if (errores.length > 0) {
    return { valida: false, lineas: [], errores };
  }

  const base = {
    clienteId,
    numeroAfiliado: numeroAfiliado!,
    destinatario: destinatario!,
    direccion: direccion!,
    localidad: localidad!,
    telefono,
    fechaEntrega: fechaEntregaLote,
    notaFecha,
    codigoProducto: null,
    receta,
    tipoPedido,
    retiroDeReceta,
    tiempoDeEntrega,
    horarioEntrega,
  };

  return {
    valida: true,
    errores: [],
    lineas: entradasEnvase.map((entrada) => ({
      ...base,
      // El remito/ticket es por FILA del Excel, no por línea sintética — si
      // una fila de Bella Vista se parte en Bulto+Bolsa, las dos comparten
      // el mismo remito (es la misma entrega real, un solo número de origen).
      ticket,
      cantidad: entrada.cantidad,
      tipoEnvase: entrada.tipoEnvase,
      descripcionProducto: DESCRIPCION_GENERICA[entrada.tipoEnvase],
    })),
  };
}
