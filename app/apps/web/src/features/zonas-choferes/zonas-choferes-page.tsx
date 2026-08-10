import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChoferesTab } from "./choferes-tab";
import { ZonasTab } from "./zonas-tab";

export function ZonasChoferesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Zonas y choferes</h1>

      <Tabs defaultValue="zonas">
        <TabsList>
          <TabsTrigger value="zonas">Zonas</TabsTrigger>
          <TabsTrigger value="choferes">Choferes</TabsTrigger>
        </TabsList>
        <TabsContent value="zonas" className="pt-4">
          <ZonasTab />
        </TabsContent>
        <TabsContent value="choferes" className="pt-4">
          <ChoferesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
