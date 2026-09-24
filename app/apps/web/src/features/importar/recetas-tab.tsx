import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { crearSinonimoReceta, eliminarSinonimoReceta, listarSinonimosReceta } from "./api";
import { mensajeErrorApi } from "./mensaje-error";
import type { TipoCoincidencia } from "./tipos";

const LABEL_COINCIDENCIA: Record<TipoCoincidencia, string> = {
  IGUAL: "es igual a",
  EMPIEZA_CON: "empieza con",
  CONTIENE: "contiene",
};

// ABM de sinónimos de "Receta" (decisión 2026-09-13 el backend, 2026-09-24 la
// pantalla y los tipos de coincidencia): el valor que trae el Excel se
// convierte en el que se carga acá — ej. todo lo que empiece con EV o ENV es
// "DIGITAL". Aplica igual a todos los clientes. Si varios sinónimos aplican al
// mismo valor gana el de menor orden (a igual orden, el más específico).
export function RecetasTab() {
  const queryClient = useQueryClient();
  const { data: sinonimos = [], isLoading } = useQuery({
    queryKey: ["sinonimos-receta"],
    queryFn: listarSinonimosReceta,
  });

  const [tipoCoincidencia, setTipoCoincidencia] = useState<TipoCoincidencia>("EMPIEZA_CON");
  const [valorOrigen, setValorOrigen] = useState("");
  const [valorCanonico, setValorCanonico] = useState("");
  const [orden, setOrden] = useState("0");

  const mutacionCrear = useMutation({
    mutationFn: () =>
      crearSinonimoReceta({
        valorOrigen: valorOrigen.trim(),
        valorCanonico: valorCanonico.trim(),
        tipoCoincidencia,
        orden: Number(orden) || 0,
      }),
    onSuccess: () => {
      toast.success("Sinónimo agregado.");
      setValorOrigen("");
      setValorCanonico("");
      queryClient.invalidateQueries({ queryKey: ["sinonimos-receta"] });
    },
    onError: (error) => toast.error(mensajeErrorApi(error)),
  });

  const mutacionEliminar = useMutation({
    mutationFn: eliminarSinonimoReceta,
    onSuccess: () => {
      toast.success("Sinónimo quitado.");
      queryClient.invalidateQueries({ queryKey: ["sinonimos-receta"] });
    },
    onError: (error) => toast.error(mensajeErrorApi(error)),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Convierte el valor de la columna Receta del Excel en el que se muestra en el sistema. Por ejemplo: todo lo
        que empiece con EV o ENV se muestra como DIGITAL.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Si la receta…</TableHead>
            <TableHead>Se muestra como</TableHead>
            <TableHead className="w-20">Orden</TableHead>
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
          ) : sinonimos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Todavía no hay sinónimos cargados.
              </TableCell>
            </TableRow>
          ) : (
            sinonimos.map((sinonimo) => (
              <TableRow key={sinonimo.id}>
                <TableCell>
                  {LABEL_COINCIDENCIA[sinonimo.tipoCoincidencia]} <strong>"{sinonimo.valorOrigen}"</strong>
                </TableCell>
                <TableCell>{sinonimo.valorCanonico}</TableCell>
                <TableCell>{sinonimo.orden}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={mutacionEliminar.isPending}
                    onClick={() => mutacionEliminar.mutate(sinonimo.id)}
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
        <h2 className="font-medium">Agregar un sinónimo</h2>
        <TablaFormulario>
          <FilaFormulario label="Si la receta">
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
          <FilaFormulario label="Texto" htmlFor="valor-origen-receta" descripcion="Ej. EV, ENV, RR o FIS">
            <Input
              id="valor-origen-receta"
              value={valorOrigen}
              onChange={(e) => setValorOrigen(e.target.value)}
              maxLength={100}
              className="w-full sm:w-64"
            />
          </FilaFormulario>
          <FilaFormulario label="Se muestra como" htmlFor="valor-canonico-receta" descripcion="Ej. DIGITAL, RETIRO DE RECETA o RECETA FISICA">
            <Input
              id="valor-canonico-receta"
              value={valorCanonico}
              onChange={(e) => setValorCanonico(e.target.value)}
              maxLength={100}
              className="w-full sm:w-64"
            />
          </FilaFormulario>
          <FilaFormulario
            label="Orden"
            htmlFor="orden-receta"
            descripcion='Si dos sinónimos aplican al mismo valor gana el de menor número. Ej. "RR" con orden 0 le gana a "EV" con orden 1 para "RR EV".'
          >
            <Input
              id="orden-receta"
              type="number"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full sm:w-24"
            />
          </FilaFormulario>
        </TablaFormulario>
        <Button
          type="button"
          className="self-start"
          disabled={!valorOrigen.trim() || !valorCanonico.trim() || mutacionCrear.isPending}
          onClick={() => mutacionCrear.mutate()}
        >
          Agregar sinónimo
        </Button>
      </div>
    </div>
  );
}
