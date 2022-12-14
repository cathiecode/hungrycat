import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // outDir γ« manifest.json γεΊε
    manifest: true,
  },
  base: "/ui/",
  server: {
    origin: "http://localhost:5173",
  },
});
