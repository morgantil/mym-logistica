import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoEnvase } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listarZonasTarifarias } from "@/features/zonas-tarifarias/api";
import { actualizarMontoUnificadoMedicamento, crearMontoUnificadoMedicamento } from "./api";
import type { MontoUnificadoMedicamento } from "./tipos";

const ETIQUETAS_TIPO_ENVASE: Record<TipoEnvase, string> = {
  [TipoEnvase.BOLSA]: "Bolsa",
  [TipoEnvase.BULTO]: "Bulto",
};

// "" (el valor por defecto del Select) representa tipoEnvase: null — el
// monto aplica igual a Bolsa y Bulto. Se puede diferenciar más adelante
// cargando una fila puntual para cada envase, sin otra migración.
const VALOR_AMBOS = "AMBOS";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Monto fijo del lado medicamento en una entrega unificada — decisión
// 2026-09-12 (Leonardo: "un plus editable por llevar el medicamento de
// paso"), reemplaza al % que usaba antes. Varía por zona — para la mayoría
// de los clientes alcanza con CABA/Provincia, pero queda abierto a cargar
// una fila por cada Cordón cuando haga falta más detalle (ej. Bella Vista
// Medicamentos). Mismo patrón crear+editar que TarifaFormSheet.
export function MontoUnificadoMedicamentoFormSheet({
  clienteId,
  monto: montoExistente,
  onOpenChange,
}: {
  clienteId: string;
  monto: MontoUnificadoMedicamento | null | "nuevo";
  onOpenChange: (abierto: boolean) => void;
}) {
  const abierto = montoExistente !== null;
  const editando = montoExistente !== null && montoExistente !== "nuevo";

  const { data: zonas } = useQuery({
    queryKey: ["zonas-tarifarias"],
    queryFn: listarZonasTarifarias,
  });
  const zonasActivas = (zonas ?? []).filter((zona) => zona.activa);

  const [zonaTarifariaId, setZonaTarifariaId] = useState("");
  const [tipoEnvase, setTipoEnvase] = useState<TipoEnvase | typeof VALOR_AMBOS>(VALOR_AMBOS);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setZonaTarifariaId(montoExistente.zonaTarifariaId);
      setTipoEnvase(montoExistente.tipoEnvase ?? VALOR_AMBOS);
      setMonto(String(montoExistente.monto));
    } else {
      setZonaTarifariaId("");
      setTipoEnvase(VALOR_AMBOS);
      setMonto("");
    }
    setError(null);
  }, [montoExistente, editando]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      if (editando) {
        return actualizarMontoUnificadoMedicamento(montoExistente.id, { monto: Number(monto) });
      }
      return crearMontoUnificadoMedicamento({
        clienteId,
        zonaTarifariaId,
        tipoEnvase: tipoEnvase === VALOR_AMBOS ? undefined : tipoEnvase,
        monto: Number(monto),
      });
    },
    onSuccess: () => {
      toast.success(editando ? "Monto actualizado." : "Monto cargado.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "montos-unificado-medicamento", clienteId] });
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
          <SheetTitle>{editando ? "Editar monto" : "Nuevo monto"} de medicamento en unificado</SheetTitle>
          <SheetDescription>
            {editando
              ? "La zona y el envase de un monto no se pueden cambiar — si hace falta otra combinación, cargalo como un monto nuevo."
              : "Un monto fijo por zona (y opcionalmente por Bolsa/Bulto) — se suma al 100% de la tarifa del pañal en una entrega unificada."}
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
            <FilaFormulario label="Zona" htmlFor="zona-monto-unificado" anchoEtiqueta="140px">
              {editando ? (
                <p className="text-sm">{montoExistente.zonaTarifariaNombre ?? montoExistente.zonaTarifariaId}</p>
              ) : (
                <Select value={zonaTarifariaId} onValueChange={setZonaTarifariaId}>
                  <SelectTrigger id="zona-monto-unificado">
                    <SelectValue placeholder="Elegir zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonasActivas.map((zona) => (
                      <SelectItem key={zona.id} value={zona.id}>
                        {zona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FilaFormulario>

            <FilaFormulario label="Bolsa / Bulto" htmlFor="envase-monto-unificado" anchoEtiqueta="140px">
              {editando ? (
                <p className="text-sm">
                  {montoExistente.tipoEnvase ? ETIQUETAS_TIPO_ENVASE[montoExistente.tipoEnvase] : "Ambos"}
                </p>
              ) : (
                <Select value={tipoEnvase} onValueChange={(valor) => setTipoEnvase(valor as TipoEnvase)}>
                  <SelectTrigger id="envase-monto-unificado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VALOR_AMBOS}>Ambos (Bolsa y Bulto)</SelectItem>
                    {Object.values(TipoEnvase).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {ETIQUETAS_TIPO_ENVASE[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FilaFormulario>

            <FilaFormulario label="Monto" htmlFor="monto-unificado-medicamento" anchoEtiqueta="140px">
              <Input
                id="monto-unificado-medicamento"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
          </TablaFormulario>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={mutacion.isPending || !zonaTarifariaId}>
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
