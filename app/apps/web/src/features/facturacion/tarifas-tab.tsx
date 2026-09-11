import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarClientesActivos } from "@/features/clientes/api";
import {
  actualizarTarifa,
  crearCombinacion,
  eliminarCombinacion,
  listarCombinaciones,
  listarPorcentajes,
  listarTarifas,
} from "./api";
import { formatearMonto } from "./formato";
import { PorcentajeFormSheet } from "./porcentaje-form-sheet";
import { TarifaFormSheet } from "./tarifa-form-sheet";
import type { TarifaCliente } from "./tipos";

const ETIQUETA_TIPO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

function descripcionTipoTarifa(tarifa: { tipoServicio: TipoServicio; tipoEnvase: string | null }): string {
  if (tarifa.tipoServicio === TipoServicio.PANAL) return ETIQUETA_TIPO.PANAL;
  return `${ETIQUETA_TIPO.MEDICAMENTO} — ${tarifa.tipoEnvase === "BULTO" ? "Bulto" : "Bolsa"}`;
}

export function TarifasTab({ clienteId }: { clienteId: string | null }) {
  const [tarifaEnEdicion, setTarifaEnEdicion] = useState<TarifaCliente | "nuevo" | null>(null);
  const [porcentajeAbierto, setPorcentajeAbierto] = useState(false);
  const queryClient = useQueryClient();

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

  const mutacionActivaTarifa = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) => actualizarTarifa(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facturacion", "tarifas", clienteId] }),
    onError: () => toast.error("No se pudo cambiar el estado."),
  });

  if (clienteId === null) {
    return <p className="text-sm text-muted-foreground">Elegí un cliente arriba para ver sus tarifas.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
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
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoTarifas ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : tarifas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Todavía no hay tarifas cargadas para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              tarifas?.map((tarifa) => (
                <TableRow key={tarifa.id}>
                  <TableCell>{tarifa.zonaTarifariaNombre ?? tarifa.zonaTarifariaId}</TableCell>
                  <TableCell>{descripcionTipoTarifa(tarifa)}</TableCell>
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
          <h2 className="font-medium">Porcentajes de entrega unificada</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setPorcentajeAbierto(true)}>
            {porcentajeActual ? "Editar porcentaje" : "Nuevo porcentaje"}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>% Pañal</TableHead>
              <TableHead>% Medicamento</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoPorcentajes ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : porcentajes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Todavía no hay porcentajes cargados — solo hacen falta si este cliente tiene entregas
                  unificadas de pañales y medicamentos.
                </TableCell>
              </TableRow>
            ) : (
              porcentajes?.map((porcentaje) => (
                <TableRow key={porcentaje.id}>
                  <TableCell>{porcentaje.porcentajePanal}%</TableCell>
                  <TableCell>{porcentaje.porcentajeMedicamento}%</TableCell>
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

      <CombinacionesUnificacion />

      <TarifaFormSheet
        clienteId={clienteId}
        tarifa={tarifaEnEdicion}
        onOpenChange={(abierto) => !abierto && setTarifaEnEdicion(null)}
      />
      <PorcentajeFormSheet
        clienteId={clienteId}
        porcentaje={porcentajeAbierto ? porcentajeActual : null}
        abierto={porcentajeAbierto}
        onOpenChange={setPorcentajeAbierto}
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

  const clientesMedicamento = (clientes ?? []).filter(
    (c) => c.tipoServicio === TipoServicioCliente.MEDICAMENTO || c.tipoServicio === TipoServicioCliente.AMBOS,
  );
  const clientesPanal = (clientes ?? []).filter(
    (c) => c.tipoServicio === TipoServicioCliente.PANAL || c.tipoServicio === TipoServicioCliente.AMBOS,
  );
  const nombreCliente = (id: string) => clientes?.find((c) => c.id === id)?.nombre ?? id;

  const mutacionCrear = useMutation({
    mutationFn: () => crearCombinacion({ clienteMedicamentoId, clientePanalId }),
    onSuccess: () => {
      toast.success("Combinación habilitada.");
      queryClient.invalidateQueries({ queryKey: ["facturacion", "combinaciones"] });
      setClienteMedicamentoId("");
      setClientePanalId("");
    },
    onError: () => toast.error("No se pudo habilitar — ¿ya existe esa combinación?"),
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
            <TableHead>Medicamentos</TableHead>
            <TableHead>Pañales</TableHead>
            <TableHead className="w-24">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                Cargando…
              </TableCell>
            </TableRow>
          ) : combinaciones?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                Todavía no hay combinaciones habilitadas.
              </TableCell>
            </TableRow>
          ) : (
            combinaciones?.map((combinacion) => (
              <TableRow key={combinacion.id}>
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
