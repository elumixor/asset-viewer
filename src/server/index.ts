// NOTE: Avoid relying on __dirname because Bun's bundler can bake it at build time.
// Using import.meta.url ensures the path is resolved relative to the final compiled file.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
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

// Assemble app via factory
const app = createApp({ assetsBaseDir, clientRoot });

// Defer opening slightly to ensure server is ready
if (open) setTimeout(() => openBrowser(), 150);

export default { port, fetch: app.fetch };
