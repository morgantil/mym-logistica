import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Plus, Trash2 } from "lucide-react";
import { TipoServicio, TipoServicioCliente } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Cliente } from "@/features/clientes/tipos";
import type { DatosPedidoManual, ResultadoImportacionCompleta } from "@/features/importar/tipos";
import { ResumenImportacion } from "@/features/importar/resumen-importacion";

const LABEL_TIPO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

// Mismo criterio que Importar Excel (clienteAceptaTipoServicio) — un
// cliente PANAL no puede recibir un pedido manual de Medicamentos.
function clienteAceptaTipoServicio(tipoServicioCliente: TipoServicioCliente, tipo: TipoServicio): boolean {
  if (tipoServicioCliente === TipoServicioCliente.AMBOS) return true;
  return tipoServicioCliente === (tipo as unknown as TipoServicioCliente);
}

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return "No se pudo crear el pedido. Probá de nuevo en unos segundos.";
}

const HOY = new Date().toISOString().slice(0, 10);

interface ProductoFormulario {
  codigoProducto: string;
  descripcionProducto: string;
  cantidad: string;
}

function productoVacio(): ProductoFormulario {
  return { codigoProducto: "", descripcionProducto: "", cantidad: "1" };
}

function vacio(): {
  tipoServicio: TipoServicio;
  clienteId: string;
  fechaEntrega: string;
  numeroAfiliado: string;
  destinatario: string;
  direccion: string;
  localidad: string;
  telefono: string;
  ticket: string;
  productos: ProductoFormulario[];
  entreCalles: string;
  receta: string;
  tipoPedido: string;
  retiroDeReceta: string;
  tiempoDeEntrega: string;
  horarioEntrega: string;
  cantidadBulto: string;
  cantidadBolsa: string;
} {
  return {
    tipoServicio: TipoServicio.PANAL,
    clienteId: "",
    fechaEntrega: HOY,
    numeroAfiliado: "",
    destinatario: "",
    direccion: "",
    localidad: "",
    telefono: "",
    ticket: "",
    productos: [productoVacio()],
    entreCalles: "",
    receta: "",
    tipoPedido: "",
    retiroDeReceta: "",
    tiempoDeEntrega: "",
    horarioEntrega: "",
    cantidadBulto: "",
    cantidadBolsa: "",
  };
}

// Alta manual de pedidos (reunión 2026-10-21, Pablo Renzo): "agregar un
// pedido a mano, sin pasar por Excel". La estructura de campos varía según
// el tipo de cliente (Pañales necesita una lista de productos; Medicamentos
// necesita cantidad de Bulto/Bolsa y los campos propios de ese rubro) — ver
// comentario en ImportarExcelService.crearPedidoManual sobre por qué la
// validación real la hace el mismo pipeline que una importación.
export function PedidoManualFormSheet({
  abierto,
  clientes,
  onCrear,
  onOpenChange,
}: {
  abierto: boolean;
  clientes: Cliente[] | undefined;
  onCrear: (datos: DatosPedidoManual) => Promise<ResultadoImportacionCompleta>;
  onOpenChange: (abierto: boolean) => void;
}) {
  const [datos, setDatos] = useState(vacio());
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionCompleta | null>(null);

  useEffect(() => {
    if (abierto) {
      setDatos(vacio());
      setError(null);
      setResultado(null);
    }
  }, [abierto]);

  const clientesFiltrados = useMemo(
    () => clientes?.filter((cliente) => clienteAceptaTipoServicio(cliente.tipoServicio, datos.tipoServicio)),
    [clientes, datos.tipoServicio],
  );

  function actualizarProducto(indice: number, campo: keyof ProductoFormulario, valor: string) {
    setDatos((d) => ({
      ...d,
      productos: d.productos.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)),
    }));
  }

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const comun: DatosPedidoManual = {
        clienteId: datos.clienteId,
        tipoServicio: datos.tipoServicio,
        fechaEntrega: datos.fechaEntrega,
        numeroAfiliado: datos.numeroAfiliado,
        destinatario: datos.destinatario,
        direccion: datos.direccion,
        localidad: datos.localidad,
        telefono: datos.telefono || undefined,
        ticket: datos.ticket || undefined,
      };
      const payload: DatosPedidoManual =
        datos.tipoServicio === TipoServicio.MEDICAMENTO
          ? {
              ...comun,
              entreCalles: datos.entreCalles || undefined,
              receta: datos.receta || undefined,
              tipoPedido: datos.tipoPedido || undefined,
              retiroDeReceta: datos.retiroDeReceta || undefined,
              tiempoDeEntrega: datos.tiempoDeEntrega || undefined,
              horarioEntrega: datos.horarioEntrega || undefined,
              cantidadBulto: datos.cantidadBulto ? Number(datos.cantidadBulto) : undefined,
              cantidadBolsa: datos.cantidadBolsa ? Number(datos.cantidadBolsa) : undefined,
            }
          : {
              ...comun,
              productos: datos.productos
                .filter((p) => p.descripcionProducto.trim())
                .map((p) => ({
                  codigoProducto: p.codigoProducto || undefined,
                  descripcionProducto: p.descripcionProducto,
                  cantidad: Number(p.cantidad) || 1,
                })),
            };
      const resultado = await onCrear(payload);
      setResultado(resultado);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Alta manual de pedido</SheetTitle>
        </SheetHeader>

        {resultado ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
            <ResumenImportacion
              resultado={resultado}
              onImportarOtro={() => setResultado(null)}
              textoBoton="Cargar otro pedido"
            />
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <TablaFormulario>
              <FilaFormulario label="Tipo" htmlFor="pm-tipo" anchoEtiqueta="140px">
                <Select
                  value={datos.tipoServicio}
                  onValueChange={(valor) =>
                    setDatos((d) => ({ ...d, tipoServicio: valor as TipoServicio, clienteId: "" }))
                  }
                >
                  <SelectTrigger id="pm-tipo" disabled={enviando}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TipoServicio).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {LABEL_TIPO[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilaFormulario>
              <FilaFormulario label="Cliente" htmlFor="pm-cliente" anchoEtiqueta="140px">
                <Select
                  value={datos.clienteId}
                  onValueChange={(valor) => setDatos((d) => ({ ...d, clienteId: valor }))}
                >
                  <SelectTrigger id="pm-cliente" disabled={enviando}>
                    <SelectValue placeholder="Elegí un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesFiltrados?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilaFormulario>
              <FilaFormulario label="Fecha de entrega" htmlFor="pm-fecha" anchoEtiqueta="140px">
                <Input
                  id="pm-fecha"
                  type="date"
                  value={datos.fechaEntrega}
                  onChange={(e) => setDatos((d) => ({ ...d, fechaEntrega: e.target.value }))}
                  required
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="N.º de afiliado" htmlFor="pm-afiliado" anchoEtiqueta="140px">
                <Input
                  id="pm-afiliado"
                  value={datos.numeroAfiliado}
                  onChange={(e) => setDatos((d) => ({ ...d, numeroAfiliado: e.target.value }))}
                  required
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="Destinatario" htmlFor="pm-destinatario" anchoEtiqueta="140px">
                <Input
                  id="pm-destinatario"
                  value={datos.destinatario}
                  onChange={(e) => setDatos((d) => ({ ...d, destinatario: e.target.value }))}
                  required
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="Dirección" htmlFor="pm-direccion" anchoEtiqueta="140px">
                <Input
                  id="pm-direccion"
                  value={datos.direccion}
                  onChange={(e) => setDatos((d) => ({ ...d, direccion: e.target.value }))}
                  required
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="Localidad" htmlFor="pm-localidad" anchoEtiqueta="140px">
                <Input
                  id="pm-localidad"
                  value={datos.localidad}
                  onChange={(e) => setDatos((d) => ({ ...d, localidad: e.target.value }))}
                  required
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="Teléfono" htmlFor="pm-telefono" anchoEtiqueta="140px" descripcion="Opcional">
                <Input
                  id="pm-telefono"
                  value={datos.telefono}
                  onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value }))}
                  disabled={enviando}
                />
              </FilaFormulario>
              <FilaFormulario label="Ticket / remito" htmlFor="pm-ticket" anchoEtiqueta="140px" descripcion="Opcional">
                <Input
                  id="pm-ticket"
                  value={datos.ticket}
                  onChange={(e) => setDatos((d) => ({ ...d, ticket: e.target.value }))}
                  disabled={enviando}
                />
              </FilaFormulario>
            </TablaFormulario>

            {datos.tipoServicio === TipoServicio.PANAL ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Productos</p>
                {datos.productos.map((producto, indice) => (
                  <div key={indice} className="flex items-center gap-2">
                    <Input
                      placeholder="Código (opcional)"
                      className="w-32"
                      value={producto.codigoProducto}
                      onChange={(e) => actualizarProducto(indice, "codigoProducto", e.target.value)}
                      disabled={enviando}
                    />
                    <Input
                      placeholder="Descripción"
                      className="flex-1"
                      value={producto.descripcionProducto}
                      onChange={(e) => actualizarProducto(indice, "descripcionProducto", e.target.value)}
                      disabled={enviando}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Cant."
                      className="w-20"
                      value={producto.cantidad}
                      onChange={(e) => actualizarProducto(indice, "cantidad", e.target.value)}
                      disabled={enviando}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={enviando || datos.productos.length === 1}
                      onClick={() =>
                        setDatos((d) => ({ ...d, productos: d.productos.filter((_, i) => i !== indice) }))
                      }
                      aria-label="Quitar producto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  disabled={enviando}
                  onClick={() => setDatos((d) => ({ ...d, productos: [...d.productos, productoVacio()] }))}
                >
                  <Plus className="size-4" /> Agregar producto
                </Button>
              </div>
            ) : (
              <TablaFormulario>
                <FilaFormulario label="Cant. Bulto" htmlFor="pm-bulto" anchoEtiqueta="140px">
                  <Input
                    id="pm-bulto"
                    type="number"
                    min={1}
                    value={datos.cantidadBulto}
                    onChange={(e) => setDatos((d) => ({ ...d, cantidadBulto: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Cant. Bolsa" htmlFor="pm-bolsa" anchoEtiqueta="140px">
                  <Input
                    id="pm-bolsa"
                    type="number"
                    min={1}
                    value={datos.cantidadBolsa}
                    onChange={(e) => setDatos((d) => ({ ...d, cantidadBolsa: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Entre calles" htmlFor="pm-entrecalles" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-entrecalles"
                    value={datos.entreCalles}
                    onChange={(e) => setDatos((d) => ({ ...d, entreCalles: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Receta" htmlFor="pm-receta" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-receta"
                    value={datos.receta}
                    onChange={(e) => setDatos((d) => ({ ...d, receta: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Tipo de pedido" htmlFor="pm-tipopedido" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-tipopedido"
                    value={datos.tipoPedido}
                    onChange={(e) => setDatos((d) => ({ ...d, tipoPedido: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Retiro de receta" htmlFor="pm-retiro" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-retiro"
                    value={datos.retiroDeReceta}
                    onChange={(e) => setDatos((d) => ({ ...d, retiroDeReceta: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Tiempo de entrega" htmlFor="pm-tiempo" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-tiempo"
                    value={datos.tiempoDeEntrega}
                    onChange={(e) => setDatos((d) => ({ ...d, tiempoDeEntrega: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
                <FilaFormulario label="Horario de entrega" htmlFor="pm-horario" anchoEtiqueta="140px" descripcion="Opcional">
                  <Input
                    id="pm-horario"
                    value={datos.horarioEntrega}
                    onChange={(e) => setDatos((d) => ({ ...d, horarioEntrega: e.target.value }))}
                    disabled={enviando}
                  />
                </FilaFormulario>
              </TablaFormulario>
            )}

            <SheetFooter className="px-0">
              <Button type="submit" disabled={enviando}>
                {enviando ? "Creando…" : "Crear pedido"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
