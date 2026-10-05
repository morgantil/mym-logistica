import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PrioridadPedido, TipoEnvase, TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listarZonasTarifarias } from "@/features/zonas-tarifarias/api";
import { actualizarTarifa, crearTarifa } from "./api";
import type { TarifaCliente } from "./tipos";

const ETIQUETAS_TIPO_SERVICIO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

const ETIQUETAS_TIPO_ENVASE: Record<TipoEnvase, string> = {
  [TipoEnvase.BOLSA]: "Bolsa",
  [TipoEnvase.BULTO]: "Bulto",
};

const ETIQUETAS_PRIORIDAD: Record<PrioridadPedido, string> = {
  [PrioridadPedido.NORMAL]: "Normal",
  [PrioridadPedido.FIN_DE_SEMANA]: "Fin de semana",
  [PrioridadPedido.URGENTE]: "Urgente",
  [PrioridadPedido.CRITICA]: "Crítica",
};

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Un solo formulario para crear y editar (decisión 2026-09-11: sin historial
// por vigencia, se edita el monto directo) — si viene `tarifa`, edita (zona/
// tipo/Bolsa-Bulto quedan fijos, son la identidad de la fila); si no, crea.
// Las zonas (CABA, Cordón 1/2/3, ...) son configurables — ver Zonas tarifarias.
export function TarifaFormSheet({
  clienteId,
  tipoServicioCliente,
  tarifa,
  onOpenChange,
}: {
  clienteId: string;
  // Decisión 2026-09-29 (Leonardo: tarifa de Pañales cargada por error en un
  // cliente de Medicamentos): si el cliente no es Ambos, el tipo de servicio
  // de la tarifa queda fijo al que tiene el cliente — no se ofrece elegir
  // el que no corresponde.
  tipoServicioCliente: TipoServicioCliente;
  tarifa: TarifaCliente | null | "nuevo";
  onOpenChange: (abierto: boolean) => void;
}) {
  const abierto = tarifa !== null;
  const editando = tarifa !== null && tarifa !== "nuevo";
  const tipoServicioFijo =
    tipoServicioCliente === TipoServicioCliente.PANAL
      ? TipoServicio.PANAL
      : tipoServicioCliente === TipoServicioCliente.MEDICAMENTO
        ? TipoServicio.MEDICAMENTO
        : null;

  const { data: zonas } = useQuery({
    queryKey: ["zonas-tarifarias"],
    queryFn: listarZonasTarifarias,
  });
  const zonasActivas = (zonas ?? []).filter((zona) => zona.activa);

  const [zonaTarifariaId, setZonaTarifariaId] = useState("");
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>(TipoServicio.PANAL);
  const [tipoEnvase, setTipoEnvase] = useState<TipoEnvase | "">("");
  const [prioridad, setPrioridad] = useState<PrioridadPedido>(PrioridadPedido.NORMAL);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setZonaTarifariaId(tarifa.zonaTarifariaId);
      setTipoServicio(tarifa.tipoServicio);
      setTipoEnvase(tarifa.tipoEnvase ?? "");
      setPrioridad(tarifa.prioridad);
      setMonto(String(tarifa.monto));
    } else {
      setZonaTarifariaId("");
      setTipoServicio(tipoServicioFijo ?? TipoServicio.PANAL);
      setTipoEnvase("");
      setPrioridad(PrioridadPedido.NORMAL);
      setMonto("");
    }
    setError(null);
  }, [tarifa, editando, tipoServicioFijo]);

  const esMedicamento = tipoServicio === TipoServicio.MEDICAMENTO;

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: () => {
      if (editando) {
        return actualizarTarifa(tarifa.id, { monto: Number(monto) });
      }
      return crearTarifa({
        clienteId,
        zonaTarifariaId,
        tipoServicio,
        tipoEnvase: esMedicamento && tipoEnvase ? tipoEnvase : undefined,
        prioridad,
        monto: Number(monto),
      });
    },
    onSuccess: () => {
      toast.success(editando ? "Tarifa actualizada." : "Tarifa cargada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifas", clienteId] });
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
          <SheetTitle>{editando ? "Editar tarifa" : "Nueva tarifa"}</SheetTitle>
          <SheetDescription>
            {editando
              ? "La zona, el tipo de servicio y la prioridad de una tarifa no se pueden cambiar — si hace falta otra combinación, cargala como una tarifa nueva."
              : "Una tarifa por zona, tipo de servicio y prioridad — para editarla después, entrá de nuevo a esta pantalla."}
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
            <FilaFormulario label="Zona" htmlFor="zona-tarifa" anchoEtiqueta="140px">
              {editando ? (
                <p className="text-sm">{tarifa.zonaTarifariaNombre ?? tarifa.zonaTarifariaId}</p>
              ) : (
                <Select value={zonaTarifariaId} onValueChange={setZonaTarifariaId}>
                  <SelectTrigger id="zona-tarifa">
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

            <FilaFormulario label="Tipo de servicio" htmlFor="tipo-servicio-tarifa" anchoEtiqueta="140px">
              {editando || tipoServicioFijo !== null ? (
                <p className="text-sm">{ETIQUETAS_TIPO_SERVICIO[tipoServicio]}</p>
              ) : (
                <Select
                  value={tipoServicio}
                  onValueChange={(valor) => {
                    setTipoServicio(valor as TipoServicio);
                    setTipoEnvase("");
                  }}
                >
                  <SelectTrigger id="tipo-servicio-tarifa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TipoServicio).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {ETIQUETAS_TIPO_SERVICIO[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FilaFormulario>

            {esMedicamento &&
              (editando ? (
                <FilaFormulario label="Bolsa / Bulto" htmlFor="tipo-envase-tarifa" anchoEtiqueta="140px">
                  <p className="text-sm">{tipoEnvase ? ETIQUETAS_TIPO_ENVASE[tipoEnvase] : "—"}</p>
                </FilaFormulario>
              ) : (
                <FilaFormulario label="Bolsa / Bulto" htmlFor="tipo-envase-tarifa" anchoEtiqueta="140px">
                  <Select value={tipoEnvase} onValueChange={(valor) => setTipoEnvase(valor as TipoEnvase)}>
                    <SelectTrigger id="tipo-envase-tarifa">
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TipoEnvase).map((valor) => (
                        <SelectItem key={valor} value={valor}>
                          {ETIQUETAS_TIPO_ENVASE[valor]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilaFormulario>
              ))}

            <FilaFormulario label="Prioridad" htmlFor="prioridad-tarifa" anchoEtiqueta="140px">
              {editando ? (
                <p className="text-sm">{ETIQUETAS_PRIORIDAD[prioridad]}</p>
              ) : (
                <Select value={prioridad} onValueChange={(valor) => setPrioridad(valor as PrioridadPedido)}>
                  <SelectTrigger id="prioridad-tarifa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PrioridadPedido).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {ETIQUETAS_PRIORIDAD[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FilaFormulario>

            <FilaFormulario label="Monto" htmlFor="monto-tarifa" anchoEtiqueta="140px">
              <Input
                id="monto-tarifa"
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
            <Button
              type="submit"
              disabled={mutacion.isPending || !zonaTarifariaId || (esMedicamento && !tipoEnvase)}
            >
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
