import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoGastoChofer } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { aNumeroLocal } from "@/lib/numero-local";
import { listarChoferes } from "@/features/zonas-choferes/api";
import { crearGasto, actualizarGasto } from "./api";
import type { DatosFiscalesCombustible, GastoChofer } from "./tipos";

const ETIQUETA_TIPO: Record<TipoGastoChofer, string> = {
  [TipoGastoChofer.COMBUSTIBLE]: "Combustible",
  [TipoGastoChofer.PEAJE]: "Peaje",
};

// Error real corregido 2026-10-07 (reunión con Leonardo): el archivo real de
// combustible trae un comprobante fiscal completo (19 columnas más) — acá va
// un input por cada una, visible solo para Combustible (Peaje nunca las
// tiene, confirmado "ese perfecto" tal como está). Campo → tipo de input y
// etiqueta, mismos nombres que las columnas reales del Excel.
const CAMPOS_FISCALES: { campo: keyof DatosFiscalesCombustible; etiqueta: string; tipo: "text" | "number" | "date" }[] = [
  { campo: "fechaRecepcion", etiqueta: "Fecha Recepción", tipo: "date" },
  { campo: "comprobanteCodigo", etiqueta: "Cpbte", tipo: "text" },
  { campo: "comprobanteTipo", etiqueta: "Tipo Cpbte", tipo: "text" },
  { campo: "comprobanteSucursal", etiqueta: "Suc.", tipo: "text" },
  { campo: "comprobanteNumero", etiqueta: "Número", tipo: "text" },
  { campo: "tipoDocumento", etiqueta: "Tipo Doc.", tipo: "text" },
  { campo: "cuit", etiqueta: "CUIT", tipo: "text" },
  { campo: "domicilio", etiqueta: "Domicilio", tipo: "text" },
  { campo: "codigoPostal", etiqueta: "C.P.", tipo: "text" },
  { campo: "provincia", etiqueta: "Pcia", tipo: "text" },
  { campo: "condicionFiscal", etiqueta: "Cond Fisc", tipo: "text" },
  { campo: "codigoNeto", etiqueta: "Cód. Neto", tipo: "text" },
  { campo: "netoGravado", etiqueta: "Neto Gravado", tipo: "number" },
  { campo: "alicuota", etiqueta: "Alíc.", tipo: "number" },
  { campo: "ivaLiquidado", etiqueta: "IVA Liquidado", tipo: "number" },
  { campo: "ivaCredito", etiqueta: "IVA Crédito", tipo: "number" },
  { campo: "codigoNgEx", etiqueta: "Cód. NG/EX", tipo: "text" },
  { campo: "conceptosNgEx", etiqueta: "Conceptos NG/EX", tipo: "number" },
  { campo: "codigoPR", etiqueta: "Cód. P/R", tipo: "text" },
  { campo: "percepcionRetencion", etiqueta: "Perc./Ret.", tipo: "number" },
  { campo: "provinciaPR", etiqueta: "Pcia P/R", tipo: "text" },
];

type EstadoFiscal = Record<keyof DatosFiscalesCombustible, string>;

const FISCAL_VACIO: EstadoFiscal = CAMPOS_FISCALES.reduce(
  (acc, { campo }) => ({ ...acc, [campo]: "" }),
  {} as EstadoFiscal,
);

function fiscalDesdeGasto(gasto: GastoChofer | null): EstadoFiscal {
  if (!gasto) return FISCAL_VACIO;
  const resultado = { ...FISCAL_VACIO };
  for (const { campo, tipo } of CAMPOS_FISCALES) {
    const valor = gasto[campo];
    if (valor === null) continue;
    resultado[campo] = tipo === "date" ? String(valor).slice(0, 10) : String(valor);
  }
  return resultado;
}

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// ABM manual (item 14.1 TEMAS_PENDIENTES.md, reunión 2026-10-06) — además
// del import en bloque del Excel de la tarjeta, un gasto suelto se puede
// cargar/editar a mano. El Chofer siempre se elige de este desplegable
// (nunca texto libre) — pedido explícito de la reunión.
export function GastoFormSheet({
  gasto,
  abierto,
  onOpenChange,
}: {
  gasto: GastoChofer | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}) {
  const editando = gasto !== null;

  const [tipo, setTipo] = useState<TipoGastoChofer>(TipoGastoChofer.COMBUSTIBLE);
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState("");
  const [choferId, setChoferId] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [fiscal, setFiscal] = useState<EstadoFiscal>(FISCAL_VACIO);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTipo(gasto?.tipo ?? TipoGastoChofer.COMBUSTIBLE);
    setFecha(gasto ? gasto.fecha.slice(0, 10) : "");
    setMonto(gasto ? String(gasto.monto) : "");
    setChoferId(gasto?.choferId ?? "");
    setProveedor(gasto?.proveedor ?? "");
    setComprobante(gasto?.comprobante ?? "");
    setFiscal(fiscalDesdeGasto(gasto));
    setError(null);
  }, [gasto]);

  const { data: choferes } = useQuery({ queryKey: ["zonas-choferes", "choferes"], queryFn: listarChoferes });

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      const datosFiscales: Partial<DatosFiscalesCombustible> = {};
      if (tipo === TipoGastoChofer.COMBUSTIBLE) {
        for (const { campo, tipo: tipoInput } of CAMPOS_FISCALES) {
          const valor = fiscal[campo];
          if (valor === "") continue;
          datosFiscales[campo] = (tipoInput === "number" ? aNumeroLocal(valor) : valor) as never;
        }
      }
      const datos = {
        tipo,
        fecha,
        monto: aNumeroLocal(monto),
        choferId,
        proveedor: proveedor || undefined,
        comprobante: comprobante || undefined,
        ...datosFiscales,
      };
      return editando ? actualizarGasto(gasto.id, datos) : crearGasto(datos);
    },
    onSuccess: () => {
      toast.success(editando ? "Gasto actualizado." : "Gasto creado.");
      queryClient.invalidateQueries({ queryKey: ["gastos-choferes"] });
      setError(null);
      onOpenChange(false);
    },
    onError: (err) => setError(mensajeError(err)),
  });

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    mutacion.mutate();
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? "Editar gasto" : "Nuevo gasto"}</SheetTitle>
          <SheetDescription>
            Combustible o peaje cargado a mano, además de lo que ya trae el import del Excel de la tarjeta.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 overflow-y-auto px-4">
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <TablaFormulario>
            <FilaFormulario label="Tipo" htmlFor="tipo-gasto" anchoEtiqueta="140px">
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoGastoChofer)} disabled={mutacion.isPending}>
                <SelectTrigger id="tipo-gasto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TipoGastoChofer).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {ETIQUETA_TIPO[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilaFormulario>
            <FilaFormulario label="Fecha Emisión" htmlFor="fecha-gasto" anchoEtiqueta="140px">
              <Input
                id="fecha-gasto"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
            <FilaFormulario label="Total" htmlFor="monto-gasto" anchoEtiqueta="140px">
              <Input
                id="monto-gasto"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
            <FilaFormulario label="Chofer" htmlFor="chofer-gasto" anchoEtiqueta="140px">
              <Select value={choferId} onValueChange={setChoferId} disabled={mutacion.isPending}>
                <SelectTrigger id="chofer-gasto">
                  <SelectValue placeholder="Elegí un chofer" />
                </SelectTrigger>
                <SelectContent>
                  {choferes?.map((chofer) => (
                    <SelectItem key={chofer.id} value={String(chofer.id)}>
                      {chofer.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilaFormulario>
            <FilaFormulario
              label="Razón Social/Denominación Proveedor"
              htmlFor="proveedor-gasto"
              anchoEtiqueta="140px"
            >
              <Input
                id="proveedor-gasto"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Opcional"
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
            <FilaFormulario label="Comprobante" htmlFor="comprobante-gasto" anchoEtiqueta="140px">
              <Input
                id="comprobante-gasto"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Opcional (ej. A 00007-9739)"
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
          </TablaFormulario>

          {tipo === TipoGastoChofer.COMBUSTIBLE && (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                Comprobante fiscal (opcional — mismas columnas que el Excel de la tarjeta)
              </p>
              <TablaFormulario>
                {CAMPOS_FISCALES.map(({ campo, etiqueta, tipo: tipoInput }) => (
                  <FilaFormulario key={campo} label={etiqueta} htmlFor={`${campo}-gasto`} anchoEtiqueta="140px">
                    <Input
                      id={`${campo}-gasto`}
                      type={tipoInput === "number" ? "text" : tipoInput}
                      inputMode={tipoInput === "number" ? "decimal" : undefined}
                      value={fiscal[campo]}
                      onChange={(e) => setFiscal((actual) => ({ ...actual, [campo]: e.target.value }))}
                      placeholder={tipoInput === "number" ? "Opcional (ej. 9372,24)" : "Opcional"}
                      disabled={mutacion.isPending}
                    />
                  </FilaFormulario>
                ))}
              </TablaFormulario>
            </>
          )}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={mutacion.isPending || !choferId}>
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
