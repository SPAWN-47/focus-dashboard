import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async ({ command }) => {
  const devPlugins = [];

  if (command === "serve") {
    // Only load the dev API plugin when running the dev server.
    // Importing it during `vite build` would pull in lib/auth.js
    // (bcryptjs / jsonwebtoken) which breaks the build phase.
    const { metaApiPlugin } = await import("./vite-api-plugin.js");
    devPlugins.push(metaApiPlugin());
  }

  return {
    plugins: [react(), ...devPlugins],
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
  };
});
