import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { EstadoPedido } from "@mym/shared-types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { listarPedidos } from "./api";
import { BultosCelda } from "./bultos-celda";
import { DetallePedidoSheet } from "./detalle-pedido-sheet";
import { BadgeEstadoPedido, BadgeEstadoSimpliroute, BadgeEstadoValidacion, LABEL_ESTADO_PEDIDO } from "./estado-labels";
import type { PedidoListado } from "./tipos";

const POR_PAGINA = 20;

const formateadorFecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function PedidosTabla() {
  const { usuario } = useAuth();
  const puedeEditarBultos = Boolean(
    usuario?.roles.some((rol) => rol === "LOGISTICA" || rol === "ADMINISTRACION"),
  );

  const [pagina, setPagina] = useState(1);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoListado | null>(null);

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pedidos", "listado", { pagina, porPagina: POR_PAGINA, estado }],
    queryFn: () =>
      listarPedidos({
        pagina,
        porPagina: POR_PAGINA,
        estado: estado === "TODOS" ? undefined : estado,
      }),
    placeholderData: (data) => data,
  });

  const columnas = useMemo<LegacyColumnDef<PedidoListado>[]>(
    () => [
      { id: "cliente", header: "Cliente", cell: ({ row }) => row.original.clienteNombre },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <BadgeEstadoPedido estado={row.original.estado} />,
      },
      { id: "afiliado", header: "Nº afiliado", cell: ({ row }) => row.original.numeroAfiliado },
      { id: "destinatario", header: "Destinatario", cell: ({ row }) => row.original.destinatarioNombre },
      { id: "direccion", header: "Dirección", cell: ({ row }) => row.original.direccionUsada },
      { id: "localidad", header: "Localidad", cell: ({ row }) => row.original.localidad },
      {
        id: "fecha",
        header: "Fecha",
        cell: ({ row }) => formateadorFecha.format(new Date(row.original.fechaProgramada)),
      },
      {
        id: "productos",
        header: "Productos",
        cell: ({ row }) => {
          const total = row.original.productos.reduce((acc, p) => acc + p.cantidad, 0);
          return `${total} u. (${row.original.productos.length} prod.)`;
        },
      },
      {
        id: "bultos",
        header: "Bultos",
        cell: ({ row }) => <BultosCelda pedido={row.original} puedeEditar={puedeEditarBultos} />,
      },
      { id: "zona", header: "Zona", cell: ({ row }) => row.original.zonaNombre ?? "—" },
      { id: "chofer", header: "Chofer", cell: ({ row }) => row.original.choferNombre ?? "—" },
      {
        id: "validacion",
        header: "Validación",
        cell: ({ row }) => <BadgeEstadoValidacion estado={row.original.estadoValidacion} />,
      },
      {
        id: "simpliroute",
        header: "SimpliRoute",
        cell: ({ row }) => <BadgeEstadoSimpliroute estado={row.original.estadoSimpliroute} />,
      },
      {
        id: "observaciones",
        header: "Observaciones",
        cell: ({ row }) => row.original.observaciones ?? "—",
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button type="button" variant="outline" size="sm" onClick={() => setPedidoSeleccionado(row.original)}>
            Ver detalle
          </Button>
        ),
      },
    ],
    [puedeEditarBultos],
  );

  const tabla = useLegacyTable({
    data: data?.datos ?? [],
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Estado:</span>
          <Select
            value={estado}
            onValueChange={(valor) => cambiarEstado(valor as EstadoPedido | "TODOS")}
          >
            <SelectTrigger className="w-48">
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
        <p className="text-sm text-muted-foreground">{total} pedido{total === 1 ? "" : "s"}</p>
      </div>

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los pedidos. Probá de nuevo en unos segundos.
        </p>
      ) : (
        <Table>
          <TableHeader>
            {tabla.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
