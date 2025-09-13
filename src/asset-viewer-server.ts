#!/usr/bin/env node

/**
 * Single-command Asset Viewer Server
 * - Scans public/assets (models + textures)
 * - Serves a self-contained Viewer UI at /
 * - Provides /api/assets returning JSON list
 * - Auto-opens browser
 */

import { exec } from "node:child_process";
import { readdir, stat, readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { Command } from "commander";

type AssetType = "model" | "texture";

interface AssetInfo {
  readonly name: string; // base name without extension
  readonly filename: string;
  readonly type: AssetType;
  readonly path: string; // public URL path
}

// Values will be injected after CLI parsing
let PORT = 5735;
let HOST = "localhost";
let PUBLIC_DIR: string = join(process.cwd(), "public");
let ASSETS_DIR: string = join(PUBLIC_DIR, "assets");
let ORIGIN = `http://${HOST}:${PORT}`;
const MODEL_EXTS: Set<string> = new Set([".glb", ".gltf"]);
const TEXTURE_EXTS: Set<string> = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      out.push(...(await listFilesRecursive(full)));
    } else out.push(full);
  }
  return out;
}

async function collectAssets(): Promise<AssetInfo[]> {
  const files = await listFilesRecursive(ASSETS_DIR);
  const assets: AssetInfo[] = [];
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    let type: AssetType | null = null;
    if (MODEL_EXTS.has(ext)) type = "model";
    else if (TEXTURE_EXTS.has(ext)) type = "texture";
    if (!type) continue;
    const filename = file.substring(file.lastIndexOf("/") + 1);
    const name = filename.replace(ext, "");
    const relWithinAssets = file.substring(ASSETS_DIR.length).replace(/\\/g, "/");
    const urlPath = `/assets${relWithinAssets}`; // always serve under /assets
    assets.push({ name, filename, type, path: urlPath });
  }
  assets.sort((a, b) => a.filename.localeCompare(b.filename));
  return assets;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === "darwin" ? `open "${url}"` : platform === "win32" ? `start "" "${url}"` : `xdg-open "${url}"`;
  exec(command, (err) => {
    if (err) console.log("⚠️  Unable to auto-open browser:", err.message);
  });
}

// Static client now provided via prebuilt files (index.html, viewer.css, viewer.js)

class AssetViewerServer {
  assets: AssetInfo[] = [];
  private threeBase: string | null = null;
  constructor() { this.start(); }
  async refreshAssets(): Promise<void> { this.assets = await collectAssets(); }
  private resolveThreeBase(): string | null {
    if (this.threeBase) return this.threeBase;
    try {
      const pkgPath = require.resolve("three/package.json");
      this.threeBase = join(pkgPath, ".." );
      return this.threeBase;
    } catch { return null; }
  }
  private sendFile(res: ServerResponse, abs: string, contentType?: string): void {
    if (!existsSync(abs)) { this.notFound(res); return; }
    if (contentType) res.setHeader("Content-Type", contentType);
    createReadStream(abs).pipe(res);
  }
  private notFound(res: ServerResponse): void { res.statusCode = 404; res.end("Not found"); }
  private async handleApiAssets(res: ServerResponse): Promise<void> {
    await this.refreshAssets();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(this.assets));
  }
  private contentTypeFor(pathname: string): string | undefined {
    if (pathname.endsWith('.js')) return 'application/javascript; charset=utf-8';
    if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
    if (pathname.endsWith('.html')) return 'text/html; charset=utf-8';
    if (pathname.endsWith('.json')) return 'application/json; charset=utf-8';
    if (/[.](png|jpg|jpeg|webp)$/i.test(pathname)) return 'image/' + pathname.split('.').pop();
    if (/[.](glb)$/i.test(pathname)) return 'model/gltf-binary';
    if (/[.](gltf)$/i.test(pathname)) return 'model/gltf+json';
    return undefined;
  }
  start(): void {
    createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) return this.notFound(res);
      const url = new URL(req.url, ORIGIN);
      const pathname = url.pathname;
      if (pathname === '/api/assets') { void this.handleApiAssets(res); return; }
      if (pathname === '/' || pathname === '/index.html') {
        this.sendFile(res, join(process.cwd(), 'dist', 'client', 'index.html'), 'text/html; charset=utf-8');
        return;
      }
      if (pathname === '/viewer.css') { this.sendFile(res, join(process.cwd(), 'dist', 'client', 'viewer.css'), 'text/css; charset=utf-8'); return; }
      if (pathname === '/viewer.js') { this.sendFile(res, join(process.cwd(), 'dist', 'client', 'viewer.js'), 'application/javascript; charset=utf-8'); return; }
      if (pathname.startsWith('/assets/')) {
        const rel = pathname.substring('/assets/'.length);
        const abs = join(ASSETS_DIR, rel);
        this.sendFile(res, abs, this.contentTypeFor(pathname));
        return;
      }
      if (pathname.startsWith('/node_modules/three/')) {
        const base = this.resolveThreeBase();
        if (!base) { this.notFound(res); return; }
        const rel = pathname.substring('/node_modules/three/'.length);
        const abs = join(base, rel);
        this.sendFile(res, abs, this.contentTypeFor(pathname));
        return;
      }
      this.notFound(res);
    }).listen(PORT, HOST, () => {
      console.log(`🚀 Asset Viewer running: ${ORIGIN}`);
      console.log(`📁 Serving assets from ${ASSETS_DIR}`);
      openBrowser(ORIGIN);
    });
  }
}

function parseCli(): { assetsBaseDir: string; port: number } {
  const program = new Command();
  program
    .name("asset-viewer")
    .argument("<path>", "Path to assets directory (will look for assets inside it or use it directly if contains models/textures)")
  .option("-p, --port <number>", "Port to run the server on", (v: string) => Number.parseInt(v, 10))
    .version(process.env.npm_package_version || "0.0.0")
    .allowExcessArguments(false)
    .showHelpAfterError();

  program.parse(process.argv);
  const opts = program.opts<{ port?: number }>();
  const rawPath = program.args[0];
  if (!rawPath) {
    program.error("Path is required");
  }
  const abs = resolve(process.cwd(), rawPath);
  if (!existsSync(abs)) {
    program.error(`Provided path does not exist: ${abs}`);
  }
  PORT = opts.port && !Number.isNaN(opts.port) ? opts.port : PORT;
  ORIGIN = `http://${HOST}:${PORT}`;

  // Determine if provided path itself should act as assets directory or contains a public/assets structure.
  // Accept either: path points directly to the directory containing model/texture files, or path/public/assets.
  const candidateAssets = abs;
  const altPublic = join(abs, "public", "assets");
  if (existsSync(altPublic)) {
    PUBLIC_DIR = join(abs, "public");
    ASSETS_DIR = altPublic;
  } else {
    PUBLIC_DIR = abs; // serve under /assets by mapping the directory directly
    ASSETS_DIR = abs;
  }
  return { assetsBaseDir: ASSETS_DIR, port: PORT };
}

parseCli();
new AssetViewerServer();
