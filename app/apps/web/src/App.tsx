import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/shell/app-shell";
import { ProtectedRoute } from "@/components/shell/protected-route";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { GoogleCallbackPage } from "@/features/auth/google-callback-page";
import { LoginPage } from "@/features/auth/login-page";
import { ImportarPage } from "@/features/importar/importar-page";
import { ClientesPage } from "@/features/clientes/clientes-page";
import { ZonasChoferesPage } from "@/features/zonas-choferes/zonas-choferes-page";
import { PedidosPage } from "@/features/pedidos/pedidos-page";
import { FacturacionPage } from "@/features/facturacion/facturacion-page";
import { EmbalajeDespachoPage } from "@/features/embalaje-despacho/embalaje-despacho-page";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/importar" element={<ImportarPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/zonas-choferes" element={<ZonasChoferesPage />} />
          <Route path="/embalaje-despacho" element={<EmbalajeDespachoPage />} />
          <Route path="/facturacion" element={<FacturacionPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
