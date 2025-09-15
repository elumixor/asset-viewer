import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { getAssetsList } from "./get-assets-list";

export interface CreateAppOptions {
  assetsBaseDir: string;
  clientRoot: string;
}

// Responsible only for assembling and returning a configured Hono app.
export function createApp({ assetsBaseDir, clientRoot }: CreateAppOptions) {
  const app = new Hono()
    .use(
      "/*",
      cors({
        origin: (origin) => {
          if (!origin) return "*"; // allow requests with no origin (curl, server-to-server)
          return "http://localhost:5173"; // TODO: make configurable if needed
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
      assets = assets.map((a) => a.replace(assetsBaseDir, "").replace(/^\/+/u, ""));
      return c.json({ assets, basePath: assetsBaseDir });
    })
    // Serve static assets from provided base directory under /assets/*
    .get(
      "/assets/*",
      serveStatic({
        root: assetsBaseDir,
        rewriteRequestPath: (path) => {
          let relative = path.replace(/^\/assets/u, "");
          if (relative.startsWith("/")) relative = relative.slice(1);
          console.log(`Static asset request => root: ${assetsBaseDir}, req: ${path}, resolved: ${relative}`);
          return relative || "."; // "." means directory root
        },
      }),
    );

  return app;
}
