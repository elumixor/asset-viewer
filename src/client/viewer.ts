import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface AssetInfo {
  name: string;
  filename: string;
  type: "model" | "texture";
  path: string;
}

const grid = document.getElementById("grid") as HTMLElement;
const countEl = document.getElementById("count") as HTMLElement;
const overlay = document.getElementById("loading") as HTMLDivElement;
(document.getElementById("reloadBtn") as HTMLButtonElement).onclick = () => load();

async function load() {
  overlay.style.display = "flex";
  grid.innerHTML = "";
  try {
    const res = await fetch("/api/assets");
    const assets: AssetInfo[] = await res.json();
    countEl.textContent = `${assets.length} assets`;
    for (const a of assets) addCard(a);
  } catch (e) {
    console.error(e);
    countEl.textContent = "Error loading assets";
  } finally {
    overlay.style.display = "none";
  }
}

function addCard(asset: AssetInfo) {
  const card = document.createElement("div");
  card.className = "card";
  const thumb = document.createElement("div");
  thumb.className = "thumb";
  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = asset.type;
  thumb.appendChild(badge);
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = asset.filename;
  const meta = document.createElement("div");
  meta.className = "meta";
  card.appendChild(thumb);
  card.appendChild(name);
  card.appendChild(meta);
  grid.appendChild(card);
  if (asset.type === "texture") {
    const img = new Image();
    img.onload = () => {
      meta.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
    };
    img.src = asset.path;
    thumb.appendChild(img);
    return;
  }
  // model preview
  const canvas = document.createElement("canvas");
  thumb.appendChild(canvas);
  const scene = new Scene();
  scene.background = new Color(0x0d141d);
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(2.5, 2, 2.5);
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(256, 256, false);
  const amb = new AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 6, 4);
  scene.add(dir);
  const gridHelper = new GridHelper(6, 6, 0x223547, 0x152433);
  scene.add(gridHelper);
  const loader = new GLTFLoader();
  loader.load(
    asset.path,
    (gltf: GLTF) => {
      const model = gltf.scene;
      console.log("Loaded", asset.filename, gltf);
      // center + scale
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      model.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1 / maxDim;
      if (scale < 1) model.scale.setScalar(scale);
      scene.add(model);
      meta.textContent = `Scenes:${gltf.scenes.length} Anim:${gltf.animations.length}`;
    },
    undefined,
    (err: unknown) => {
      meta.textContent = "Error";
      console.error(err);
    },
  );
  function animate() {
    scene.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

void load();
