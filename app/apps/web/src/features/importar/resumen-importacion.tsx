import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResultadoImportacionCompleta } from "./tipos";

// Resultado final del pipeline de importación (§7-§8 funcional): cuántos
// pedidos se crearon, qué filas no se pudieron procesar y cuántos
// destinatarios tenían una dirección distinta a la del padrón.
export function ResumenImportacion({
  resultado,
  onImportarOtro,
}: {
  resultado: ResultadoImportacionCompleta;
  onImportarOtro: () => void;
}) {
  const tieneErrores = resultado.filasConError.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Alert variant={tieneErrores ? "destructive" : "default"}>
        {tieneErrores ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
        <AlertTitle>
          {tieneErrores ? "Importación completada con errores" : "Importación completada"}
        </AlertTitle>
        <AlertDescription>
          Se crearon {resultado.pedidosCreados} pedido{resultado.pedidosCreados === 1 ? "" : "s"}.
          {resultado.alertasDireccion > 0 &&
            ` ${resultado.alertasDireccion} destinatario(s) tenían una dirección distinta a la registrada — se usó la del Excel solo para este envío, revisar en Pedidos.`}
        </AlertDescription>
      </Alert>

      {tieneErrores && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {resultado.filasConError.length} fila(s) no se pudieron procesar:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Fila</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultado.filasConError.map((item) => (
                <TableRow key={item.fila}>
                  <TableCell>{item.fila}</TableCell>
                  <TableCell>{item.errores.join(" · ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button type="button" onClick={onImportarOtro} className="self-start">
        Importar otro archivo
      </Button>
    </div>
  );
}
