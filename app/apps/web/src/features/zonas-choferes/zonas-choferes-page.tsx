import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChoferesTab } from "./choferes-tab";
import { VehiculosTab } from "./vehiculos-tab";
import { ZonasTab } from "./zonas-tab";

export function ZonasChoferesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Zonas y choferes</h1>
        <p className="text-sm text-muted-foreground">
          Todo lo de acá se trae de SimpliRoute — es la fuente de verdad. Zonas es de solo lectura; Choferes
          y Vehículos se pueden crear y editar directo desde acá.
        </p>
      </div>

      <Tabs defaultValue="zonas">
        <TabsList>
          <TabsTrigger value="zonas">Zonas</TabsTrigger>
          <TabsTrigger value="choferes">Choferes</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
        </TabsList>
        <TabsContent value="zonas" className="pt-4">
          <ZonasTab />
        </TabsContent>
        <TabsContent value="choferes" className="pt-4">
          <ChoferesTab />
        </TabsContent>
        <TabsContent value="vehiculos" className="pt-4">
          <VehiculosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
