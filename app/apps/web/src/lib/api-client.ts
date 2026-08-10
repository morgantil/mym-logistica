import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// El access token vive solo en memoria (nunca localStorage/sessionStorage) —
// DOCUMENTO TECNICO.md sección 2 y 6.3. Se pierde al recargar la página a
// propósito; por eso initAuth() en auth-context.tsx pide uno nuevo al arrancar
// usando la cookie httpOnly del refresh token.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  // Necesario para que la cookie httpOnly del refresh token viaje en
  // /auth/refresh y /auth/logout.
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// Callback que registra AuthProvider para reaccionar cuando ni el access
// token ni el refresh sirven más (ej. mandar a Login). Vive acá y no en un
// import circular hacia el contexto de React.
let onSesionExpirada: (() => void) | null = null;

export function registrarHandlerSesionExpirada(handler: () => void) {
  onSesionExpirada = handler;
}

let refrescandoPromise: Promise<string | null> | null = null;

async function refrescarAccessToken(): Promise<string | null> {
  // Si ya hay un refresh en curso (ej. varios requests en paralelo recibieron
  // 401 al mismo tiempo), todos esperan la misma promesa en vez de disparar
  // refreshes duplicados que rotarían el token entre sí.
  if (!refrescandoPromise) {
    refrescandoPromise = axios
      .post<{ accessToken: string | null }>(`${API_URL}/auth/refresh`, null, {
        withCredentials: true,
      })
      .then((res) => res.data.accessToken)
      .catch(() => null)
      .finally(() => {
        refrescandoPromise = null;
      });
  }
  return refrescandoPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _reintentado?: boolean }) | undefined;
    const esRefresh = config?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && config && !config._reintentado && !esRefresh) {
      config._reintentado = true;
      const nuevoToken = await refrescarAccessToken();
      if (nuevoToken) {
        setAccessToken(nuevoToken);
        config.headers.set("Authorization", `Bearer ${nuevoToken}`);
        return apiClient(config);
      }
      setAccessToken(null);
      onSesionExpirada?.();
    }

    return Promise.reject(error);
  },
);
