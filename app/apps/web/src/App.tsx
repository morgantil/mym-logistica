import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/shell/app-shell";
import { ProtectedRoute } from "@/components/shell/protected-route";
import { ProximamentePage } from "@/components/shell/proximamente-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { GoogleCallbackPage } from "@/features/auth/google-callback-page";
import { LoginPage } from "@/features/auth/login-page";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pedidos" element={<ProximamentePage titulo="Pedidos" />} />
          <Route path="/importar" element={<ProximamentePage titulo="Importar Excel" />} />
          <Route path="/clientes" element={<ProximamentePage titulo="Clientes" />} />
          <Route
            path="/zonas-choferes"
            element={<ProximamentePage titulo="Zonas y choferes" />}
          />
          <Route path="/facturacion" element={<ProximamentePage titulo="Facturación" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
