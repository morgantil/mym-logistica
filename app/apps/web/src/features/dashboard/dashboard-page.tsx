import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";

export function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Hola, {usuario?.email}</h1>
        <p className="text-sm text-muted-foreground">
          Rol{usuario && usuario.roles.length > 1 ? "es" : ""}: {usuario?.roles.join(", ")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesión iniciada correctamente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          El resto del dashboard (pedidos por estado y demás KPIs) se conecta en la
          próxima etapa — el endpoint del backend ya existe.
        </CardContent>
      </Card>
    </div>
  );
}
