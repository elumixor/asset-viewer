import { useRef, useEffect } from "react";
import {
  Scene as ThreeScene,
  Color as ThreeColor,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  Box3,
  Vector3,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export function AssetCard3D({ gltf, onMeta }: { gltf: GLTF; onMeta: (meta: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new ThreeScene();
    scene.background = new ThreeColor(0x0d141d);
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

    // Add the model to the scene
    const model = gltf.scene;
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    model.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2 / maxDim;
    if (scale < 1) model.scale.setScalar(scale);
    scene.add(model);

    onMeta(`Scenes:${gltf.scenes.length} Anim:${gltf.animations.length}`);

    function animate() {
      scene.rotation.y += 0.01;
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    }
    animate();

    return () => {
      renderer.dispose();
    };
  }, [gltf, onMeta]);

  return <canvas ref={canvasRef} />;
}
