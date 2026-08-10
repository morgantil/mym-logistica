import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAMPO_CANONICO_LABELS } from "./campo-labels";
import type { MapeoColumnas, ResultadoRequiereMapeoManual } from "./tipos";

// §6 funcional: cuando el diccionario de sinónimos no alcanzó para mapear
// todo solo, el usuario indica UNA vez qué columna del Excel corresponde a
// cada campo obligatorio que falta. Queda guardado por cliente — la próxima
// importación de este mismo cliente no vuelve a pedirlo (ver README del
// módulo importadores en el backend).
export function MapeoManualForm({
  resultado,
  onConfirmar,
  enviando,
}: {
  resultado: ResultadoRequiereMapeoManual;
  onConfirmar: (mapeoManual: MapeoColumnas) => void;
  enviando: boolean;
}) {
  const [selecciones, setSelecciones] = useState<MapeoColumnas>({});

  const detectadosAutomaticamente = Object.entries(resultado.mapeoAutomaticoParcial);
  const faltanSelecciones = resultado.camposObligatoriosFaltantes.some((campo) => !selecciones[campo]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        No pudimos identificar automáticamente todas las columnas de este Excel. Indicá qué columna
        corresponde a cada campo — la próxima vez que importes un archivo de este cliente no hace falta
        repetirlo.
      </p>

      {detectadosAutomaticamente.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Ya identificamos solos:{" "}
          {detectadosAutomaticamente
            .map(([campo, encabezado]) => `${CAMPO_CANONICO_LABELS[campo as keyof typeof CAMPO_CANONICO_LABELS]} → "${encabezado}"`)
            .join(", ")}
          .
        </p>
      )}

      <TablaFormulario>
        {resultado.camposObligatoriosFaltantes.map((campo) => (
          <FilaFormulario key={campo} label={CAMPO_CANONICO_LABELS[campo]} htmlFor={`campo-${campo}`}>
            <Select
              value={selecciones[campo] ?? ""}
              onValueChange={(valor) => setSelecciones((actual) => ({ ...actual, [campo]: valor }))}
            >
              <SelectTrigger id={`campo-${campo}`} className="w-full sm:w-80">
                <SelectValue placeholder="Elegí la columna del Excel" />
              </SelectTrigger>
              <SelectContent>
                {resultado.encabezadosDisponibles.map((encabezado) => (
                  <SelectItem key={encabezado} value={encabezado}>
                    {encabezado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilaFormulario>
        ))}
      </TablaFormulario>

      <Button
        type="button"
        disabled={faltanSelecciones || enviando}
        onClick={() => onConfirmar(selecciones)}
        className="self-start"
      >
        {enviando ? "Procesando…" : "Confirmar mapeo e importar"}
      </Button>
    </div>
  );
}
