import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Muestra una contraseña temporal generada por el backend UNA sola vez —
// no se puede volver a ver después de cerrar esto (nunca se guarda en texto
// plano, solo el hash). Se usa tanto al crear un usuario como al resetear
// una contraseña existente.
export function PasswordTemporalSheet({
  abierto,
  email,
  password,
  onOpenChange,
}: {
  abierto: boolean;
  email: string | null;
  password: string | null;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopiado(true);
      toast.success("Contraseña copiada.");
    } catch {
      toast.error("No se pudo copiar automáticamente — seleccionala a mano.");
    }
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(valor) => {
        if (!valor) setCopiado(false);
        onOpenChange(valor);
      }}
    >
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Contraseña temporal</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <p className="text-sm text-muted-foreground">
            Pasásela a <strong>{email}</strong> por un canal seguro. No queda guardada en ningún lado — si
            se pierde, hay que generar una nueva desde "Resetear contraseña".
          </p>

          <div className="flex gap-2">
            <Input readOnly value={password ?? ""} className="font-mono" onFocus={(e) => e.target.select()} />
            <Button type="button" variant="outline" onClick={copiar}>
              {copiado ? "Copiada" : "Copiar"}
            </Button>
          </div>
        </div>

        <SheetFooter className="px-0">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
