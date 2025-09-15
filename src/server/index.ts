// NOTE: Avoid relying on __dirname because Bun's bundler can bake it at build time.
// Using import.meta.url ensures the path is resolved relative to the final compiled file.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { getAssetsList } from "./get-assets-list";
import { openBrowser } from "./open-browser";
import { parseArgs } from "./parse-args";

const { port, assetsBaseDir, open } = parseArgs();

// Determine the path to the built client directory relative to the compiled server file.
// Compiled layout assumption: dist/server/index.js (this file) & dist/client/* (static assets)
// new URL("../client", import.meta.url) -> dist/client
const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const clientRoot = resolve(__dir, "../client");

console.log(`Serving assets from: ${assetsBaseDir}`);
console.log(`Server running on port: ${port}`);
console.log(`Serving client from: ${clientRoot}`);
export const url = `http://localhost:${port}`;

// Defer opening slightly to ensure server is ready
if (open) setTimeout(() => openBrowser(), 150);

const app = new Hono()
  .use(
    "/*",
    cors({
      origin: (origin) => {
        // allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return "*";

        // if not in list, block
        return "http://localhost:5173";
      },
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  // Serve the built client on the root path (single HTML file)
  .get("/", serveStatic({ root: clientRoot }))
  // Serve the list of assets as JSON
  .get("/asset-list", async (c) => {
    let assets = await getAssetsList(assetsBaseDir);

    // Remove the base path from the asset paths for client use
    assets = assets.map((a) => a.replace(assetsBaseDir, "").replace(/^\/+/, ""));
    return c.json({ assets, basePath: assetsBaseDir });
  })
  // Handle asset requests. We set root to the absolute assetsBaseDir and only return a path
  // relative to that root. Returning an absolute filesystem path from rewriteRequestPath
  // is rejected by the static middleware (it performs a safety check ensuring the final
  // resolved path stays within the configured root). That is why a relative path worked
  // while the absolute one did not.
  .get(
    "/assets/*",
    serveStatic({
      root: assetsBaseDir,
      rewriteRequestPath: (path) => {
        // Original request path looks like: /assets/dir/file.png
        // We strip the leading /assets so the remainder is resolved relative to root.
        let relative = path.replace(/^\/assets/, "");
        if (relative.startsWith("/")) relative = relative.slice(1); // ensure no leading slash
        // Log the mapping for debugging
        console.log(`Static asset request => root: ${assetsBaseDir}, req: ${path}, resolved: ${relative}`);
        // If someone requests exactly /assets, serve index ("" becomes "/" internally) or return empty
        return relative || "."; // "." means the directory root
      },
    }),
  );

export default { port, fetch: app.fetch };
