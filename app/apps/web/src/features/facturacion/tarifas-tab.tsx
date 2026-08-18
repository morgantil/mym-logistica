import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarPorcentajes, listarTarifas } from "./api";
import { formatearMonto } from "./formato";
import { PorcentajeFormSheet } from "./porcentaje-form-sheet";
import { TarifaFormSheet } from "./tarifa-form-sheet";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

export function TarifasTab({ clienteId }: { clienteId: string | null }) {
  const [sheetAbierto, setSheetAbierto] = useState<"tarifa" | "porcentaje" | null>(null);

  const { data: tarifas, isLoading: cargandoTarifas } = useQuery({
    queryKey: ["facturacion", "tarifas", clienteId],
    queryFn: () => listarTarifas(clienteId!),
    enabled: clienteId !== null,
  });
  const { data: porcentajes, isLoading: cargandoPorcentajes } = useQuery({
    queryKey: ["facturacion", "porcentajes", clienteId],
    queryFn: () => listarPorcentajes(clienteId!),
    enabled: clienteId !== null,
  });

  if (clienteId === null) {
    return <p className="text-sm text-muted-foreground">Elegí un cliente arriba para ver sus tarifas.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tarifas por zona</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setSheetAbierto("tarifa")}>
            Nueva tarifa
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vigencia desde</TableHead>
              <TableHead>Vigencia hasta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoTarifas ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : tarifas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Todavía no hay tarifas cargadas para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              tarifas?.map((tarifa) => (
                <TableRow key={tarifa.id}>
                  <TableCell>{tarifa.zonaTarifariaNombre ?? tarifa.zonaTarifariaId}</TableCell>
                  <TableCell>{formatearMonto(tarifa.monto)}</TableCell>
                  <TableCell>{formatearFecha(tarifa.vigenciaDesde)}</TableCell>
                  <TableCell>{tarifa.vigenciaHasta ? formatearFecha(tarifa.vigenciaHasta) : "Vigente"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Porcentaje del segundo servicio (entregas unificadas)</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setSheetAbierto("porcentaje")}>
            Nuevo porcentaje
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Porcentaje</TableHead>
              <TableHead>Vigencia desde</TableHead>
              <TableHead>Vigencia hasta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoPorcentajes ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : porcentajes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Todavía no hay un porcentaje cargado — solo hace falta si este cliente tiene entregas
                  unificadas de pañales y medicamentos.
                </TableCell>
              </TableRow>
            ) : (
              porcentajes?.map((porcentaje) => (
                <TableRow key={porcentaje.id}>
                  <TableCell>{porcentaje.porcentaje}%</TableCell>
                  <TableCell>{formatearFecha(porcentaje.vigenciaDesde)}</TableCell>
                  <TableCell>
                    {porcentaje.vigenciaHasta ? formatearFecha(porcentaje.vigenciaHasta) : "Vigente"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TarifaFormSheet
        clienteId={clienteId}
        abierto={sheetAbierto === "tarifa"}
        onOpenChange={(abierto) => !abierto && setSheetAbierto(null)}
      />
      <PorcentajeFormSheet
        clienteId={clienteId}
        abierto={sheetAbierto === "porcentaje"}
        onOpenChange={(abierto) => !abierto && setSheetAbierto(null)}
      />
    </div>
  );
}
