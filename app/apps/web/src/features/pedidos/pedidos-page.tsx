import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PedidosTabla } from "./pedidos-tabla";
import { RevisionPanel } from "./revision-panel";

export function PedidosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Pedidos</h1>

      <Tabs defaultValue="grilla">
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
