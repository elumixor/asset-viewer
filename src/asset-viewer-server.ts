#!/usr/bin/env bun

/**
 * Single-command Asset Viewer Server
 * - Scans public/assets (models + textures)
 * - Serves a self-contained Viewer UI at /
 * - Provides /api/assets returning JSON list
 * - Auto-opens browser
 */

import { exec } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";

type AssetType = "model" | "texture";

interface AssetInfo {
  readonly name: string; // base name without extension
  readonly filename: string;
  readonly type: AssetType;
  readonly path: string; // public URL path
}

const PORT = 5735; // pick a port unlikely to clash with Vite (5173)
const HOST = "localhost";
const ORIGIN = `http://${HOST}:${PORT}`;
const PUBLIC_DIR: string = join(process.cwd(), "public");
const ASSETS_DIR: string = join(PUBLIC_DIR, "assets");
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
    const rel = file.substring(PUBLIC_DIR.length).replace(/\\/g, "/");
    assets.push({ name, filename, type, path: rel });
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

function htmlPage(): string {
  // Inline minimal viewer. Uses import map to resolve three from local node_modules (fallback to CDN if missing)
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />
  <title>HYPO Asset Grid Viewer</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <script type="importmap">{ "imports": { "three": "/node_modules/three/build/three.module.js", "three/examples/jsm/loaders/GLTFLoader.js": "/node_modules/three/examples/jsm/loaders/GLTFLoader.js" } }</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;background:#0f1623;color:#fff;min-height:100vh;padding:18px;}
    h1{font-size:1.8rem;margin-bottom:12px;background:linear-gradient(90deg,#4ec9ff,#6cf);-webkit-background-clip:text;color:transparent;font-weight:600}
    .toolbar{display:flex;gap:12px;align-items:center;margin-bottom:18px;flex-wrap:wrap}
    button{background:linear-gradient(45deg,#4ec9ff,#6cf);color:#062030;border:none;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer}
    button:disabled{opacity:.5;cursor:not-allowed}
    #grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
    .card{background:#152233;border:1px solid #223547;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden}
    .thumb{background:#111;border:1px solid #223547;border-radius:8px;display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;position:relative;overflow:hidden}
    canvas{width:100%;height:100%;display:block}
    img{max-width:100%;max-height:100%;object-fit:contain;display:block}
    .badge{position:absolute;top:6px;left:6px;background:#4ec9ff;color:#052030;font-size:10px;padding:3px 6px;border-radius:6px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .name{font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#9cd6ff}
    .meta{font-size:.65rem;opacity:.65;line-height:1.2;min-height:1em}
    footer{margin-top:30px;font-size:.65rem;opacity:.5}
    .spinner{width:22px;height:22px;border:3px solid #223547;border-top:3px solid #4ec9ff;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading-overlay{position:fixed;inset:0;background:#0f1623;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font-size:.9rem;z-index:10}
  </style></head><body>
  <div class="loading-overlay" id="loading"><div class="spinner"></div><div>Scanning assets...</div></div>
  <h1>HYPO Asset Viewer</h1>
  <div class="toolbar"><button id="reloadBtn">Reload</button><span id="count"></span></div>
  <div id="grid"></div>
  <footer>Auto-generated viewer • Three.js CDN • HYPO dev tool</footer>
  <script type="module">
    // Attempt local import (served via /node_modules). If it fails, dynamically fall back to CDN.
    let THREE;
    let GLTFLoader;
    try {
      THREE = await import('three');
      ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
    } catch (e) {
      console.warn('Local three import failed, falling back to CDN', e);
      THREE = await import('https://unpkg.com/three@0.168.0/build/three.module.js');
      ({ GLTFLoader } = await import('https://unpkg.com/three@0.168.0/examples/jsm/loaders/GLTFLoader.js'));
    }
    const grid = document.getElementById('grid');
    const countEl = document.getElementById('count');
    const overlay = document.getElementById('loading');
    document.getElementById('reloadBtn').onclick = load;
    async function load(){
      overlay.style.display='flex';
      grid.innerHTML='';
      const res = await fetch('/api/assets');
      const assets = await res.json();
      countEl.textContent = assets.length + ' assets';
      for(const a of assets) addCard(a);
      overlay.style.display='none';
    }
    function addCard(asset){
      const card = document.createElement('div');
      card.className='card';
      const thumb = document.createElement('div');
      thumb.className='thumb';
      const badge = document.createElement('div');
      badge.className='badge';
      badge.textContent=asset.type;
      thumb.appendChild(badge);
      const name = document.createElement('div');
      name.className='name';
      name.textContent=asset.filename;
      const meta = document.createElement('div');
      meta.className='meta';
      card.appendChild(thumb);card.appendChild(name);card.appendChild(meta);grid.appendChild(card);
      if(asset.type==='texture'){
        const img = new Image();
        img.onload=()=>{meta.textContent=img.naturalWidth+'x'+img.naturalHeight;};
        img.src=asset.path;thumb.appendChild(img);return;
      }
      // model preview
      const canvas = document.createElement('canvas');
      thumb.appendChild(canvas);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d141d);
      const camera = new THREE.PerspectiveCamera(45,1,0.1,100);
      camera.position.set(2.5,2,2.5);
      const renderer = new THREE.WebGLRenderer({canvas,antialias:true});
      renderer.setSize(256,256,false);
      const amb = new THREE.AmbientLight(0xffffff,0.6);scene.add(amb);
      const dir = new THREE.DirectionalLight(0xffffff,0.8);dir.position.set(5,6,4);scene.add(dir);
      const gridHelper = new THREE.GridHelper(6,6,0x223547,0x152433);scene.add(gridHelper);
      const loader = new GLTFLoader();
      loader.load(asset.path,gltf=>{
        const model = gltf.scene;
        // center + scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x,size.y,size.z)||1;
        const scale = 2 / maxDim; if(scale < 1) model.scale.setScalar(scale);
        scene.add(model);
        meta.textContent = 'Scenes:'+gltf.scenes.length+' Anim:'+gltf.animations.length;
      },undefined,err=>{meta.textContent='Error';console.error(err);});
      function animate(){
        scene.rotation.y += 0.01;
        renderer.render(scene,camera);
        requestAnimationFrame(animate);
      }
      animate();
    }
    load();
  </script>
  </body></html>`;
}

class AssetViewerServer {
  assets: AssetInfo[] = [];
  constructor() {
    this.start();
  }

  async refreshAssets(): Promise<void> {
    this.assets = await collectAssets();
  }

  start(): void {
    Bun.serve({
      port: PORT,
      fetch: async (req: Request): Promise<Response> => {
        const url = new URL(req.url);
        if (url.pathname === "/api/assets") {
          await this.refreshAssets();
          return new Response(JSON.stringify(this.assets), {
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          });
        }
        if (url.pathname === "/" || url.pathname === "/index.html") {
          return new Response(htmlPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
        // Static assets under /assets
        if (url.pathname.startsWith("/assets/")) {
          try {
            const filePath = join(PUBLIC_DIR, url.pathname);
            const file = await Bun.file(filePath);
            if (!(await file.exists())) return new Response("Not found", { status: 404 });
            return new Response(file);
          } catch {
            return new Response("Not found", { status: 404 });
          }
        }
        // Expose node_modules selectively (security: only allow three package)
        if (url.pathname.startsWith("/node_modules/three/")) {
          try {
            const nmPath = join(process.cwd(), url.pathname);
            const file = await Bun.file(nmPath);
            if (!(await file.exists())) return new Response("Not found", { status: 404 });
            // Basic content type inference
            const headers: Record<string, string> = {};
            if (nmPath.endsWith(".js")) headers["Content-Type"] = "application/javascript; charset=utf-8";
            if (nmPath.endsWith(".json")) headers["Content-Type"] = "application/json; charset=utf-8";
            return new Response(file, { headers });
          } catch {
            return new Response("Not found", { status: 404 });
          }
        }
        return new Response("Not found", { status: 404 });
      },
    });
    console.log(`🚀 Asset Viewer running: ${ORIGIN}`);
    console.log("📁 Serving assets from public/assets");
    openBrowser(ORIGIN);
  }
}

new AssetViewerServer();
