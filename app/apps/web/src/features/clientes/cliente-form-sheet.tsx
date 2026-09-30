import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TipoServicioCliente } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { actualizarCliente, crearCliente } from "./api";
import type { Cliente } from "./tipos";

const ETIQUETAS_TIPO_SERVICIO: Record<TipoServicioCliente, string> = {
  [TipoServicioCliente.PANAL]: "Pañales",
  [TipoServicioCliente.MEDICAMENTO]: "Medicamentos",
  [TipoServicioCliente.AMBOS]: "Ambos",
};

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo guardar. Probá de nuevo en unos segundos.";
}

// Un solo formulario para crear y editar — si viene `cliente`, edita; si no, crea.
export function ClienteFormSheet({
  cliente,
  onOpenChange,
}: {
  cliente: Cliente | null | "nuevo";
  onOpenChange: (abierto: boolean) => void;
}) {
  const abierto = cliente !== null;
  const editando = cliente !== null && cliente !== "nuevo";

  const [nombre, setNombre] = useState("");
  const [tipoServicio, setTipoServicio] = useState<TipoServicioCliente>(TipoServicioCliente.PANAL);
  const [facturaPorCordon, setFacturaPorCordon] = useState(false);

  useEffect(() => {
    if (editando) {
      setNombre(cliente.nombre);
      setTipoServicio(cliente.tipoServicio);
      setFacturaPorCordon(cliente.facturaPorCordon);
    } else {
      setNombre("");
      setTipoServicio(TipoServicioCliente.PANAL);
      setFacturaPorCordon(false);
    }
  }, [cliente, editando]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: async () => {
      if (editando) {
        return actualizarCliente(cliente.id, { nombre, tipoServicio, facturaPorCordon });
      }
      return crearCliente({ nombre, tipoServicio, facturaPorCordon });
    },
    onSuccess: () => {
      toast.success(editando ? "Cliente actualizado." : "Cliente creado.");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(mensajeError(error)),
  });

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    mutacion.mutate();
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 px-4">
          <TablaFormulario>
            <FilaFormulario label="Nombre" htmlFor="nombre-cliente" anchoEtiqueta="140px">
              <Input
                id="nombre-cliente"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario
              label="Tipo de servicio"
              htmlFor="tipo-servicio-cliente"
              anchoEtiqueta="140px"
              descripcion="Determina qué reglas de facturación aplican (ej. Bolsa/Bulto es solo para medicamentos)."
            >
              <Select
                value={tipoServicio}
                onValueChange={(valor) => setTipoServicio(valor as TipoServicioCliente)}
                disabled={mutacion.isPending}
              >
                <SelectTrigger id="tipo-servicio-cliente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TipoServicioCliente).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {ETIQUETAS_TIPO_SERVICIO[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilaFormulario>

            <FilaFormulario
              label="Factura por Cordón"
              htmlFor="factura-por-cordon-cliente"
              anchoEtiqueta="140px"
              descripcion={
                facturaPorCordon
                  ? "Un pedido fuera de CABA busca el partido y factura por Cordón (Primer/Segundo/Tercer) — como Bella Vista Medicamentos."
                  : "Un pedido fuera de CABA factura siempre a la tarifa plana \"Provincia\", sin distinguir Cordón — como Biosíntesis o Bella Vista PAÑALES."
              }
            >
              <Checkbox
                id="factura-por-cordon-cliente"
                checked={facturaPorCordon}
                onCheckedChange={(valor) => setFacturaPorCordon(valor === true)}
                disabled={mutacion.isPending}
              />
            </FilaFormulario>
          </TablaFormulario>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={mutacion.isPending}>
              {mutacion.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
