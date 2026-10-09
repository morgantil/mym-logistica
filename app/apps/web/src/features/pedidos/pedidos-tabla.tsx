import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { EstadoPedido, EstadoSimpliroute, PrioridadPedido, TipoEnvase, TipoServicio } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { listarClientesActivos } from "@/features/clientes/api";
import { listarUsuariosImportadores } from "@/features/importar/api";
import { listarChoferes, listarZonas } from "@/features/zonas-choferes/api";
import {
  actualizarColumnasPedidos,
  actualizarPrioridad,
  eliminarPedido,
  eliminarPedidos,
  exportarPedidos,
  listarLocalidadesPedidos,
  listarPedidos,
  obtenerColumnasPedidos,
} from "./api";
import { BultosCelda } from "./bultos-celda";
import { ComentarioCelda } from "./comentario-celda";
import { OPCIONES_RUTA, RutaCelda } from "./ruta-celda";
import { DetallePedidoSheet } from "./detalle-pedido-sheet";
import { ordenarColumnas } from "./orden-columnas";
import {
  BadgeEstadoPedido,
  BadgeEstadoSimpliroute,
  BadgeEstadoValidacion,
  BadgePrioridad,
  CLASE_FILA_PRIORIDAD,
  estadoBorrable,
  LABEL_ESTADO_PEDIDO,
  LABEL_ESTADO_SIMPLIROUTE,
  LABEL_PRIORIDAD,
} from "./estado-labels";
import type { CampoOrdenPedido, PedidoListado } from "./tipos";

// Locales a este archivo — mismo criterio que ya usa Facturación (tarifa-form-
// sheet.tsx) para estas mismas dos etiquetas, sin armar un archivo compartido
// para dos strings.
const LABEL_TIPO_SERVICIO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

const LABEL_TIPO_ENVASE: Record<TipoEnvase, string> = {
  [TipoEnvase.BOLSA]: "Bolsa",
  [TipoEnvase.BULTO]: "Bulto",
};

const SENTINEL_TODOS = "TODOS";

const POR_PAGINA = 20;
const DEBOUNCE_BUSQUEDA_MS = 400;

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

// Fecha de subida sí tiene hora real (a diferencia de "Fecha", que es la
// entrega elegida a mano antes de importar, sin componente de hora) — se
// muestra en horario de Argentina, no UTC, porque acá sí importa "a qué hora
// de mi día se subió esto".
const formateadorFechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

// Todas las columnas personalizables, en su orden por defecto — "Acciones" no
// entra acá, siempre va última y no se puede sacar ni mover (ver más abajo).
const IDS_COLUMNAS_DEFAULT = [
  "cliente",
  "estado",
  "prioridad",
  "numero",
  "remito",
  "receta",
  "tipoPedido",
  "retiroDeReceta",
  "tiempoDeEntrega",
  "horarioEntrega",
  "afiliado",
  "destinatario",
  "telefono",
  "direccion",
  "localidad",
  "fecha",
  "fechaSubida",
  "productos",
  "bultos",
  "zona",
  "chofer",
  "validacion",
  "simpliroute",
  "observaciones",
  "comentario",
  "ruta",
  "importadoPor",
] as const;

const LABEL_COLUMNA: Record<(typeof IDS_COLUMNAS_DEFAULT)[number], string> = {
  cliente: "Cliente",
  estado: "Estado",
  prioridad: "Prioridad",
  numero: "Nº Pedido",
  remito: "Remito",
  receta: "Receta",
  tipoPedido: "Tipo de pedido",
  retiroDeReceta: "Retiro de receta",
  tiempoDeEntrega: "Tiempo de entrega",
  horarioEntrega: "Horario de entrega",
  afiliado: "Nº afiliado",
  destinatario: "Destinatario",
  telefono: "Teléfono",
  direccion: "Dirección",
  localidad: "Localidad",
  fecha: "Fecha",
  fechaSubida: "Fecha de subida",
  productos: "Productos",
  bultos: "Bultos",
  zona: "Zona",
  chofer: "Chofer",
  validacion: "Validación",
  simpliroute: "SimpliRoute",
  observaciones: "Observaciones",
  comentario: "Comentarios",
  ruta: "Ruta",
  importadoPor: "Importado por",
};

// "productos" es un cálculo agregado (suma de varios renglones), no una
// columna guardada — ordenar por eso necesitaría un query aparte, no se
// implementó (ver CampoOrdenPedido). Todas las demás sí son ordenables.
const NO_ORDENABLES = new Set<(typeof IDS_COLUMNAS_DEFAULT)[number]>(["productos", "importadoPor"]);

export function PedidosTabla() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const puedeEditarBultos = Boolean(
    usuario?.roles.some((rol) => rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );
  // Comentario: cualquiera de los roles que opera pedidos día a día, no solo
  // Logística — decisión 2026-10-04.
  const puedeEditarComentario = Boolean(
    usuario?.roles.some((rol) => rol === "OPERACIONES" || rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );
  // Ruta: mismos roles que comentario — decisión 2026-10-04.
  const puedeEditarRuta = Boolean(
    usuario?.roles.some((rol) => rol === "OPERACIONES" || rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );
  // Borrado lógico — decisión 2026-09-11, ver validar-eliminacion.ts (solo
  // pedidos que todavía no se mandaron a SimpliRoute).
  const puedeEliminar = Boolean(
    usuario?.roles.some((rol) => rol === "OPERACIONES" || rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );

  const [pagina, setPagina] = useState(1);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoListado | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  function alternarSeleccion(pedidoId: string) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(pedidoId)) nuevo.delete(pedidoId);
      else nuevo.add(pedidoId);
      return nuevo;
    });
  }

  // El filtro de estado vive en la URL (?estado=...) para que el Dashboard
  // pueda linkear directo a "Pedidos filtrados por X" — no solo mostrar un
  // número, sino llevar a la lista real detrás de ese número.
  const [searchParams, setSearchParams] = useSearchParams();
  const estadoParam = searchParams.get("estado");
  const estado: EstadoPedido | "TODOS" =
    estadoParam && (Object.values(EstadoPedido) as string[]).includes(estadoParam)
      ? (estadoParam as EstadoPedido)
      : "TODOS";

  function cambiarEstado(valor: EstadoPedido | "TODOS") {
    // Merge, no reemplazo: no pisar otros params de la URL (ej. ?vista=... de
    // PedidosPage) que no tienen nada que ver con este filtro.
    setSearchParams((actual) => {
      const siguiente = new URLSearchParams(actual);
      if (valor === "TODOS") siguiente.delete("estado");
      else siguiente.set("estado", valor);
      return siguiente;
    });
    setPagina(1);
  }

  // Resto de filtros — decisión 2026-09-01, "mayor/menor" + búsqueda libre.
  // No viven en la URL a propósito: son de uso puntual mientras se busca algo,
  // no un link que tenga sentido compartir (a diferencia de ?estado=...).
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [bultosDesde, setBultosDesde] = useState("");
  const [bultosHasta, setBultosHasta] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Filtros combinables agregados 2026-09-16 (pedido de Leonardo — "que sea
  // combinatorio por la mayoría de variables que podamos tener"), agrupados
  // en un panel "Filtros avanzados" desplegable para no saturar la barra
  // principal. Mismo criterio que el resto: viven en estado local, no en la URL.
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false);
  const [clienteId, setClienteId] = useState(SENTINEL_TODOS);
  const [tipoServicio, setTipoServicio] = useState(SENTINEL_TODOS);
  const [zonaId, setZonaId] = useState(SENTINEL_TODOS);
  const [choferId, setChoferId] = useState(SENTINEL_TODOS);
  const [tipoEnvase, setTipoEnvase] = useState(SENTINEL_TODOS);
  const [estadoSimpliroute, setEstadoSimpliroute] = useState(SENTINEL_TODOS);
  const [prioridad, setPrioridad] = useState(SENTINEL_TODOS);
  const [localidad, setLocalidad] = useState(SENTINEL_TODOS);
  const [ruta, setRuta] = useState(SENTINEL_TODOS);
  const [sinEtiquetaImpresa, setSinEtiquetaImpresa] = useState(false);
  const [usuarioImportadorId, setUsuarioImportadorId] = useState(SENTINEL_TODOS);

  const { data: clientesDisponibles = [] } = useQuery({
    queryKey: ["clientes", "activos"],
    queryFn: listarClientesActivos,
  });
  const { data: zonasDisponibles = [] } = useQuery({ queryKey: ["zonas"], queryFn: listarZonas });
  const { data: choferesDisponibles = [] } = useQuery({ queryKey: ["choferes"], queryFn: listarChoferes });
  const { data: localidadesDisponibles = [] } = useQuery({
    queryKey: ["pedidos", "localidades"],
    queryFn: listarLocalidadesPedidos,
  });
  const { data: usuariosImportadoresDisponibles = [] } = useQuery({
    queryKey: ["importaciones", "usuarios"],
    queryFn: listarUsuariosImportadores,
  });

  // Orden de la grilla — decisión 2026-09-01. Un solo campo a la vez (no
  // orden múltiple): alcanza para el caso de uso y evita una UI más compleja
  // de "prioridad de columnas".
  const [orden, setOrden] = useState<{ campo: CampoOrdenPedido; direccion: "asc" | "desc" } | null>(null);

  function alternarOrden(id: string) {
    if (NO_ORDENABLES.has(id as (typeof IDS_COLUMNAS_DEFAULT)[number])) return;
    const campo = id as CampoOrdenPedido;
    setOrden((actual) => {
      if (!actual || actual.campo !== campo) return { campo, direccion: "asc" };
      if (actual.direccion === "asc") return { campo, direccion: "desc" };
      return null; // tercer click: vuelve al orden por defecto
    });
    setPagina(1);
  }

  useEffect(() => {
    const temporizador = setTimeout(() => setBusqueda(busquedaInput.trim()), DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [busquedaInput]);

  useEffect(() => {
    setPagina(1);
  }, [
    fechaDesde,
    fechaHasta,
    bultosDesde,
    bultosHasta,
    busqueda,
    clienteId,
    tipoServicio,
    zonaId,
    choferId,
    tipoEnvase,
    estadoSimpliroute,
    prioridad,
    localidad,
    ruta,
    sinEtiquetaImpresa,
    usuarioImportadorId,
  ]);

  // Factoreado para que "Exportar a Excel" nunca pueda quedar desalineado de
  // los filtros que se ven en la grilla — decisión 2026-10-04.
  const filtrosActivos = {
    estado: estado === "TODOS" ? undefined : estado,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    bultosDesde: bultosDesde ? Number(bultosDesde) : undefined,
    bultosHasta: bultosHasta ? Number(bultosHasta) : undefined,
    busqueda: busqueda || undefined,
    clienteId: clienteId === SENTINEL_TODOS ? undefined : clienteId,
    tipoServicio: tipoServicio === SENTINEL_TODOS ? undefined : (tipoServicio as TipoServicio),
    zonaId: zonaId === SENTINEL_TODOS ? undefined : zonaId,
    choferId: choferId === SENTINEL_TODOS ? undefined : choferId,
    tipoEnvase: tipoEnvase === SENTINEL_TODOS ? undefined : (tipoEnvase as TipoEnvase),
    estadoSimpliroute: estadoSimpliroute === SENTINEL_TODOS ? undefined : (estadoSimpliroute as EstadoSimpliroute),
    prioridad: prioridad === SENTINEL_TODOS ? undefined : (prioridad as PrioridadPedido),
    localidad: localidad === SENTINEL_TODOS ? undefined : localidad,
    ruta: ruta === SENTINEL_TODOS ? undefined : ruta,
    sinEtiquetaImpresa: sinEtiquetaImpresa || undefined,
    usuarioImportadorId: usuarioImportadorId === SENTINEL_TODOS ? undefined : usuarioImportadorId,
    ordenarPor: orden?.campo,
    direccionOrden: orden?.direccion,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "pedidos",
      "listado",
      {
        pagina,
        porPagina: POR_PAGINA,
        estado,
        fechaDesde,
        fechaHasta,
        bultosDesde,
        bultosHasta,
        busqueda,
        orden,
        clienteId,
        tipoServicio,
        zonaId,
        choferId,
        tipoEnvase,
        estadoSimpliroute,
        prioridad,
        localidad,
        ruta,
        sinEtiquetaImpresa,
        usuarioImportadorId,
      },
    ],
    queryFn: () => listarPedidos({ pagina, porPagina: POR_PAGINA, ...filtrosActivos }),
    placeholderData: (data) => data,
  });

  const mutacionExportar = useMutation({
    mutationFn: () => exportarPedidos(filtrosActivos),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `pedidos-${new Date().toISOString().slice(0, 10)}.xlsx`;
      enlace.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("No se pudo exportar. Probá de nuevo en unos segundos."),
  });

  // Personalización de columnas (por usuario, decisión 2026-09-01): fijas
  // primero en el orden en que se marcaron, el resto sigue en su orden por
  // defecto — sin drag-and-drop, alcanza con elegir cuáles importan más.
  const { data: columnasFijas = [] } = useQuery({
    queryKey: ["pedidos", "columnas-fijas"],
    queryFn: obtenerColumnasPedidos,
  });

  const mutacionColumnas = useMutation({
    mutationFn: actualizarColumnasPedidos,
    onSuccess: (columnas) => {
      queryClient.setQueryData(["pedidos", "columnas-fijas"], columnas);
    },
  });

  function alternarColumnaFija(id: string) {
    const siguiente = columnasFijas.includes(id)
      ? columnasFijas.filter((c) => c !== id)
      : [...columnasFijas, id];
    mutacionColumnas.mutate(siguiente);
  }

  const mutacionEliminarUno = useMutation({
    mutationFn: eliminarPedido,
    onSuccess: () => {
      toast.success("Pedido borrado.");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => toast.error("No se pudo borrar — ¿ya se envió a SimpliRoute?"),
  });

  const mutacionEliminarVarios = useMutation({
    mutationFn: eliminarPedidos,
    onSuccess: (resultado) => {
      if (resultado.eliminados.length > 0) {
        toast.success(`${resultado.eliminados.length} pedido(s) borrado(s).`);
      }
      if (resultado.errores.length > 0) {
        toast.error(`${resultado.errores.length} pedido(s) no se pudieron borrar (¿ya enviados?).`);
      }
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => toast.error("No se pudo borrar. Probá de nuevo en unos segundos."),
  });

  const mutacionPrioridad = useMutation({
    mutationFn: ({ ids, prioridad }: { ids: string[]; prioridad: PrioridadPedido }) =>
      actualizarPrioridad(ids, prioridad),
    onSuccess: ({ actualizados }, { prioridad }) => {
      toast.success(`${actualizados} pedido(s) marcado(s) como ${LABEL_PRIORIDAD[prioridad].toLowerCase()}.`);
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => toast.error("No se pudo cambiar la prioridad. Probá de nuevo en unos segundos."),
  });

  const definicionesColumna: Record<(typeof IDS_COLUMNAS_DEFAULT)[number], LegacyColumnDef<PedidoListado>> = useMemo(
    () => ({
      cliente: { id: "cliente", header: "Cliente", cell: ({ row }) => row.original.clienteNombre },
      estado: {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <BadgeEstadoPedido estado={row.original.estado} />,
      },
      prioridad: {
        id: "prioridad",
        header: "Prioridad",
        cell: ({ row }) =>
          puedeEliminar ? (
            <Select
              value={row.original.prioridad}
              onValueChange={(valor) =>
                mutacionPrioridad.mutate({ ids: [row.original.id], prioridad: valor as PrioridadPedido })
              }
              disabled={mutacionPrioridad.isPending}
            >
              <SelectTrigger
                size="sm"
                className="h-7 w-28 border-none bg-transparent px-1 shadow-none"
                aria-label={`Prioridad del pedido de ${row.original.destinatarioNombre}`}
              >
                <BadgePrioridad prioridad={row.original.prioridad} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PrioridadPedido).map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {LABEL_PRIORIDAD[valor]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <BadgePrioridad prioridad={row.original.prioridad} />
          ),
      },
      numero: { id: "numero", header: "Nº Pedido", cell: ({ row }) => row.original.numero },
      remito: { id: "remito", header: "Remito", cell: ({ row }) => row.original.remito ?? "—" },
      receta: {
        id: "receta",
        header: "Receta",
        cell: ({ row }) => row.original.recetaResuelta ?? row.original.receta ?? "—",
      },
      tipoPedido: { id: "tipoPedido", header: "Tipo de pedido", cell: ({ row }) => row.original.tipoPedido ?? "—" },
      retiroDeReceta: {
        id: "retiroDeReceta",
        header: "Retiro de receta",
        cell: ({ row }) => row.original.retiroDeReceta ?? "—",
      },
      horarioEntrega: {
        id: "horarioEntrega",
        header: "Horario de entrega",
        cell: ({ row }) => row.original.horarioEntrega ?? "—",
      },
      tiempoDeEntrega: {
        id: "tiempoDeEntrega",
        header: "Tiempo de entrega",
        cell: ({ row }) => row.original.tiempoDeEntrega ?? "—",
      },
      afiliado: { id: "afiliado", header: "Nº afiliado", cell: ({ row }) => row.original.numeroAfiliado },
      destinatario: {
        id: "destinatario",
        header: "Destinatario",
        cell: ({ row }) => row.original.destinatarioNombre,
      },
      telefono: {
        id: "telefono",
        header: "Teléfono",
        cell: ({ row }) => row.original.destinatarioTelefono ?? "—",
      },
      direccion: { id: "direccion", header: "Dirección", cell: ({ row }) => row.original.direccionUsada },
      localidad: { id: "localidad", header: "Localidad", cell: ({ row }) => row.original.localidad },
      fecha: {
        id: "fecha",
        header: "Fecha",
        cell: ({ row }) => formateadorFecha.format(new Date(row.original.fechaProgramada)),
      },
      fechaSubida: {
        id: "fechaSubida",
        header: "Fecha de subida",
        cell: ({ row }) => formateadorFechaHora.format(new Date(row.original.creadoEn)),
      },
      productos: {
        id: "productos",
        header: "Productos",
        cell: ({ row }) => {
          const total = row.original.productos.reduce((acc, p) => acc + p.cantidad, 0);
          return `${total} u. (${row.original.productos.length} prod.)`;
        },
      },
      bultos: {
        id: "bultos",
        header: "Bultos",
        cell: ({ row }) => <BultosCelda pedido={row.original} puedeEditar={puedeEditarBultos} />,
      },
      zona: { id: "zona", header: "Zona", cell: ({ row }) => row.original.zonaNombre ?? "—" },
      chofer: { id: "chofer", header: "Chofer", cell: ({ row }) => row.original.choferNombre ?? "—" },
      validacion: {
        id: "validacion",
        header: "Validación",
        cell: ({ row }) => <BadgeEstadoValidacion estado={row.original.estadoValidacion} />,
      },
      simpliroute: {
        id: "simpliroute",
        header: "SimpliRoute",
        cell: ({ row }) => <BadgeEstadoSimpliroute estado={row.original.estadoSimpliroute} />,
      },
      observaciones: {
        id: "observaciones",
        header: "Observaciones",
        cell: ({ row }) => row.original.observaciones ?? "—",
      },
      comentario: {
        id: "comentario",
        header: "Comentarios",
        cell: ({ row }) => <ComentarioCelda pedido={row.original} puedeEditar={puedeEditarComentario} />,
      },
      ruta: {
        id: "ruta",
        header: "Ruta",
        cell: ({ row }) => <RutaCelda pedido={row.original} puedeEditar={puedeEditarRuta} />,
      },
      importadoPor: {
        id: "importadoPor",
        header: "Importado por",
        cell: ({ row }) => row.original.importadoPorNombre ?? "—",
      },
    }),
    [puedeEditarBultos, puedeEditarComentario, puedeEditarRuta, puedeEliminar, mutacionPrioridad],
  );

  const columnas = useMemo<LegacyColumnDef<PedidoListado>[]>(() => {
    const orden = ordenarColumnas([...IDS_COLUMNAS_DEFAULT], columnasFijas);
    const columnaSeleccion: LegacyColumnDef<PedidoListado> = {
      id: "seleccion",
      // Marcar todos: tilda/destilda todos los pedidos de la página que se está
      // viendo (la selección se conserva al cambiar de página).
      header: () => {
        const idsPagina = (data?.datos ?? []).map((pedido) => pedido.id);
        const todosMarcados = idsPagina.length > 0 && idsPagina.every((id) => seleccionados.has(id));
        return (
          <Checkbox
            checked={todosMarcados}
            onCheckedChange={() =>
              setSeleccionados((actual) => {
                const nuevo = new Set(actual);
                for (const id of idsPagina) {
                  if (todosMarcados) nuevo.delete(id);
                  else nuevo.add(id);
                }
                return nuevo;
              })
            }
            disabled={!puedeEliminar || idsPagina.length === 0}
            aria-label="Seleccionar todos los pedidos de esta página"
          />
        );
      },
      cell: ({ row }) => {
        return (
          <Checkbox
            checked={seleccionados.has(row.original.id)}
            onCheckedChange={() => alternarSeleccion(row.original.id)}
            disabled={!puedeEliminar}
            aria-label={`Seleccionar pedido de ${row.original.destinatarioNombre}`}
          />
        );
      },
    };
    return [
      ...(puedeEliminar ? [columnaSeleccion] : []),
      ...orden.map((id) => definicionesColumna[id as (typeof IDS_COLUMNAS_DEFAULT)[number]]),
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setPedidoSeleccionado(row.original)}>
              Ver detalle
            </Button>
            {puedeEliminar && estadoBorrable(row.original.estadoSimpliroute) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Borrar pedido"
                aria-label={`Borrar pedido de ${row.original.destinatarioNombre}`}
                disabled={mutacionEliminarUno.isPending}
                onClick={() => {
                  if (window.confirm(`¿Borrar el pedido de ${row.original.destinatarioNombre}?`)) {
                    mutacionEliminarUno.mutate(row.original.id);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [columnasFijas, definicionesColumna, puedeEliminar, seleccionados, mutacionEliminarUno, data]);

  const tabla = useLegacyTable({
    data: data?.datos ?? [],
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
  });

  // Los seleccionados que todavía se pueden borrar (no enviados a SimpliRoute) —
  // seleccionar sirve tanto para marcar prioridad (cualquier pedido) como para borrar.
  const idsBorrablesSeleccionados = (data?.datos ?? [])
    .filter((pedido) => seleccionados.has(pedido.id) && estadoBorrable(pedido.estadoSimpliroute))
    .map((pedido) => pedido.id);

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <Label htmlFor="busqueda-pedidos" className="text-xs text-muted-foreground">
              Buscar
            </Label>
            <Input
              id="busqueda-pedidos"
              placeholder="Destinatario, dirección o Nº de afiliado…"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={estado} onValueChange={(valor) => cambiarEstado(valor as EstadoPedido | "TODOS")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {Object.values(EstadoPedido).map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {LABEL_ESTADO_PEDIDO[valor]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha-desde-pedidos" className="text-xs text-muted-foreground">
              Fecha desde
            </Label>
            <Input
              id="fecha-desde-pedidos"
              type="date"
              className="w-40"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha-hasta-pedidos" className="text-xs text-muted-foreground">
              Fecha hasta
            </Label>
            <Input
              id="fecha-hasta-pedidos"
              type="date"
              className="w-40"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="bultos-desde-pedidos" className="text-xs text-muted-foreground">
              Bultos desde
            </Label>
            <Input
              id="bultos-desde-pedidos"
              type="number"
              min={0}
              className="w-24"
              value={bultosDesde}
              onChange={(e) => setBultosDesde(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bultos-hasta-pedidos" className="text-xs text-muted-foreground">
              Bultos hasta
            </Label>
            <Input
              id="bultos-hasta-pedidos"
              type="number"
              min={0}
              className="w-24"
              value={bultosHasta}
              onChange={(e) => setBultosHasta(e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setMostrarAvanzados((actual) => !actual)}
            aria-expanded={mostrarAvanzados}
          >
            <SlidersHorizontal className="size-4" />
            Filtros avanzados
            {mostrarAvanzados ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <SlidersHorizontal className="size-4" />
                Personalizar columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Fijar a la izquierda</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {IDS_COLUMNAS_DEFAULT.map((id) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={columnasFijas.includes(id)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => alternarColumnaFija(id)}
                >
                  {LABEL_COLUMNA[id]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {mostrarAvanzados && (
          <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {clientesDisponibles.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Tipo de servicio</Label>
              <Select value={tipoServicio} onValueChange={setTipoServicio}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {Object.values(TipoServicio).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {LABEL_TIPO_SERVICIO[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Zona</Label>
              <Select value={zonaId} onValueChange={setZonaId}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todas</SelectItem>
                  {zonasDisponibles.map((zona) => (
                    <SelectItem key={zona.id} value={String(zona.id)}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Chofer</Label>
              <Select value={choferId} onValueChange={setChoferId}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {choferesDisponibles.map((chofer) => (
                    <SelectItem key={chofer.id} value={String(chofer.id)}>
                      {chofer.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Bolsa/Bulto</Label>
              <Select value={tipoEnvase} onValueChange={setTipoEnvase}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {Object.values(TipoEnvase).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {LABEL_TIPO_ENVASE[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Prioridad</Label>
              <Select value={prioridad} onValueChange={setPrioridad}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todas</SelectItem>
                  {Object.values(PrioridadPedido).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {LABEL_PRIORIDAD[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Estado SimpliRoute</Label>
              <Select value={estadoSimpliroute} onValueChange={setEstadoSimpliroute}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {Object.values(EstadoSimpliroute).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {LABEL_ESTADO_SIMPLIROUTE[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Localidad</Label>
              <Select value={localidad} onValueChange={setLocalidad}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value={SENTINEL_TODOS}>Todas</SelectItem>
                  {localidadesDisponibles.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Ruta</Label>
              <Select value={ruta} onValueChange={setRuta}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todas</SelectItem>
                  {OPCIONES_RUTA.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Importado por</Label>
              <Select value={usuarioImportadorId} onValueChange={setUsuarioImportadorId}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINEL_TODOS}>Todos</SelectItem>
                  {usuariosImportadoresDisponibles.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="sin-etiqueta-impresa"
                checked={sinEtiquetaImpresa}
                onCheckedChange={(valor) => setSinEtiquetaImpresa(valor === true)}
              />
              <Label htmlFor="sin-etiqueta-impresa" className="text-sm">
                Sin etiqueta impresa
              </Label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{total} pedido{total === 1 ? "" : "s"}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={mutacionExportar.isPending}
              onClick={() => mutacionExportar.mutate()}
            >
              {mutacionExportar.isPending ? "Exportando…" : "Exportar a Excel"}
            </Button>
          </div>
          {puedeEliminar && seleccionados.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value=""
                onValueChange={(valor) =>
                  mutacionPrioridad.mutate({ ids: Array.from(seleccionados), prioridad: valor as PrioridadPedido })
                }
                disabled={mutacionPrioridad.isPending}
              >
                <SelectTrigger size="sm" className="w-48" aria-label="Marcar seleccionados como">
                  <SelectValue placeholder={`Marcar (${seleccionados.size}) como…`} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PrioridadPedido).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {LABEL_PRIORIDAD[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {idsBorrablesSeleccionados.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={mutacionEliminarVarios.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Borrar ${idsBorrablesSeleccionados.length} pedido(s)? Solo se borran los que todavía no llegaron a SimpliRoute.`,
                      )
                    ) {
                      mutacionEliminarVarios.mutate(idsBorrablesSeleccionados);
                    }
                  }}
                >
                  {mutacionEliminarVarios.isPending
                    ? "Borrando…"
                    : `Borrar seleccionados (${idsBorrablesSeleccionados.length})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los pedidos. Probá de nuevo en unos segundos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {tabla.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const ordenable =
                      header.id !== "acciones" &&
                      header.id !== "seleccion" &&
                      !NO_ORDENABLES.has(header.id as (typeof IDS_COLUMNAS_DEFAULT)[number]);
                    const activo = orden?.campo === header.id;
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : ordenable ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => alternarOrden(header.id)}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {activo ? (
                              orden!.direccion === "asc" ? (
                                <ArrowUp className="size-3.5" />
                              ) : (
                                <ArrowDown className="size-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-30" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columnas.length} className="text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : data?.datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnas.length} className="text-muted-foreground">
                    No hay pedidos para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                tabla.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      // SimpliRoute no tuvo confianza geolocalizando la
                      // dirección del Excel al enviar este pedido — riesgo
                      // real de mandar al chofer a un lugar equivocado.
                      CLASE_FILA_PRIORIDAD[row.original.prioridad] ??
                      (row.original.geocodeAlert && row.original.geocodeAlert !== "no alert"
                        ? "bg-amber-50 dark:bg-amber-500/10"
                        : undefined)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={pagina <= 1}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {pagina} de {totalPaginas}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={pagina >= totalPaginas}
          onClick={() => setPagina((p) => p + 1)}
        >
          Siguiente
        </Button>
      </div>

      <DetallePedidoSheet
        pedido={pedidoSeleccionado}
        onOpenChange={(abierto) => !abierto && setPedidoSeleccionado(null)}
      />
    </div>
  );
}
