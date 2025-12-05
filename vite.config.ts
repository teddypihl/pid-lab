import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/pid-lab/",   // 👈 viktigt för GitHub Pages-projekt-sida
  plugins: [react()],
});
