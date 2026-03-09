import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { metaApiPlugin } from "./vite-api-plugin.js";

export default defineConfig({
  plugins: [react(), metaApiPlugin()],
  build: {
    target: "es2020",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
