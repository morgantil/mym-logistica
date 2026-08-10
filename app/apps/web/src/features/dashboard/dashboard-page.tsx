import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EstadoPedido } from "@mym/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { CLASES_TONO, LABELS_ESTADO_PEDIDO } from "@/features/pedidos/estado-labels";
import { obtenerPedidosPorEstado } from "./api";

function TileEstado({ estado, cantidad }: { estado: EstadoPedido; cantidad: number }) {
  const { texto, tono } = LABELS_ESTADO_PEDIDO[estado];
  return (
    <Link
      to={`/pedidos?estado=${estado}`}
      className="flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-medium", CLASES_TONO[tono])}>
        {texto}
      </span>
      <span className="text-3xl font-semibold tabular-nums">{cantidad}</span>
      <span className="text-sm text-muted-foreground">Ver estos pedidos →</span>
    </Link>
  );
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "pedidos-por-estado"],
    queryFn: obtenerPedidosPorEstado,
  });

  const total = data ? Object.values(data).reduce((acc, n) => acc + (n ?? 0), 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Hola, {usuario?.email}</h1>
        <p className="text-sm text-muted-foreground">
          Rol{usuario && usuario.roles.length > 1 ? "es" : ""}: {usuario?.roles.join(", ")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por estado{!isLoading && !isError && ` — ${total} en total`}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudieron cargar los indicadores. Probá de nuevo en unos segundos.
            </p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!isLoading && !isError && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Object.values(EstadoPedido).map((estado) => (
                <TileEstado key={estado} estado={estado} cantidad={data?.[estado] ?? 0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
