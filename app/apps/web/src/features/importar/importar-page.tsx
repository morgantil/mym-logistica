import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listarClientesActivos } from "@/features/clientes/api";
import { confirmarMapeo, subirExcel } from "./api";
import { MapeoManualForm } from "./mapeo-manual-form";
import { ResumenImportacion } from "./resumen-importacion";
import type { MapeoColumnas, ResultadoImportacion } from "./tipos";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo procesar el archivo. Probá de nuevo en unos segundos.";
}

export function ImportarPage() {
  const queryClient = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [clienteElegido, setClienteElegido] = useState<string>("");
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });

  const mutacionSubir = useMutation({
    mutationFn: ({ archivo, clienteId }: { archivo: File; clienteId?: string }) =>
      subirExcel(archivo, clienteId),
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
      return confirmarMapeo({ archivo, clienteId: resultado.clienteId, mapeoManual });
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
    setResultado(null);
  }

  function manejarSubmitInicial(evento: FormEvent) {
    evento.preventDefault();
    if (!archivo) return;
    mutacionSubir.mutate({ archivo, clienteId: clienteElegido || undefined });
  }

  const enviando = mutacionSubir.isPending || mutacionMapeo.isPending;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Importar Excel</h1>

      {!resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Subir archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={manejarSubmitInicial} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="archivo">Archivo Excel</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept=".xlsx,.xls"
                  required
                  disabled={enviando}
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cliente">Cliente (opcional — se intenta detectar solo)</Label>
                <Select value={clienteElegido} onValueChange={setClienteElegido} disabled={enviando}>
                  <SelectTrigger id="cliente" className="w-full sm:w-80">
                    <SelectValue placeholder="Detectar automáticamente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={!archivo || enviando} className="self-start">
                {enviando ? "Importando…" : "Importar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {resultado?.estado === "requiereSeleccionCliente" && (
        <Card>
          <CardHeader>
            <CardTitle>¿A qué cliente pertenece este archivo?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              No pudimos identificar el cliente a partir del nombre del archivo ({resultado.nombreArchivo}
              ). Elegilo para continuar.
            </p>
            <Select value={clienteElegido} onValueChange={setClienteElegido} disabled={enviando}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              disabled={!clienteElegido || !archivo || enviando}
              onClick={() => archivo && mutacionSubir.mutate({ archivo, clienteId: clienteElegido })}
              className="self-start"
            >
              {enviando ? "Importando…" : "Continuar"}
            </Button>
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
