import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth-context";

export function GoogleCallbackPage() {
  const { completarLoginGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const yaProcesado = useRef(false);

  useEffect(() => {
    if (yaProcesado.current) return;
    yaProcesado.current = true;

    const parametros = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = parametros.get("accessToken");

    if (!accessToken) {
      setError("Google no devolvió una sesión válida.");
      return;
    }

    completarLoginGoogle(accessToken)
      .then(() => navigate("/", { replace: true }))
      .catch(() => setError("No se pudo completar el inicio de sesión con Google."));
  }, [completarLoginGoogle, navigate]);

  return (
    <div className="flex min-h-svh items-center justify-center px-4 text-center">
      {error ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-sm underline underline-offset-4">
            Volver a intentar
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Iniciando sesión…</p>
      )}
    </div>
  );
}
