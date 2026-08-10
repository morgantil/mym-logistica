import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilaFormulario, TablaFormulario } from "@/components/shell/fila-formulario";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "./auth-context";

function mensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.status === 401) {
    return "El email o la contraseña no son correctos.";
  }
  return "No se pudo iniciar sesión. Probá de nuevo en unos segundos.";
}

export function LoginPage() {
  const { login, urlLoginGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destinoLuegoDeLogin = (location.state as { from?: string } | null)?.from ?? "/";

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
      navigate(destinoLuegoDeLogin, { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MyM Logística</CardTitle>
          <CardDescription>Ingresá con tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarSubmit} className="flex flex-col gap-4" noValidate>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <TablaFormulario>
              <FilaFormulario label="Email" htmlFor="email" anchoEtiqueta="90px">
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                />
              </FilaFormulario>

              <FilaFormulario label="Contraseña" htmlFor="password" anchoEtiqueta="90px">
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={enviando}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrarPassword((v) => !v)}
                    disabled={enviando}
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </FilaFormulario>
            </TablaFormulario>

            <Button type="submit" disabled={enviando} className="mt-2">
              {enviando ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a href={urlLoginGoogle}>Continuar con Google</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
