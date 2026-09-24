import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PrioridadPedido, TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { LABEL_PRIORIDAD } from "@/features/pedidos/estado-labels";
import { listarClientesActivos } from "@/features/clientes/api";
import { actualizarRegla, crearRegla, eliminarRegla, listarReglas } from "./api";
import { CAMPO_CANONICO_LABELS } from "./campo-labels";
import { mensajeErrorApi } from "./mensaje-error";
import type {
  AccionRegla,
  CampoCanonico,
  CampoDestinoRegla,
  ReglaImportacion,
  TipoCoincidencia,
} from "./tipos";

// Campos contra los que se puede comparar una condición. En medicamentos el
// "ticket" es el remito.
const CAMPOS_CONDICION: CampoCanonico[] = [
  "ticket",
  "numeroAfiliado",
  "tiempoDeEntrega",
  "tipoPedido",
  "receta",
  "retiroDeReceta",
  "horarioEntrega",
  "envaseTexto",
  "localidad",
  "direccion",
];

const LABEL_CAMPO: Partial<Record<CampoCanonico, string>> = {
  ...CAMPO_CANONICO_LABELS,
  ticket: "Remito",
};

const LABEL_COINCIDENCIA: Record<TipoCoincidencia, string> = {
  IGUAL: "es igual a",
  EMPIEZA_CON: "empieza con",
  CONTIENE: "contiene",
};

const LABEL_DESTINO: Record<CampoDestinoRegla, string> = {
  retiroDeReceta: "Retiro de receta",
  prioridad: "Prioridad",
  numeroAfiliado: "Número de afiliado",
};

function describirAccion(regla: ReglaImportacion): string {
  if (regla.accion === "QUITAR_PREFIJO") return `Quitarle "${regla.valor}" del comienzo al ${LABEL_DESTINO[regla.campoDestino].toLowerCase()}`;
  const valor =
    regla.campoDestino === "prioridad"
      ? (LABEL_PRIORIDAD[regla.valorDestino as PrioridadPedido] ?? regla.valorDestino)
      : `"${regla.valorDestino}"`;
  return `${LABEL_DESTINO[regla.campoDestino]} = ${valor}`;
}

// Reglas de importación editables por cliente (decisión 2026-09-24, Leonardo:
// "que el usuario pueda definirlo") — ver ReglaImportacion en el backend.
// Ejemplos: si el Remito contiene "R-0011" → Retiro de receta = "RR"; si
// Tiempo de entrega empieza con "URGENCIA" → Prioridad = Urgente; si el Nº de
// afiliado empieza con "OSDE" → quitar ese prefijo.
export function ReglasTab() {
  const queryClient = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });
  const clientesMedicamento = clientes.filter(
    (c) => c.tipoServicio === TipoServicioCliente.MEDICAMENTO || c.tipoServicio === TipoServicioCliente.AMBOS,
  );

  const [clienteId, setClienteId] = useState("");
  const { data: reglas = [], isLoading } = useQuery({
    queryKey: ["reglas-importacion", clienteId],
    queryFn: () => listarReglas(clienteId, TipoServicio.MEDICAMENTO),
    enabled: Boolean(clienteId),
  });

  const [campoOrigen, setCampoOrigen] = useState<CampoCanonico>("ticket");
  const [tipoCoincidencia, setTipoCoincidencia] = useState<TipoCoincidencia>("CONTIENE");
  const [valor, setValor] = useState("");
  const [accion, setAccion] = useState<AccionRegla>("ASIGNAR_VALOR");
  const [campoDestino, setCampoDestino] = useState<CampoDestinoRegla>("retiroDeReceta");
  const [valorDestino, setValorDestino] = useState("");

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["reglas-importacion", clienteId] });

  const mutacionCrear = useMutation({
    mutationFn: () =>
      crearRegla({
        clienteId,
        tipoServicio: TipoServicio.MEDICAMENTO,
        campoOrigen: accion === "QUITAR_PREFIJO" ? "numeroAfiliado" : campoOrigen,
        tipoCoincidencia: accion === "QUITAR_PREFIJO" ? "EMPIEZA_CON" : tipoCoincidencia,
        valor: valor.trim(),
        accion,
        campoDestino: accion === "QUITAR_PREFIJO" ? "numeroAfiliado" : campoDestino,
        valorDestino: accion === "QUITAR_PREFIJO" ? "" : valorDestino.trim(),
        orden: reglas.length,
        activa: true,
      }),
    onSuccess: () => {
      toast.success("Regla agregada.");
      setValor("");
      setValorDestino("");
      invalidar();
    },
    onError: (error) => toast.error(mensajeErrorApi(error)),
  });

  const mutacionActivar = useMutation({
    mutationFn: (regla: ReglaImportacion) => {
      const { id, ...datos } = regla;
      return actualizarRegla(id, { ...datos, activa: !regla.activa });
    },
    onSuccess: invalidar,
    onError: (error) => toast.error(mensajeErrorApi(error)),
  });

  const mutacionEliminar = useMutation({
    mutationFn: eliminarRegla,
    onSuccess: () => {
      toast.success("Regla quitada.");
      invalidar();
    },
    onError: (error) => toast.error(mensajeErrorApi(error)),
  });

  const puedeAgregar =
    Boolean(clienteId) && valor.trim() !== "" && (accion === "QUITAR_PREFIJO" || valorDestino.trim() !== "");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Reglas que se aplican solas al importar un Excel de medicamentos de este cliente. Se comparan contra lo que
        trae el archivo, sin distinguir mayúsculas ni acentos.
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Cliente</span>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger className="w-full sm:w-72" aria-label="Cliente de las reglas">
            <SelectValue placeholder="Elegí un cliente de medicamentos" />
          </SelectTrigger>
          <SelectContent>
            {clientesMedicamento.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clienteId && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Activa</TableHead>
                <TableHead>Si…</TableHead>
                <TableHead>Entonces…</TableHead>
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
              ) : reglas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Este cliente todavía no tiene reglas.
                  </TableCell>
                </TableRow>
              ) : (
                reglas.map((regla) => (
                  <TableRow key={regla.id}>
                    <TableCell>
                      <Checkbox
                        checked={regla.activa}
                        onCheckedChange={() => mutacionActivar.mutate(regla)}
                        disabled={mutacionActivar.isPending}
                        aria-label="Regla activa"
                      />
                    </TableCell>
                    <TableCell>
                      {LABEL_CAMPO[regla.campoOrigen] ?? regla.campoOrigen} {LABEL_COINCIDENCIA[regla.tipoCoincidencia]}{" "}
                      <strong>"{regla.valor}"</strong>
                    </TableCell>
                    <TableCell>{describirAccion(regla)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={mutacionEliminar.isPending}
                        onClick={() => mutacionEliminar.mutate(regla.id)}
                      >
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3">
            <h2 className="font-medium">Agregar una regla</h2>
            <TablaFormulario>
              <FilaFormulario label="Qué hace">
                <Select value={accion} onValueChange={(v) => setAccion(v as AccionRegla)}>
                  <SelectTrigger className="w-full sm:w-80" aria-label="Qué hace la regla">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASIGNAR_VALOR">Asignar un valor</SelectItem>
                    <SelectItem value="QUITAR_PREFIJO">Quitar un prefijo del Nº de afiliado</SelectItem>
                  </SelectContent>
                </Select>
              </FilaFormulario>

              {accion === "ASIGNAR_VALOR" && (
                <>
                  <FilaFormulario label="Si el campo">
                    <Select value={campoOrigen} onValueChange={(v) => setCampoOrigen(v as CampoCanonico)}>
                      <SelectTrigger className="w-full sm:w-64" aria-label="Campo de la condición">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPOS_CONDICION.map((campo) => (
                          <SelectItem key={campo} value={campo}>
                            {LABEL_CAMPO[campo] ?? campo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilaFormulario>
                  <FilaFormulario label="Cumple">
                    <Select value={tipoCoincidencia} onValueChange={(v) => setTipoCoincidencia(v as TipoCoincidencia)}>
                      <SelectTrigger className="w-full sm:w-64" aria-label="Tipo de coincidencia">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(LABEL_COINCIDENCIA) as TipoCoincidencia[]).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {LABEL_COINCIDENCIA[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilaFormulario>
                </>
              )}

              <FilaFormulario
                label={accion === "ASIGNAR_VALOR" ? "Texto" : "Prefijo a quitar"}
                htmlFor="valor-regla"
                descripcion={accion === "ASIGNAR_VALOR" ? 'Ej. R-0011 o URGENCIA' : 'Ej. OSDE — se saca del comienzo del Nº de afiliado'}
              >
                <Input
                  id="valor-regla"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  maxLength={100}
                  className="w-full sm:w-64"
                />
              </FilaFormulario>

              {accion === "ASIGNAR_VALOR" && (
                <>
                  <FilaFormulario label="Entonces asignar a">
                    <Select
                      value={campoDestino}
                      onValueChange={(v) => {
                        setCampoDestino(v as CampoDestinoRegla);
                        setValorDestino("");
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-64" aria-label="Campo a modificar">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retiroDeReceta">{LABEL_DESTINO.retiroDeReceta}</SelectItem>
                        <SelectItem value="prioridad">{LABEL_DESTINO.prioridad}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FilaFormulario>
                  <FilaFormulario label="El valor" htmlFor="valor-destino-regla">
                    {campoDestino === "prioridad" ? (
                      <Select value={valorDestino} onValueChange={setValorDestino}>
                        <SelectTrigger id="valor-destino-regla" className="w-full sm:w-64">
                          <SelectValue placeholder="Elegí una prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PrioridadPedido).map((p) => (
                            <SelectItem key={p} value={p}>
                              {LABEL_PRIORIDAD[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="valor-destino-regla"
                        value={valorDestino}
                        onChange={(e) => setValorDestino(e.target.value)}
                        maxLength={100}
                        placeholder="Ej. RR"
                        className="w-full sm:w-64"
                      />
                    )}
                  </FilaFormulario>
                </>
              )}
            </TablaFormulario>
            <Button
              type="button"
              className="self-start"
              disabled={!puedeAgregar || mutacionCrear.isPending}
              onClick={() => mutacionCrear.mutate()}
            >
              Agregar regla
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
