import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EstadoPedido } from "@mym/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { CLASES_TONO, LABELS_ESTADO_PEDIDO } from "@/features/pedidos/estado-labels";
import { obtenerPedidosPorEstado, obtenerRevisionResumen } from "./api";

function Tile({
  href,
  texto,
  tono,
  cantidad,
  detalle,
}: {
  href: string;
  texto: string;
  tono: keyof typeof CLASES_TONO;
  cantidad: number;
  detalle: string;
}) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-medium", CLASES_TONO[tono])}>
        {texto}
      </span>
      <span className="text-3xl font-semibold tabular-nums">{cantidad}</span>
      <span className="text-sm text-muted-foreground">{detalle}</span>
    </Link>
  );
}

export function DashboardPage() {
  const { usuario } = useAuth();

  const pedidosPorEstado = useQuery({
    queryKey: ["dashboard", "pedidos-por-estado"],
    queryFn: obtenerPedidosPorEstado,
  });

  const revisionResumen = useQuery({
    queryKey: ["dashboard", "revision-resumen"],
    queryFn: obtenerRevisionResumen,
  });

  const total = pedidosPorEstado.data
    ? Object.values(pedidosPorEstado.data).reduce((acc, n) => acc + (n ?? 0), 0)
    : 0;

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
          <CardTitle>
            Pedidos por estado
            {!pedidosPorEstado.isLoading && !pedidosPorEstado.isError && ` — ${total} en total`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidosPorEstado.isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudieron cargar los indicadores. Probá de nuevo en unos segundos.
            </p>
          )}
          {pedidosPorEstado.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!pedidosPorEstado.isLoading && !pedidosPorEstado.isError && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Object.values(EstadoPedido).map((estado) => {
                const { texto, tono } = LABELS_ESTADO_PEDIDO[estado];
                return (
                  <Tile
                    key={estado}
                    href={`/pedidos?estado=${estado}`}
                    texto={texto}
                    tono={tono}
                    cantidad={pedidosPorEstado.data?.[estado] ?? 0}
                    detalle="Ver estos pedidos →"
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revisión antes de enviar</CardTitle>
        </CardHeader>
        <CardContent>
          {revisionResumen.isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudo cargar el resumen. Probá de nuevo en unos segundos.
            </p>
          )}
          {revisionResumen.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!revisionResumen.isLoading && !revisionResumen.isError && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <Tile
                href="/pedidos?vista=revision"
                texto="Listos para enviar"
                tono="verde"
                cantidad={revisionResumen.data?.listos ?? 0}
                detalle="Ir a Revisión →"
              />
              <Tile
                href="/pedidos?vista=revision"
                texto="Con motivos bloqueantes"
                tono="gris"
                cantidad={revisionResumen.data?.bloqueados ?? 0}
                detalle="Ir a Revisión →"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
