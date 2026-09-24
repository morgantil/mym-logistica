import { AxiosError } from "axios";

// Mensaje legible de un error de la API (los DTO devuelven `message` como
// texto o como lista de textos) — con un texto genérico de respaldo.
export function mensajeErrorApi(error: unknown, respaldo = "No se pudo completar la operación."): string {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const mensaje = error.response.data.message;
    return Array.isArray(mensaje) ? mensaje.join(" ") : mensaje;
  }
  return respaldo;
}
