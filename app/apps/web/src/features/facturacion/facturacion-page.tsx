import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarClientesActivos } from "@/features/clientes/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZonasTarifariasTab } from "@/features/zonas-tarifarias/zonas-tarifarias-tab";
import { LiquidacionTab } from "./liquidacion-tab";
import { TarifasTab } from "./tarifas-tab";
import { NOMBRES_MES } from "./formato";

const VISTAS = ["liquidacion", "tarifas", "zonas"] as const;
type Vista = (typeof VISTAS)[number];

const HOY = new Date();
const ANIOS_DISPONIBLES = Array.from({ length: 5 }, (_, i) => HOY.getFullYear() - 2 + i);

// Cliente + mes/año en la URL (mismo criterio que el filtro de estado y la
// pestaña de Pedidos): sobrevive a un refresh y se puede compartir el link.
export function FacturacionPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const clienteId = searchParams.get("clienteId");
  const mes = Number(searchParams.get("mes")) || HOY.getMonth() + 1;
  const anio = Number(searchParams.get("anio")) || HOY.getFullYear();
  const vista = (searchParams.get("vista") as Vista | null) ?? "liquidacion";

  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });

  function actualizarParam(clave: string, valor: string) {
    setSearchParams((actual) => {
      const nuevo = new URLSearchParams(actual);
      nuevo.set(clave, valor);
      return nuevo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Facturación</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="cliente-facturacion" className="text-sm text-muted-foreground">
            Cliente
          </label>
          <Select value={clienteId ?? ""} onValueChange={(valor) => actualizarParam("clienteId", valor)}>
            <SelectTrigger id="cliente-facturacion" className="w-full sm:w-64">
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
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="mes-facturacion" className="text-sm text-muted-foreground">
            Mes
          </label>
          <Select value={String(mes)} onValueChange={(valor) => actualizarParam("mes", valor)}>
            <SelectTrigger id="mes-facturacion" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOMBRES_MES.map((nombre, i) => (
                <SelectItem key={nombre} value={String(i + 1)}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="anio-facturacion" className="text-sm text-muted-foreground">
            Año
          </label>
          <Select value={String(anio)} onValueChange={(valor) => actualizarParam("anio", valor)}>
            <SelectTrigger id="anio-facturacion" className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIOS_DISPONIBLES.map((anioDisponible) => (
                <SelectItem key={anioDisponible} value={String(anioDisponible)}>
                  {anioDisponible}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={vista} onValueChange={(valor) => actualizarParam("vista", valor)}>
        <TabsList>
          <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="zonas">Zonas tarifarias</TabsTrigger>
        </TabsList>
        <TabsContent value="liquidacion" className="pt-4">
          <LiquidacionTab clienteId={clienteId} mes={mes} anio={anio} />
        </TabsContent>
        <TabsContent value="tarifas" className="pt-4">
          <TarifasTab clienteId={clienteId} />
        </TabsContent>
        <TabsContent value="zonas" className="pt-4">
          <ZonasTarifariasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
