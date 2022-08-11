import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // outDir に manifest.json を出力
    manifest: true,
    rollupOptions: {
      input: "src/main.tsx",
    },
  },
  base: "/ui",
  server: {
    origin: "http://localhost:5173",
  },
});
