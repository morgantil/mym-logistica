import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoReporte } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { actualizarLimiteReporte, listarLimitesReporte } from "./api";

const ETIQUETA_REPORTE: Record<TipoReporte, string> = {
  [TipoReporte.TRANSPORTISTAS]: "Liquidación a Transportistas",
  [TipoReporte.COMBUSTIBLE]: "Combustible y Peajes",
  [TipoReporte.PEDIDOS]: "Pedidos",
};

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Pedido en reunión 2026-10-10 (ver REPORTE_SEGURIDAD_Y_ROBUSTEZ.md): tope de
// días (Desde/Hasta) de cada reporte Excel, antes hardcodeado por módulo.
// Solo Administración puede editarlo (mismo rol que ya protege esta
// pantalla completa) — entre 1 y 100 días, validado también en el backend.
export function LimitesReporteSection() {
  const queryClient = useQueryClient();
  const { data: limites } = useQuery({ queryKey: ["limites-reporte"], queryFn: listarLimitesReporte });
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!limites) return;
    setValores((actual) => {
      const siguiente = { ...actual };
      for (const limite of limites) {
        if (siguiente[limite.reporte] === undefined) {
          siguiente[limite.reporte] = String(limite.maxDias);
        }
      }
      return siguiente;
    });
  }, [limites]);

  const mutacion = useMutation({
    mutationFn: ({ reporte, maxDias }: { reporte: TipoReporte; maxDias: number }) =>
      actualizarLimiteReporte(reporte, maxDias),
    onSuccess: () => {
      toast.success("Tope actualizado.");
      queryClient.invalidateQueries({ queryKey: ["limites-reporte"] });
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  if (!limites) return null;

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div>
        <h2 className="font-medium">Tope de días en reportes Excel</h2>
        <p className="text-sm text-muted-foreground">
          Rango máximo (Desde/Hasta) que se puede pedir al descargar cada reporte — entre 1 y 100 días.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reporte</TableHead>
            <TableHead>Máximo de días</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limites.map((limite) => (
            <TableRow key={limite.reporte}>
              <TableCell>{ETIQUETA_REPORTE[limite.reporte]}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  className="w-24"
                  value={valores[limite.reporte] ?? String(limite.maxDias)}
                  onChange={(e) =>
                    setValores((actual) => ({ ...actual, [limite.reporte]: e.target.value }))
                  }
                  disabled={mutacion.isPending}
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={mutacion.isPending}
                  onClick={() => {
                    const maxDias = Number(valores[limite.reporte]);
                    if (!Number.isInteger(maxDias) || maxDias < 1 || maxDias > 100) {
                      toast.error("Tiene que ser un número entero entre 1 y 100.");
                      return;
                    }
                    mutacion.mutate({ reporte: limite.reporte, maxDias });
                  }}
                >
                  Guardar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
