import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sincronizarEstados } from "./api";
import { PedidosTabla } from "./pedidos-tabla";
import { RevisionPanel } from "./revision-panel";

const VISTAS = ["grilla", "revision"] as const;
type Vista = (typeof VISTAS)[number];

export function PedidosPage() {
  // La vista activa vive en la URL (?vista=revision) — así el Dashboard puede
  // linkear directo a "Revisión antes de enviar", igual que ya hace con el
  // filtro de estado de la grilla.
  const [searchParams, setSearchParams] = useSearchParams();
  const vistaParam = searchParams.get("vista");
  const vista: Vista = VISTAS.includes(vistaParam as Vista) ? (vistaParam as Vista) : "grilla";
  const queryClient = useQueryClient();

  // §19 funcional: trae de SimpliRoute el estado real de los pedidos en curso
  // (Coordinado/En tránsito) y los pasa a Entregado/Fallido — sin esto ningún
  // pedido llega nunca a esos estados. También se dispara solo antes de
  // calcular cualquier facturación (ver FacturacionService), esto es la
  // versión manual para verlo reflejado acá sin pasar por Facturación.
  const mutacionSincronizar = useMutation({
    mutationFn: sincronizarEstados,
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      const partes = [`Sincronizados ${resultado.actualizados}`];
      if (resultado.revertidos > 0) {
        partes.push(`${resultado.revertidos} volvieron a "Sin asignar" (ya no existían en SimpliRoute)`);
      }
      if (resultado.errores.length > 0) {
        partes.push(`${resultado.errores.length} pedido(s) con error`);
        toast.warning(partes.join(". ") + ".");
      } else {
        toast.success(partes.join(". ") + ".");
      }
    },
    onError: () => toast.error("No se pudo sincronizar. Probá de nuevo en unos segundos."),
  });

  function cambiarVista(valor: string) {
    setSearchParams((actual) => {
      const siguiente = new URLSearchParams(actual);
      if (valor === "grilla") siguiente.delete("vista");
      else siguiente.set("vista", valor);
      return siguiente;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutacionSincronizar.isPending}
          onClick={() => mutacionSincronizar.mutate()}
        >
          {mutacionSincronizar.isPending ? "Sincronizando…" : "Sincronizar estados"}
        </Button>
      </div>

      <Tabs value={vista} onValueChange={cambiarVista}>
        <TabsList>
          <TabsTrigger value="grilla">Grilla</TabsTrigger>
          <TabsTrigger value="revision">Revisión antes de enviar</TabsTrigger>
        </TabsList>
        <TabsContent value="grilla" className="pt-4">
          <PedidosTabla />
        </TabsContent>
        <TabsContent value="revision" className="pt-4">
          <RevisionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
