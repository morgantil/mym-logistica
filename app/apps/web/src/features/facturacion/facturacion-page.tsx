import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarClientesActivos } from "@/features/clientes/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZonasTarifariasTab } from "@/features/zonas-tarifarias/zonas-tarifarias-tab";
import type { RangoFechas } from "./api";
import { LiquidacionTab } from "./liquidacion-tab";
import { TarifasTab } from "./tarifas-tab";
import { TransportistasTab } from "./transportistas-tab";
import { NOMBRES_MES } from "./formato";

const VISTAS = ["liquidacion", "tarifas", "zonas", "transportistas"] as const;
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
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");
  // Decisión 2026-10-04 (reunión con el cliente): datepicker libre, el
  // usuario elige cualquier rango dentro del mes — no son presets fijos de
  // semana/día. Solo acota qué se MUESTRA/exporta (detalle y Excel); el
  // cierre mensual de vista previa/confirmar no se toca.
  const rango: RangoFechas | undefined = fechaDesde && fechaHasta ? { fechaDesde, fechaHasta } : undefined;
  const primerDiaDelMes = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDiaDelMes = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);

  const { data: clientes } = useQuery({ queryKey: ["clientes"], queryFn: listarClientesActivos });

  function actualizarParam(clave: string, valor: string) {
    setSearchParams((actual) => {
      const nuevo = new URLSearchParams(actual);
      nuevo.set(clave, valor);
      return nuevo;
    });
  }

  function limpiarRango() {
    setSearchParams((actual) => {
      const nuevo = new URLSearchParams(actual);
      nuevo.delete("fechaDesde");
      nuevo.delete("fechaHasta");
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

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha-desde-facturacion" className="text-sm text-muted-foreground">
            Rango dentro del mes (opcional)
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="fecha-desde-facturacion"
              type="date"
              min={primerDiaDelMes}
              max={fechaHasta || ultimoDiaDelMes}
              value={fechaDesde ?? ""}
              onChange={(e) => actualizarParam("fechaDesde", e.target.value)}
              className="w-full sm:w-40"
            />
            <span className="text-sm text-muted-foreground">a</span>
            <Input
              id="fecha-hasta-facturacion"
              type="date"
              min={fechaDesde || primerDiaDelMes}
              max={ultimoDiaDelMes}
              value={fechaHasta ?? ""}
              onChange={(e) => actualizarParam("fechaHasta", e.target.value)}
              className="w-full sm:w-40"
            />
            {rango && (
              <Button type="button" variant="ghost" size="sm" onClick={limpiarRango}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>
      {rango && (
        <p className="text-sm text-muted-foreground -mt-2">
          Mostrando solo del {fechaDesde} al {fechaHasta} — la vista previa y la confirmación siguen siendo del mes
          completo.
        </p>
      )}

      <Tabs value={vista} onValueChange={(valor) => actualizarParam("vista", valor)}>
        <TabsList>
          <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="zonas">Zonas tarifarias</TabsTrigger>
          <TabsTrigger value="transportistas">Transportistas</TabsTrigger>
        </TabsList>
        <TabsContent value="liquidacion" className="pt-4">
          <LiquidacionTab clienteId={clienteId} mes={mes} anio={anio} rango={rango} />
        </TabsContent>
        <TabsContent value="tarifas" className="pt-4">
          <TarifasTab clienteId={clienteId} />
        </TabsContent>
        <TabsContent value="zonas" className="pt-4">
          <ZonasTarifariasTab />
        </TabsContent>
        <TabsContent value="transportistas" className="pt-4">
          <TransportistasTab mes={mes} anio={anio} rango={rango} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
