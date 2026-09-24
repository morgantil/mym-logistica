import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectorArchivo } from "@/components/shell/selector-archivo";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarClientesActivos } from "@/features/clientes/api";
import { confirmarMapeo, subirExcel } from "./api";
import { MapeoManualForm } from "./mapeo-manual-form";
import { RecetasTab } from "./recetas-tab";
import { ReglasTab } from "./reglas-tab";
import { ResumenImportacion } from "./resumen-importacion";
import type { MapeoColumnas, ResultadoImportacion } from "./tipos";

const LABEL_TIPO_IMPORTACION: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

// Un cliente PANAL no puede subir un Excel de medicamentos y viceversa —
// filtra el dropdown de Cliente según el tipo de importación elegido, para
// no dejar armar una combinación que nunca va a poder procesarse.
function clienteAceptaTipoServicio(tipoServicioCliente: TipoServicioCliente, tipoImportacion: TipoServicio): boolean {
  if (tipoServicioCliente === TipoServicioCliente.AMBOS) return true;
  return tipoServicioCliente === (tipoImportacion as unknown as TipoServicioCliente);
}

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo procesar el archivo. Probá de nuevo en unos segundos.";
}

const HOY = new Date().toISOString().slice(0, 10);

// Decisión 2026-09-24: además de subir el archivo, desde acá se definen las
// reglas de importación por cliente y los sinónimos de receta — todo lo que
// el usuario puede configurar de una importación vive en la misma pantalla.
export function ImportarPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Importar Excel</h1>
      <Tabs defaultValue="archivo" className="flex flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="archivo">Subir archivo</TabsTrigger>
          <TabsTrigger value="reglas">Reglas por cliente</TabsTrigger>
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
        </TabsList>
        <TabsContent value="archivo">
          <SubirArchivo />
        </TabsContent>
        <TabsContent value="reglas">
          <ReglasTab />
        </TabsContent>
        <TabsContent value="recetas">
          <RecetasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubirArchivo() {
  const queryClient = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [clienteElegido, setClienteElegido] = useState<string>("");
  const [tipoImportacion, setTipoImportacion] = useState<TipoServicio>(TipoServicio.PANAL);
  // Obligatoria — documento funcional v6 §4.1: se informa antes de subir el
  // archivo, se aplica a todo el lote, el Excel ya no la puede reemplazar.
  const [fechaEntrega, setFechaEntrega] = useState<string>(HOY);
  // Opcional — si el libro trae varias hojas, cuál importar (queda guardada
  // en el perfil del cliente). Vacío = la guardada, o la primera.
  const [nombreHoja, setNombreHoja] = useState("");
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });
  const clientesFiltrados = useMemo(
    () => clientes?.filter((cliente) => clienteAceptaTipoServicio(cliente.tipoServicio, tipoImportacion)),
    [clientes, tipoImportacion],
  );

  const mutacionSubir = useMutation({
    mutationFn: ({ archivo, clienteId }: { archivo: File; clienteId: string }) =>
      subirExcel(archivo, fechaEntrega, tipoImportacion, clienteId, nombreHoja.trim() || undefined),
    onSuccess: (data) => {
      setResultado(data);
      if (data.estado === "completada") {
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      }
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  const mutacionMapeo = useMutation({
    mutationFn: (mapeoManual: MapeoColumnas) => {
      if (!archivo || resultado?.estado !== "requiereMapeoManual") {
        throw new Error("Falta el archivo o el cliente para confirmar el mapeo.");
      }
      return confirmarMapeo({
        archivo,
        clienteId: resultado.clienteId,
        mapeoManual,
        fechaEntrega,
        tipoServicio: tipoImportacion,
        nombreHoja: nombreHoja.trim() || undefined,
      });
    },
    onSuccess: (data) => {
      setResultado(data);
      if (data.estado === "completada") {
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      }
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  function reiniciar() {
    setArchivo(null);
    setClienteElegido("");
    setTipoImportacion(TipoServicio.PANAL);
    setFechaEntrega(HOY);
    setNombreHoja("");
    setResultado(null);
  }

  function manejarSubmitInicial(evento: FormEvent) {
    evento.preventDefault();
    if (!archivo || !fechaEntrega || !clienteElegido) return;
    mutacionSubir.mutate({ archivo, clienteId: clienteElegido });
  }

  const enviando = mutacionSubir.isPending || mutacionMapeo.isPending;

  return (
    <div className="flex flex-col gap-4">
      {!resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Subir archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={manejarSubmitInicial} className="flex flex-col gap-4">
              <TablaFormulario>
                <FilaFormulario
                  label="Fecha de entrega"
                  htmlFor="fecha-entrega"
                  descripcion="Se aplica a todos los pedidos de este archivo — el Excel no la puede reemplazar."
                >
                  <Input
                    id="fecha-entrega"
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    required
                    disabled={enviando}
                    className="w-full sm:w-48"
                  />
                </FilaFormulario>

                <FilaFormulario
                  label="Tipo de importación"
                  htmlFor="tipo-importacion"
                  descripcion="Pañales y medicamentos tienen formatos de Excel distintos — elegí el que corresponda antes de subir el archivo."
                >
                  <Select
                    value={tipoImportacion}
                    onValueChange={(valor) => {
                      setTipoImportacion(valor as TipoServicio);
                      setClienteElegido("");
                    }}
                    disabled={enviando}
                  >
                    <SelectTrigger id="tipo-importacion" className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TipoServicio).map((valor) => (
                        <SelectItem key={valor} value={valor}>
                          {LABEL_TIPO_IMPORTACION[valor]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilaFormulario>

                <FilaFormulario label="Archivo Excel" htmlFor="archivo">
                  <SelectorArchivo
                    id="archivo"
                    accept=".xlsx,.xls"
                    disabled={enviando}
                    archivo={archivo}
                    onChange={setArchivo}
                  />
                </FilaFormulario>

                <FilaFormulario
                  label="Hoja del Excel"
                  htmlFor="nombre-hoja"
                  descripcion="Opcional. Si el archivo trae varias hojas, escribí el nombre de la que se importa (ej. Hoja1). Queda guardada para este cliente; vacío = la que ya tenga guardada, o la primera."
                >
                  <Input
                    id="nombre-hoja"
                    value={nombreHoja}
                    onChange={(e) => setNombreHoja(e.target.value)}
                    disabled={enviando}
                    placeholder="Primera hoja"
                    className="w-full sm:w-64"
                  />
                </FilaFormulario>

                <FilaFormulario label="Cliente" htmlFor="cliente">
                  <Select value={clienteElegido} onValueChange={setClienteElegido} disabled={enviando}>
                    <SelectTrigger id="cliente" className="w-full sm:w-80">
                      <SelectValue placeholder="Elegí un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesFiltrados?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilaFormulario>
              </TablaFormulario>

              <Button
                type="submit"
                disabled={!archivo || !fechaEntrega || !clienteElegido || enviando}
                className="self-start"
              >
                {enviando ? "Importando…" : "Importar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {resultado?.estado === "requiereMapeoManual" && (
        <Card>
          <CardHeader>
            <CardTitle>Mapear columnas</CardTitle>
          </CardHeader>
          <CardContent>
            <MapeoManualForm
              resultado={resultado}
              enviando={enviando}
              onConfirmar={(mapeoManual) => mutacionMapeo.mutate(mapeoManual)}
            />
          </CardContent>
        </Card>
      )}

      {resultado?.estado === "completada" && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumenImportacion resultado={resultado} onImportarOtro={reiniciar} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
