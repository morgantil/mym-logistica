import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <h1 className="text-xl font-semibold">Pedidos</h1>

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
