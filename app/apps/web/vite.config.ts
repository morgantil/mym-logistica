import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  optimizeDeps: {
    // @mym/shared-types se compila en CommonJS (apps/api, que también lo
    // consume, es Nest/CommonJS) — es un paquete "linkeado" del monorepo, así
    // que Vite no lo pre-empaqueta a ESM por defecto en dev como sí hace con
    // las dependencias de npm normales. Sin esto, el navegador falla al
    // importarlo directamente en modo dev (en build sí funciona solo).
    include: ["@mym/shared-types"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
