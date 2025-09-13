// Client viewer logic extracted from inline HTML script
let THREE: any; // runtime dynamic import
let GLTFLoader: any;

async function ensureThree() {
  try {
    THREE = await import('three');
    ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
  } catch (e) {
    console.warn('Local three import failed, falling back to CDN', e);
  // @ts-ignore dynamic CDN fallback
  THREE = await import('https://unpkg.com/three@0.168.0/build/three.module.js');
  // @ts-ignore dynamic CDN fallback
  ({ GLTFLoader } = await import('https://unpkg.com/three@0.168.0/examples/jsm/loaders/GLTFLoader.js'));
  }
}

interface AssetInfo {
  name: string;
  filename: string;
  type: 'model' | 'texture';
  path: string;
}

const grid = document.getElementById('grid')!;
const countEl = document.getElementById('count')!;
const overlay = document.getElementById('loading')! as HTMLDivElement;
(document.getElementById('reloadBtn') as HTMLButtonElement).onclick = () => load();

async function load(){
  overlay.style.display='flex';
  grid.innerHTML='';
  try {
    const res = await fetch('/api/assets');
    const assets: AssetInfo[] = await res.json();
    countEl.textContent = assets.length + ' assets';
    for (const a of assets) addCard(a);
  } catch (e) {
    console.error(e);
    countEl.textContent = 'Error loading assets';
  } finally {
    overlay.style.display='none';
  }
}

function addCard(asset: AssetInfo){
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
  loader.load(asset.path,(gltf: any)=>{
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
  },undefined,(err: any)=>{meta.textContent='Error';console.error(err);});
  function animate(){
    scene.rotation.y += 0.01;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
}

(async function init(){
  await ensureThree();
  load();
})();
