import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormatoRemito, TipoServicioCliente } from "@mym/shared-types";
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

const SIN_REMITO = "SIN_REMITO";
const ETIQUETAS_FORMATO_REMITO: Record<FormatoRemito, string> = {
  [FormatoRemito.BELLA_VISTA]: "Bella Vista (A4 triplicado)",
  [FormatoRemito.FARMAPAL]: "Farmapal (17×22cm duplicado)",
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
  const [formatoRemito, setFormatoRemito] = useState<string>(SIN_REMITO);
  const [usaCarga3, setUsaCarga3] = useState(false);
  const [tipoVisitaSimpliRoute, setTipoVisitaSimpliRoute] = useState("");
  const [notaSimpliRoute, setNotaSimpliRoute] = useState("");
  const [sellerSimpliRoute, setSellerSimpliRoute] = useState("");
  const [remitoHabilitado, setRemitoHabilitado] = useState(false);

  useEffect(() => {
    if (editando) {
      setNombre(cliente.nombre);
      setTipoServicio(cliente.tipoServicio);
      setFacturaPorCordon(cliente.facturaPorCordon);
      setFormatoRemito(cliente.formatoRemito ?? SIN_REMITO);
      setUsaCarga3(cliente.usaCarga3);
      setTipoVisitaSimpliRoute(cliente.tipoVisitaSimpliRoute ?? "");
      setNotaSimpliRoute(cliente.notaSimpliRoute ?? "");
      setSellerSimpliRoute(cliente.sellerSimpliRoute ?? "");
      setRemitoHabilitado(cliente.remitoHabilitado);
    } else {
      setNombre("");
      setTipoServicio(TipoServicioCliente.PANAL);
      setFacturaPorCordon(false);
      setFormatoRemito(SIN_REMITO);
      setUsaCarga3(false);
      setTipoVisitaSimpliRoute("");
      setNotaSimpliRoute("");
      setSellerSimpliRoute("");
      setRemitoHabilitado(false);
    }
  }, [cliente, editando]);

  const queryClient = useQueryClient();
  const mutacion = useMutation({
    mutationFn: async () => {
      const camposSimpliRoute = {
        tipoVisitaSimpliRoute: tipoVisitaSimpliRoute || undefined,
        notaSimpliRoute: notaSimpliRoute || undefined,
        sellerSimpliRoute: sellerSimpliRoute || undefined,
        remitoHabilitado,
      };
      if (editando) {
        return actualizarCliente(cliente.id, {
          nombre,
          tipoServicio,
          facturaPorCordon,
          formatoRemito: formatoRemito === SIN_REMITO ? null : (formatoRemito as FormatoRemito),
          usaCarga3,
          ...camposSimpliRoute,
        });
      }
      return crearCliente({ nombre, tipoServicio, facturaPorCordon, ...camposSimpliRoute });
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

        <form onSubmit={manejarSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
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

            <FilaFormulario
              label="Tipo de visita (SimpliRoute)"
              htmlFor="tipo-visita-cliente"
              anchoEtiqueta="140px"
              descripcion="Texto libre que identifica a este cliente en SimpliRoute — reunión 2026-10-23."
            >
              <Input
                id="tipo-visita-cliente"
                value={tipoVisitaSimpliRoute}
                onChange={(e) => setTipoVisitaSimpliRoute(e.target.value)}
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario
              label="Nota (SimpliRoute)"
              htmlFor="nota-simpliroute-cliente"
              anchoEtiqueta="140px"
              descripcion="Texto fijo que se agrega a la nota que ve el chofer en todos los pedidos de este cliente."
            >
              <Input
                id="nota-simpliroute-cliente"
                value={notaSimpliRoute}
                onChange={(e) => setNotaSimpliRoute(e.target.value)}
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario
              label="Seller (SimpliRoute)"
              htmlFor="seller-cliente"
              anchoEtiqueta="140px"
              descripcion="Nombre o alias del Seller tal cual figura en SimpliRoute. Si no hay coincidencia, o la cuenta no tiene Sellers habilitado, el envío sigue igual sin este dato."
            >
              <Input
                id="seller-cliente"
                value={sellerSimpliRoute}
                onChange={(e) => setSellerSimpliRoute(e.target.value)}
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            <FilaFormulario
              label="Manda remito a SimpliRoute"
              htmlFor="remito-habilitado-cliente"
              anchoEtiqueta="140px"
              descripcion="Si este cliente trae remito en su Excel, se manda como referencia del pedido en SimpliRoute en vez de nuestro propio identificador interno."
            >
              <Checkbox
                id="remito-habilitado-cliente"
                checked={remitoHabilitado}
                onCheckedChange={(valor) => setRemitoHabilitado(valor === true)}
                disabled={mutacion.isPending}
              />
            </FilaFormulario>

            {editando && (
              <FilaFormulario
                label="Remito preimpreso"
                htmlFor="formato-remito-cliente"
                anchoEtiqueta="140px"
                descripcion="Papel con membrete propio del cliente — define en qué coordenadas se imprimen los datos del pedido. Sin esto configurado no se puede imprimir el remito."
              >
                <Select value={formatoRemito} onValueChange={setFormatoRemito} disabled={mutacion.isPending}>
                  <SelectTrigger id="formato-remito-cliente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_REMITO}>Sin remito preimpreso</SelectItem>
                    {Object.values(FormatoRemito).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {ETIQUETAS_FORMATO_REMITO[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilaFormulario>
            )}

            {editando && (
              <FilaFormulario
                label="Usa Carga 3 en SimpliRoute"
                htmlFor="usa-carga3-cliente"
                anchoEtiqueta="140px"
                descripcion="Marca la Visit con Carga 3 (load_3) al enviarla a SimpliRoute — hoy solo lo necesita SACEIP SOLIS. La mayoría de los clientes no debería tocar esto."
              >
                <Checkbox
                  id="usa-carga3-cliente"
                  checked={usaCarga3}
                  onCheckedChange={(valor) => setUsaCarga3(valor === true)}
                  disabled={mutacion.isPending}
                />
              </FilaFormulario>
            )}
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
