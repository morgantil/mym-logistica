import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "MyM Logística",
        short_name: "MyM Logística",
        description: "Gestión de pedidos y logística de MyM Logística.",
        lang: "es",
        // Ícono placeholder (monograma "M" en el azul de la app) — reemplazar
        // cuando exista un logo real de MyM, ver DOCUMENTO TECNICO.md 6.2.
        theme_color: "#1d4ed8",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        // Solo assets estáticos del build — nunca respuestas de la API
        // (DOCUMENTO TECNICO.md sección 2, "Caché de la futura PWA": un
        // celular perdido/robado no debería tener datos cacheados). Al no
        // declarar runtimeCaching para el origen de la API (localhost:3000,
        // distinto del origen de esta app), el service worker nunca la toca.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
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
