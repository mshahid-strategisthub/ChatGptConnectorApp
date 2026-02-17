import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "widget-react"),
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "assets/aurie-quick-processing-react"),
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    assetsDir: "",
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          if ((assetInfo.name || "").endsWith(".css")) return "index.css";
          return "assets/[name][extname]";
        },
      },
    },
  },
});


