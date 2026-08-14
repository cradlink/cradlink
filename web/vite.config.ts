import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  preview: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
