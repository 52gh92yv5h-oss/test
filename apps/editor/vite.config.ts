import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Bygger till en enda fristående index.html - kan köras direkt från en
// lokal katalog utan webbserver eller installationssteg.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
