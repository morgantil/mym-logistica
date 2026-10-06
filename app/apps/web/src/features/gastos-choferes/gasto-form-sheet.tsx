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
import { listarChoferes } from "@/features/zonas-choferes/api";
import { crearGasto, actualizarGasto } from "./api";
import type { GastoChofer } from "./tipos";

const ETIQUETA_TIPO: Record<TipoGastoChofer, string> = {
  [TipoGastoChofer.COMBUSTIBLE]: "Combustible",
  [TipoGastoChofer.PEAJE]: "Peaje",
};

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTipo(gasto?.tipo ?? TipoGastoChofer.COMBUSTIBLE);
    setFecha(gasto ? gasto.fecha.slice(0, 10) : "");
    setMonto(gasto ? String(gasto.monto) : "");
    setChoferId(gasto?.choferId ?? "");
    setProveedor(gasto?.proveedor ?? "");
    setComprobante(gasto?.comprobante ?? "");
    setError(null);
  }, [gasto]);

  const { data: choferes } = useQuery({ queryKey: ["zonas-choferes", "choferes"], queryFn: listarChoferes });

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      const datos = {
        tipo,
        fecha,
        monto: Number(monto),
        choferId,
        proveedor: proveedor || undefined,
        comprobante: comprobante || undefined,
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

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 px-4">
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
            <FilaFormulario label="Fecha" htmlFor="fecha-gasto" anchoEtiqueta="140px">
              <Input
                id="fecha-gasto"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
            <FilaFormulario label="Monto" htmlFor="monto-gasto" anchoEtiqueta="140px">
              <Input
                id="monto-gasto"
                type="number"
                min="0"
                step="0.01"
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
            <FilaFormulario label="Proveedor" htmlFor="proveedor-gasto" anchoEtiqueta="140px">
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
                placeholder="Opcional"
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
          </TablaFormulario>

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
