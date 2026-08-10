import { useRef } from "react";
import { Button } from "@/components/ui/button";

// Reemplaza el input de archivo nativo (una caja larga con un botón gris
// pegado) por un botón chico normal — mismo estilo que cualquier otra acción
// de la app — más el nombre del archivo elegido al lado, bien visible.
export function SelectorArchivo({
  id,
  accept,
  disabled,
  archivo,
  onChange,
}: {
  id: string;
  accept?: string;
  disabled?: boolean;
  archivo: File | null;
  onChange: (archivo: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Seleccionar archivo
      </Button>
      <span className="text-sm text-muted-foreground">
        {archivo ? archivo.name : "Ningún archivo seleccionado"}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
    </div>
  );
}
