import { spawn } from "node:child_process";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { getAssetsList } from "./get-assets-list";
import { parseArgs } from "./parse-args";

const { port, assetsBaseDir, open } = parseArgs();

console.log(`Serving assets from: ${assetsBaseDir}`);
console.log(`Server running on port: ${port}`);
const url = `http://localhost:${port}`;
if (open) {
  // Defer opening slightly to ensure server is ready
  setTimeout(() => {
    try {
      const platform = process.platform;
      let cmd: string;
      let args: string[] = [];
      if (platform === "darwin") {
        cmd = "open";
        args = [url];
      } else if (platform === "win32") {
        cmd = "cmd";
        args = ["/c", "start", "", url];
      } else {
        cmd = "xdg-open";
        args = [url];
      }
      const child = spawn(cmd, args, { stdio: "ignore", detached: true });
      child.unref();
      console.log(`Opened browser at ${url}`);
    } catch (err) {
      console.warn(`Failed to open browser automatically: ${err}`);
    }
  }, 150);
}

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
  .get("/", serveStatic({ root: "./dist/client" }))
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
