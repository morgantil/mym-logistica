import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, refrescarAccessToken, registrarHandlerSesionExpirada, setAccessToken } from "@/lib/api-client";
import type { UsuarioAutenticado } from "./tipos";

interface AuthContextValor {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | null>(null);

async function cargarPerfil(): Promise<UsuarioAutenticado> {
  const { data } = await apiClient.get<UsuarioAutenticado>("/auth/perfil");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesionLocal = useCallback(() => {
    setAccessToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    registrarHandlerSesionExpirada(cerrarSesionLocal);
  }, [cerrarSesionLocal]);

  // Al arrancar la app: intento silencioso de restaurar sesión con la cookie
  // httpOnly del refresh token, sin pedirle a nadie que se loguee de nuevo si
  // todavía es válida. Usa la MISMA promesa compartida que el interceptor de
  // 401 (refrescarAccessToken en api-client.ts) — si este efecto corre dos
  // veces (React StrictMode en dev, o dos pestañas compartiendo la cookie),
  // ambas llamadas esperan un solo POST /auth/refresh real en vez de rotar el
  // token dos veces y que la segunda tire 401 y cierre una sesión que en
  // realidad sí era válida.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const nuevoToken = await refrescarAccessToken();
        if (!nuevoToken) throw new Error("sin sesión previa");
        setAccessToken(nuevoToken);
        const perfil = await cargarPerfil();
        if (!cancelado) setUsuario(perfil);
      } catch {
        if (!cancelado) cerrarSesionLocal();
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [cerrarSesionLocal]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    const perfil = await cargarPerfil();
    setUsuario(perfil);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      cerrarSesionLocal();
    }
  }, [cerrarSesionLocal]);

  const valor = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
