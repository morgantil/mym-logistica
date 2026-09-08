import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Reuso del formulario genérico de un campo "Nombre" — ver ese componente
// para el porqué de compartirlo entre Zona/Chofer/ZonaTarifaria.
import { NombreFormSheet } from "@/features/zonas-choferes/nombre-form-sheet";
import {
  actualizarZonaTarifaria,
  asignarLocalidad,
  asignarPartido,
  crearZonaTarifaria,
  listarMapeoLocalidades,
  listarMapeoPartidos,
  listarZonasTarifarias,
  quitarLocalidad,
  quitarPartido,
} from "./api";
import type { ZonaTarifaria } from "./tipos";

// §10.2 funcional (v6): "La relación Localidad → Cordón deberá ser
// configurable y no quedar fija en código" — esta pantalla es exactamente
// esa configuración. No es lo mismo que Zonas/Choferes (eso es logística,
// qué chofer le toca a un pedido); esto es facturación, qué tarifa aplica.
export function ZonasTarifariasTab() {
  const [zonaEnEdicion, setZonaEnEdicion] = useState<ZonaTarifaria | "nuevo" | null>(null);
  const [localidadNueva, setLocalidadNueva] = useState("");
  const [zonaParaLocalidad, setZonaParaLocalidad] = useState("");
  const queryClient = useQueryClient();

  const { data: zonas, isLoading, isError } = useQuery({
    queryKey: ["zonas-tarifarias"],
    queryFn: listarZonasTarifarias,
  });
  const { data: mapeo, isLoading: cargandoMapeo } = useQuery({
    queryKey: ["zonas-tarifarias", "localidades"],
    queryFn: listarMapeoLocalidades,
  });
  const { data: mapeoPartidos, isLoading: cargandoPartidos } = useQuery({
    queryKey: ["zonas-tarifarias", "partidos"],
    queryFn: listarMapeoPartidos,
  });

  const mutacionGuardar = useMutation({
    mutationFn: (nombre: string) =>
      zonaEnEdicion && zonaEnEdicion !== "nuevo"
        ? actualizarZonaTarifaria(zonaEnEdicion.id, { nombre })
        : crearZonaTarifaria(nombre),
    onSuccess: () => {
      toast.success(zonaEnEdicion === "nuevo" ? "Zona tarifaria creada." : "Zona tarifaria actualizada.");
      queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias"] });
    },
  });

  const mutacionActiva = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) => actualizarZonaTarifaria(id, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias"] }),
    onError: () => toast.error("No se pudo cambiar el estado de la zona."),
  });

  const mutacionAsignarLocalidad = useMutation({
    mutationFn: () => asignarLocalidad(localidadNueva, zonaParaLocalidad),
    onSuccess: () => {
      toast.success("Localidad asignada.");
      setLocalidadNueva("");
      setZonaParaLocalidad("");
      queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias", "localidades"] });
    },
    onError: () => toast.error("No se pudo asignar la localidad."),
  });

  const mutacionQuitarLocalidad = useMutation({
    mutationFn: (id: string) => quitarLocalidad(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias", "localidades"] }),
    onError: () => toast.error("No se pudo quitar la localidad."),
  });

  const mutacionAsignarPartido = useMutation({
    mutationFn: ({ partido, zonaTarifariaId }: { partido: string; zonaTarifariaId: string }) =>
      asignarPartido(partido, zonaTarifariaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias", "partidos"] }),
    onError: () => toast.error("No se pudo asignar el cordón."),
  });

  const mutacionQuitarPartido = useMutation({
    mutationFn: (partido: string) => quitarPartido(partido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-tarifarias", "partidos"] }),
    onError: () => toast.error("No se pudo quitar el cordón."),
  });

  const SIN_CORDON = "SIN_CORDON";

  function manejarAsignarLocalidad(evento: FormEvent) {
    evento.preventDefault();
    if (!localidadNueva.trim() || !zonaParaLocalidad) return;
    mutacionAsignarLocalidad.mutate();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Zonas tarifarias</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setZonaEnEdicion("nuevo")}>
            Nueva zona
          </Button>
        </div>

        {isError && (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar las zonas tarifarias. Probá de nuevo en unos segundos.
          </p>
        )}

        {!isError && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : (
                zonas?.map((zona) => (
                  <TableRow key={zona.id}>
                    <TableCell>{zona.nombre}</TableCell>
                    <TableCell>
                      {zona.activa ? (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                        >
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setZonaEnEdicion(zona)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={mutacionActiva.isPending}
                          onClick={() => mutacionActiva.mutate({ id: zona.id, activa: !zona.activa })}
                        >
                          {zona.activa ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Localidades por zona</h2>
        <p className="text-sm text-muted-foreground">
          A qué zona tarifaria pertenece cada localidad de Provincia (CABA no necesita mapeo, se resuelve
          sola). Una localidad sin asignar acá queda "sin zona tarifaria" hasta que se cargue — no se
          adivina un cordón.
        </p>

        <form onSubmit={manejarAsignarLocalidad} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TablaFormulario>
              <FilaFormulario label="Localidad" htmlFor="localidad-nueva" anchoEtiqueta="90px">
                <Input
                  id="localidad-nueva"
                  value={localidadNueva}
                  onChange={(e) => setLocalidadNueva(e.target.value)}
                  placeholder="Ej. Lomas de Zamora"
                  disabled={mutacionAsignarLocalidad.isPending}
                />
              </FilaFormulario>
              <FilaFormulario label="Zona" htmlFor="zona-localidad" anchoEtiqueta="90px">
                <Select value={zonaParaLocalidad} onValueChange={setZonaParaLocalidad}>
                  <SelectTrigger id="zona-localidad">
                    <SelectValue placeholder="Elegir zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas?.filter((zona) => zona.activa).map((zona) => (
                      <SelectItem key={zona.id} value={zona.id}>
                        {zona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilaFormulario>
            </TablaFormulario>
          </div>
          <Button type="submit" disabled={mutacionAsignarLocalidad.isPending}>
            Asignar
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Localidad</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoMapeo ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : mapeo?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Todavía no hay localidades asignadas.
                </TableCell>
              </TableRow>
            ) : (
              mapeo?.map((fila) => (
                <TableRow key={fila.id}>
                  <TableCell>{fila.localidad}</TableCell>
                  <TableCell>{fila.zonaTarifaria.nombre}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutacionQuitarLocalidad.isPending}
                      onClick={() => mutacionQuitarLocalidad.mutate(fila.id)}
                    >
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Cordón por partido</h2>
        <p className="text-sm text-muted-foreground">
          El más preciso de los dos mapeos: se prioriza sobre el de localidad. El partido es un límite
          administrativo exacto. "La Matanza" queda afuera a propósito — cruza los 3 Cordones, hace
          falta definirlo por localidad puntual.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partido</TableHead>
              <TableHead>Cordón asignado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargandoPartidos ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : (
              mapeoPartidos?.map((fila) => (
                <TableRow key={fila.partido}>
                  <TableCell>{fila.partido}</TableCell>
                  <TableCell>
                    <Select
                      value={fila.zonaTarifariaId ?? SIN_CORDON}
                      onValueChange={(valor) => {
                        if (valor === SIN_CORDON) {
                          mutacionQuitarPartido.mutate(fila.partido);
                        } else {
                          mutacionAsignarPartido.mutate({ partido: fila.partido, zonaTarifariaId: valor });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_CORDON}>Sin asignar</SelectItem>
                        {zonas?.filter((z) => z.activa).map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NombreFormSheet
        abierto={zonaEnEdicion !== null}
        titulo={zonaEnEdicion === "nuevo" ? "Nueva zona tarifaria" : "Editar zona tarifaria"}
        etiquetaCampo="Nombre"
        nombreInicial={zonaEnEdicion && zonaEnEdicion !== "nuevo" ? zonaEnEdicion.nombre : ""}
        onGuardar={(nombre) => mutacionGuardar.mutateAsync(nombre)}
        onOpenChange={(abierto) => !abierto && setZonaEnEdicion(null)}
      />
    </div>
  );
}
