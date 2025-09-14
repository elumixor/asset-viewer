import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const serverPort = Number(process.env.ASSET_VIEWER_SERVER_PORT || "5735");

export default defineConfig({
  root: path.resolve(__dirname, "src", "client"),
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, "dist", "client"),
    assetsDir: "resources",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: `http://localhost:${serverPort}`, changeOrigin: true },
      "/assets": { target: `http://localhost:${serverPort}`, changeOrigin: true },
    },
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
});
