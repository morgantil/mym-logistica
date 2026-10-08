import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PrioridadPedido, TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { aNumeroLocal } from "@/lib/numero-local";
import { listarClientesActivos } from "@/features/clientes/api";
import {
  actualizarMontoUnificadoMedicamento,
  actualizarTarifa,
  aplicarAjustePorcentual,
  crearCombinacion,
  eliminarCombinacion,
  listarCombinaciones,
  listarMontosUnificadoMedicamento,
  listarPorcentajes,
  listarTarifas,
} from "./api";
import { formatearMonto } from "./formato";
import { MontoUnificadoMedicamentoFormSheet } from "./monto-unificado-medicamento-form-sheet";
import { PorcentajeFormSheet } from "./porcentaje-form-sheet";
import { TarifaFormSheet } from "./tarifa-form-sheet";
import type { MontoUnificadoMedicamento, TarifaCliente } from "./tipos";

const ETIQUETA_TIPO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

const ETIQUETA_PRIORIDAD: Record<PrioridadPedido, string> = {
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
  return "No se pudo habilitar. Probá de nuevo en unos segundos.";
}

function descripcionTipoTarifa(tarifa: { tipoServicio: TipoServicio; tipoEnvase: string | null }): string {
  if (tarifa.tipoServicio === TipoServicio.PANAL) return ETIQUETA_TIPO.PANAL;
  return `${ETIQUETA_TIPO.MEDICAMENTO} — ${tarifa.tipoEnvase === "BULTO" ? "Bulto" : "Bolsa"}`;
}

export function TarifasTab({ clienteId }: { clienteId: string | null }) {
  const [tarifaEnEdicion, setTarifaEnEdicion] = useState<TarifaCliente | "nuevo" | null>(null);
  const [porcentajeAbierto, setPorcentajeAbierto] = useState(false);
  const [montoEnEdicion, setMontoEnEdicion] = useState<MontoUnificadoMedicamento | "nuevo" | null>(null);
  const queryClient = useQueryClient();

  // Para restringir "Nueva tarifa"/"Nuevo monto" al tipo de servicio real del
  // cliente (decisión 2026-09-29, ver FacturacionService.validarTipoServicioDeCliente
  // en el backend — acá es la misma regla, pero evitando el viaje al servidor
  // para avisar).
  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });
  const clienteActual = clientes?.find((c) => c.id === clienteId) ?? null;

  const { data: tarifas, isLoading: cargandoTarifas } = useQuery({
    queryKey: ["facturacion", "tarifas", clienteId],
    queryFn: () => listarTarifas(clienteId!),
    enabled: clienteId !== null,
  });
  const { data: porcentajes, isLoading: cargandoPorcentajes } = useQuery({
    queryKey: ["facturacion", "porcentajes", clienteId],
    queryFn: () => listarPorcentajes(clienteId!),
    enabled: clienteId !== null,
  });
  const porcentajeActual = porcentajes?.[0] ?? null;

  const { data: montosUnificado, isLoading: cargandoMontosUnificado } = useQuery({
    queryKey: ["facturacion", "montos-unificado-medicamento", clienteId],
    queryFn: () => listarMontosUnificadoMedicamento(clienteId!),
    enabled: clienteId !== null,
  });

  const mutacionActivaTarifa = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) => actualizarTarifa(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifas", clienteId] }),
    onError: () => toast.error("No se pudo cambiar el estado."),
  });

  const mutacionActivaMontoUnificado = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      actualizarMontoUnificadoMedicamento(id, { activa }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["facturacion", "montos-unificado-medicamento", clienteId] }),
    onError: () => toast.error("No se pudo cambiar el estado."),
  });

  // Decisión 2026-10-04 (reunión con el cliente): "% de ajuste" — actualiza
  // de una el monto base de todas las tarifas y montos ACTIVOS de este cliente.
  const [porcentajeAjuste, setPorcentajeAjuste] = useState("");
  const mutacionAjuste = useMutation({
    mutationFn: () => aplicarAjustePorcentual(clienteId!, aNumeroLocal(porcentajeAjuste)),
    onSuccess: ({ tarifasActualizadas, montosActualizados }) => {
      toast.success(`Ajustadas ${tarifasActualizadas} tarifa(s) y ${montosActualizados} monto(s).`);
      setPorcentajeAjuste("");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifas", clienteId] });
      queryClient.invalidateQueries({ queryKey: ["facturacion", "montos-unificado-medicamento", clienteId] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  if (clienteId === null) {
    return <p className="text-sm text-muted-foreground">Elegí un cliente arriba para ver sus tarifas.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <h2 className="font-medium">Ajuste de tarifas por porcentaje</h2>
        <p className="text-sm text-muted-foreground">
          Actualiza de una todas las tarifas por zona y los montos de medicamento en unificado que estén{" "}
          <strong>activos</strong> para este cliente, multiplicando el valor que ya tienen cargado. Un porcentaje
          negativo es una rebaja.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">% de ajuste</span>
            <Input
              type="text"
              inputMode="decimal"
              value={porcentajeAjuste}
              onChange={(e) => setPorcentajeAjuste(e.target.value)}
              placeholder="Ej. 10 o -5"
              className="w-32"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              porcentajeAjuste.trim() === "" || Number.isNaN(aNumeroLocal(porcentajeAjuste)) || mutacionAjuste.isPending
            }
            onClick={() => {
              if (
                window.confirm(
                  `¿Aplicar un ${porcentajeAjuste}% a todas las tarifas y montos ACTIVOS de este cliente? No se puede deshacer con un clic.`,
                )
              ) {
                mutacionAjuste.mutate();
              }
            }}
          >
            {mutacionAjuste.isPending ? "Aplicando…" : "Aplicar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tarifas por zona</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setTarifaEnEdicion("nuevo")}>
            Nueva tarifa
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoTarifas ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : tarifas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Todavía no hay tarifas cargadas para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              tarifas?.map((tarifa) => (
                <TableRow key={tarifa.id}>
                  <TableCell>{tarifa.zonaTarifariaNombre ?? tarifa.zonaTarifariaId}</TableCell>
                  <TableCell>{descripcionTipoTarifa(tarifa)}</TableCell>
                  <TableCell>{ETIQUETA_PRIORIDAD[tarifa.prioridad]}</TableCell>
                  <TableCell>{formatearMonto(tarifa.monto)}</TableCell>
                  <TableCell>
                    {tarifa.activa ? <Badge variant="secondary">Activa</Badge> : <Badge variant="outline">Inactiva</Badge>}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setTarifaEnEdicion(tarifa)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={mutacionActivaTarifa.isPending}
                      onClick={() => mutacionActivaTarifa.mutate({ id: tarifa.id, activa: !tarifa.activa })}
                    >
                      {tarifa.activa ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Porcentaje de pañal en entrega unificada</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setPorcentajeAbierto(true)}>
            {porcentajeActual ? "Editar porcentaje" : "Nuevo porcentaje"}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>% Pañal</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoPorcentajes ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : porcentajes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Todavía no hay un porcentaje cargado — solo hace falta si este cliente tiene entregas
                  unificadas de pañales y medicamentos.
                </TableCell>
              </TableRow>
            ) : (
              porcentajes?.map((porcentaje) => (
                <TableRow key={porcentaje.id}>
                  <TableCell>{porcentaje.porcentajePanal}%</TableCell>
                  <TableCell>
                    {porcentaje.activa ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {clienteActual?.tipoServicio !== TipoServicioCliente.PANAL && (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Monto de medicamento en entrega unificada</h2>
            <p className="text-sm text-muted-foreground">
              Monto fijo "de paso" por compartir el viaje con el pañal — varía por zona, no por un porcentaje de
              ninguna tarifa. Solo aplica a clientes de Medicamentos o Ambos.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setMontoEnEdicion("nuevo")}>
            Nuevo monto
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Bolsa / Bulto</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoMontosUnificado ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : montosUnificado?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Todavía no hay montos cargados — solo hacen falta si este cliente tiene entregas unificadas de
                  pañales y medicamentos.
                </TableCell>
              </TableRow>
            ) : (
              montosUnificado?.map((monto) => (
                <TableRow key={monto.id}>
                  <TableCell>{monto.zonaTarifariaNombre ?? monto.zonaTarifariaId}</TableCell>
                  <TableCell>{monto.tipoEnvase === "BULTO" ? "Bulto" : monto.tipoEnvase === "BOLSA" ? "Bolsa" : "Ambos"}</TableCell>
                  <TableCell>{ETIQUETA_PRIORIDAD[monto.prioridad]}</TableCell>
                  <TableCell>{formatearMonto(monto.monto)}</TableCell>
                  <TableCell>
                    {monto.activa ? <Badge variant="secondary">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setMontoEnEdicion(monto)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={mutacionActivaMontoUnificado.isPending}
                      onClick={() => mutacionActivaMontoUnificado.mutate({ id: monto.id, activa: !monto.activa })}
                    >
                      {monto.activa ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <CombinacionesUnificacion />

      <TarifaFormSheet
        clienteId={clienteId}
        tipoServicioCliente={clienteActual?.tipoServicio ?? TipoServicioCliente.AMBOS}
        tarifa={tarifaEnEdicion}
        onOpenChange={(abierto) => !abierto && setTarifaEnEdicion(null)}
      />
      <PorcentajeFormSheet
        clienteId={clienteId}
        porcentaje={porcentajeAbierto ? porcentajeActual : null}
        abierto={porcentajeAbierto}
        onOpenChange={setPorcentajeAbierto}
      />
      <MontoUnificadoMedicamentoFormSheet
        clienteId={clienteId}
        monto={montoEnEdicion}
        onOpenChange={(abierto) => !abierto && setMontoEnEdicion(null)}
      />
    </div>
  );
}

// Guia_Desarrollo_Logica_Facturacion_Arbet.docx paso 4/8: combinaciones
// habilitadas de unificación ENTRE clientes distintos (ej. Farmaet
// Medicamentos + Farmapal Pañales) — independiente del cliente elegido
// arriba, es una configuración global. No confundir con la unificación
// interna de un cliente que maneja "Ambos" servicios (ej. Bella Vista), que
// no necesita esto — ya funciona sola.
function CombinacionesUnificacion() {
  const queryClient = useQueryClient();
  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });
  const { data: combinaciones, isLoading } = useQuery({
    queryKey: ["facturacion", "combinaciones"],
    queryFn: listarCombinaciones,
  });

  const [clienteMedicamentoId, setClienteMedicamentoId] = useState("");
  const [clientePanalId, setClientePanalId] = useState("");
  const [nombre, setNombre] = useState("");

  const clientesMedicamento = (clientes ?? []).filter(
    (c) => c.tipoServicio === TipoServicioCliente.MEDICAMENTO || c.tipoServicio === TipoServicioCliente.AMBOS,
  );
  const clientesPanal = (clientes ?? []).filter(
    (c) => c.tipoServicio === TipoServicioCliente.PANAL || c.tipoServicio === TipoServicioCliente.AMBOS,
  );
  const nombreCliente = (id: string) => clientes?.find((c) => c.id === id)?.nombre ?? id;

  const mutacionCrear = useMutation({
    mutationFn: () => crearCombinacion({ clienteMedicamentoId, clientePanalId, nombre: nombre.trim() || undefined }),
    onSuccess: () => {
      toast.success("Combinación habilitada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "combinaciones"] });
      setClienteMedicamentoId("");
      setClientePanalId("");
      setNombre("");
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionEliminar = useMutation({
    mutationFn: (id: string) => eliminarCombinacion(id),
    onSuccess: () => {
      toast.success("Combinación quitada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "combinaciones"] });
    },
    onError: () => toast.error("No se pudo quitar."),
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-medium">Combinaciones de unificación entre clientes</h2>
        <p className="text-sm text-muted-foreground">
          Habilita que un pedido de medicamentos de un cliente se unifique con un pedido de pañales de OTRO
          cliente (misma fecha/domicilio). Cada cliente se factura por separado, con su propia tarifa y
          porcentaje.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Cliente de medicamentos</span>
          <Select value={clienteMedicamentoId} onValueChange={setClienteMedicamentoId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Elegir cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientesMedicamento.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Cliente de pañales</span>
          <Select value={clientePanalId} onValueChange={setClientePanalId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Elegir cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientesPanal.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Nombre (opcional)</span>
          <Input
            className="w-56"
            placeholder="Ej. Unificado Bellavista"
            maxLength={80}
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!clienteMedicamentoId || !clientePanalId || mutacionCrear.isPending}
          onClick={() => mutacionCrear.mutate()}
        >
          Habilitar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Medicamentos</TableHead>
            <TableHead>Pañales</TableHead>
            <TableHead className="w-24">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : combinaciones?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Todavía no hay combinaciones habilitadas.
              </TableCell>
            </TableRow>
          ) : (
            combinaciones?.map((combinacion) => (
              <TableRow key={combinacion.id}>
                <TableCell>{combinacion.nombre ?? "—"}</TableCell>
                <TableCell>{combinacion.clienteMedicamentoNombre ?? nombreCliente(combinacion.clienteMedicamentoId)}</TableCell>
                <TableCell>{combinacion.clientePanalNombre ?? nombreCliente(combinacion.clientePanalId)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={mutacionEliminar.isPending}
                    onClick={() => mutacionEliminar.mutate(combinacion.id)}
                  >
                    Quitar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
