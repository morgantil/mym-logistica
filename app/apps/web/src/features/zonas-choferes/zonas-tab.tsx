import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarZonas, sincronizarConSimpliRoute } from "./api";

const NOMBRES_DIAS: Record<string, string> = {
  Monday: "Lun",
  Tuesday: "Mar",
  Wednesday: "Mié",
  Thursday: "Jue",
  Friday: "Vie",
  Saturday: "Sáb",
  Sunday: "Dom",
};

const ORDEN_DIAS = Object.keys(NOMBRES_DIAS);

function formatearDias(dias: string[]): string {
  return [...dias].sort((a, b) => ORDEN_DIAS.indexOf(a) - ORDEN_DIAS.indexOf(b)).map((d) => NOMBRES_DIAS[d] ?? d).join(", ");
}

// Zonas es de solo lectura: SimpliRoute no publica alta/edición de Zonas en
// su API pública (a diferencia de Choferes y Vehículos) — cualquier cambio
// se hace en SimpliRoute y acá se refleja al sincronizar. Ver
// DOCUMENTO TECNICO.md historial 2026-08-25/26.
export function ZonasTab() {
  const queryClient = useQueryClient();

  const { data: zonas, isLoading, isError } = useQuery({ queryKey: ["zonas"], queryFn: listarZonas });

  const mutacionSincronizar = useMutation({
    mutationFn: sincronizarConSimpliRoute,
    onSuccess: (resultado) => {
      toast.success(
        `Sincronizado: ${resultado.zonas} zonas, ${resultado.choferes} choferes, ${resultado.vehiculos} vehículos.`,
      );
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      queryClient.invalidateQueries({ queryKey: ["choferes"] });
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
    },
    onError: () => toast.error("No se pudo sincronizar con SimpliRoute. Probá de nuevo en unos segundos."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Zonas se trae directo de SimpliRoute (solo lectura acá) — para crear o editar una zona hacelo en
          SimpliRoute y después sincronizá. El chofer asignado es el conductor predeterminado del vehículo de
          la zona en SimpliRoute.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => mutacionSincronizar.mutate()}
          disabled={mutacionSincronizar.isPending}
        >
          {mutacionSincronizar.isPending ? "Sincronizando…" : "Sincronizar ahora"}
        </Button>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las zonas. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Chofer asignado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : zonas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Todavía no hay zonas en SimpliRoute (o el addon de Zonas no está habilitado en la cuenta).
                </TableCell>
              </TableRow>
            ) : (
              zonas?.map((zona) => (
                <TableRow key={zona.id}>
                  <TableCell>{zona.nombre}</TableCell>
                  <TableCell>
                    {zona.habilitada ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                      >
                        Habilitada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Deshabilitada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatearDias(zona.dias)}</TableCell>
                  <TableCell>{zona.chofer?.nombre ?? "Sin asignar"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
