import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, "../media/clipboard-history"),
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "[name].js",
        assetFileNames: assetInfo => {
          if (assetInfo.names.some(name => name.endsWith(".css"))) {
            return "index.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
